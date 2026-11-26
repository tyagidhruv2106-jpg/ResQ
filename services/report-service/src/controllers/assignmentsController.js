const { db, response, messaging } = require('../../../../shared');
const { successResponse, errorResponse } = response;

/**
 * Helper: look up organization_id for a user via organization_members.
 * Returns null if the user has no org membership.
 */
async function resolveOrgId(userId, overrideOrgId) {
  if (overrideOrgId) return overrideOrgId;

  const result = await db.query(
    `SELECT organization_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return result.rows.length > 0 ? result.rows[0].organization_id : null;
}

/**
 * GET /api/v1/reports/available
 * Lists reports with status IN ('reported','matching') for NGO view.
 * Joins rescue_assignments to show if the requesting org already has an assignment.
 */
async function getAvailableReports(req, res, next) {
  try {
    const { limit = 20, offset = 0 } = req.query;

    // Determine the requesting org (optional — used to annotate already_assigned)
    let orgId = null;
    if (req.user) {
      orgId = await resolveOrgId(req.user.id, req.query.organization_id);
    }

    const values = [parseInt(limit, 10), parseInt(offset, 10)];

    const querySql = `
      SELECT
        rr.id,
        rr.reporter_id,
        rr.animal_type,
        rr.breed,
        rr.condition_description,
        rr.severity_level,
        rr.photo_url,
        ST_Y(rr.location) AS latitude,
        ST_X(rr.location) AS longitude,
        rr.address_text,
        rr.status,
        rr.created_at,
        rr.updated_at,
        ra.id            AS assignment_id,
        ra.status        AS assignment_status,
        ra.organization_id AS assigned_org_id,
        o.name           AS assigned_org_name
      FROM rescue_reports rr
      LEFT JOIN rescue_assignments ra
        ON ra.report_id = rr.id
        AND ra.status NOT IN ('rejected', 'cancelled')
      LEFT JOIN organizations o ON o.id = ra.organization_id
      WHERE rr.status IN ('reported', 'matching')
      ORDER BY rr.created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await db.query(querySql, values);

    // Annotate rows with already_assigned flag for the requesting org
    const reports = result.rows.map((row) => ({
      ...row,
      already_assigned_by_my_org: orgId ? row.assigned_org_id === orgId : false,
    }));

    return successResponse(res, { reports, count: reports.length }, 'Available reports retrieved.');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/reports/:id/accept
 * NGO user accepts an open report. Runs in a DB transaction.
 */
async function acceptReport(req, res, next) {
  const client = await db.getPool().connect();
  try {
    const { id: reportId } = req.params;
    const { notes } = req.body;

    if (!req.user || !req.user.id) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    // Resolve organization
    const orgId = await resolveOrgId(req.user.id, req.query.organization_id || req.body.organization_id);
    if (!orgId) {
      return errorResponse(res, 'No organization membership found for this user. Provide organization_id explicitly.', 400);
    }

    // Validate report exists and is in an acceptable status
    const reportCheck = await client.query(
      `SELECT id, status, reporter_id, animal_type FROM rescue_reports WHERE id = $1`,
      [reportId]
    );
    if (reportCheck.rows.length === 0) {
      return errorResponse(res, `Report with ID '${reportId}' not found.`, 404);
    }
    const report = reportCheck.rows[0];
    if (!['reported', 'matching'].includes(report.status)) {
      return errorResponse(
        res,
        `Report is not available for acceptance. Current status: '${report.status}'.`,
        409
      );
    }

    await client.query('BEGIN');

    // 1. INSERT rescue_assignment
    const assignResult = await client.query(
      `INSERT INTO rescue_assignments
         (report_id, organization_id, assigned_rescuer_id, status, responded_at, response_notes)
       VALUES ($1, $2, $3, 'accepted', NOW(), $4)
       RETURNING *`,
      [reportId, orgId, req.user.id, notes || null]
    );
    const assignment = assignResult.rows[0];

    // 2. UPDATE rescue_reports status → 'assigned'
    await client.query(
      `UPDATE rescue_reports SET status = 'assigned', updated_at = NOW() WHERE id = $1`,
      [reportId]
    );

    // 3. INSERT rescue_tracking_updates
    await client.query(
      `INSERT INTO rescue_tracking_updates
         (report_id, assignment_id, updated_by, status_update, notes)
       VALUES ($1, $2, $3, 'assigned', $4)`,
      [reportId, assignment.id, req.user.id, notes || 'Report accepted and assigned.']
    );

    await client.query('COMMIT');

    // Publish RabbitMQ event (non-blocking — failure does not roll back)
    try {
      await messaging.publishEvent(
        'rescue.assigned',
        {
          reportId,
          organizationId: orgId,
          assignmentId: assignment.id,
          assignedAt: assignment.responded_at,
          assignedBy: req.user.id,
          reporterId: report.reporter_id,
          animalType: report.animal_type,
        },
        'RescueAssigned'
      );
    } catch (msgErr) {
      console.error('[Assignments] Warning: Failed to publish rescue.assigned event:', msgErr.message);
    }

    return successResponse(res, assignment, 'Report accepted and assigned successfully.', 201);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error.code === '23505') {
      // unique_report_org constraint violation
      return errorResponse(res, 'Report already accepted by another organization.', 409);
    }
    next(error);
  } finally {
    client.release();
  }
}

/**
 * GET /api/v1/reports/assignments/mine
 * Returns all assignments for the user's organization, joined with report details.
 */
async function getMyAssignments(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    const orgId = await resolveOrgId(req.user.id, req.query.organization_id);
    if (!orgId) {
      return errorResponse(res, 'No organization membership found for this user.', 400);
    }

    const { status, limit = 20, offset = 0 } = req.query;
    const conditions = ['ra.organization_id = $1'];
    const values = [orgId];

    if (status) {
      values.push(status.toLowerCase());
      conditions.push(`ra.status = $${values.length}`);
    }

    values.push(parseInt(limit, 10));
    const limitPos = values.length;
    values.push(parseInt(offset, 10));
    const offsetPos = values.length;

    const querySql = `
      SELECT
        ra.id              AS assignment_id,
        ra.report_id,
        ra.organization_id,
        ra.assigned_rescuer_id,
        ra.status          AS assignment_status,
        ra.distance_meters,
        ra.response_notes,
        ra.offered_at,
        ra.responded_at,
        ra.completed_at,
        ra.created_at      AS assignment_created_at,
        rr.animal_type,
        rr.breed,
        rr.condition_description,
        rr.severity_level,
        rr.photo_url,
        ST_Y(rr.location)  AS latitude,
        ST_X(rr.location)  AS longitude,
        rr.address_text,
        rr.status          AS report_status,
        rr.created_at      AS report_created_at
      FROM rescue_assignments ra
      JOIN rescue_reports rr ON rr.id = ra.report_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ra.created_at DESC
      LIMIT $${limitPos} OFFSET $${offsetPos};
    `;

    const result = await db.query(querySql, values);

    // Count total
    const countResult = await db.query(
      `SELECT COUNT(*) FROM rescue_assignments WHERE organization_id = $1`,
      [orgId]
    );

    return successResponse(res, {
      assignments: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count, 10),
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    }, 'Your assignments retrieved.');
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/reports/:id/status
 * Update report status with valid transition enforcement.
 */
async function updateStatus(req, res, next) {
  const client = await db.getPool().connect();
  try {
    const { id: reportId } = req.params;
    const { status: newStatus, notes } = req.body;

    if (!req.user || !req.user.id) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    if (!newStatus) {
      return errorResponse(res, 'status is required in request body.', 400);
    }

    const validTransitions = {
      assigned: ['in_progress', 'cancelled'],
      in_progress: ['rescued', 'cancelled'],
      rescued: ['closed'],
      reported: ['cancelled'],
      matching: ['cancelled'],
    };

    // Fetch current report
    const reportResult = await client.query(
      `SELECT id, status, reporter_id, animal_type FROM rescue_reports WHERE id = $1`,
      [reportId]
    );
    if (reportResult.rows.length === 0) {
      return errorResponse(res, `Report with ID '${reportId}' not found.`, 404);
    }
    const currentReport = reportResult.rows[0];
    const currentStatus = currentReport.status;

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      return errorResponse(
        res,
        `Invalid status transition: '${currentStatus}' → '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}.`,
        422
      );
    }

    await client.query('BEGIN');

    // 1. UPDATE rescue_reports
    const updateResult = await client.query(
      `UPDATE rescue_reports
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING
         id, reporter_id, animal_type, breed, condition_description,
         severity_level, photo_url,
         ST_Y(location) AS latitude, ST_X(location) AS longitude,
         address_text, status, created_at, updated_at`,
      [newStatus, reportId]
    );
    const updatedReport = updateResult.rows[0];

    // 2. INSERT rescue_tracking_updates
    await client.query(
      `INSERT INTO rescue_tracking_updates
         (report_id, updated_by, status_update, notes)
       VALUES ($1, $2, $3, $4)`,
      [reportId, req.user.id, newStatus, notes || null]
    );

    await client.query('COMMIT');

    // Publish event (non-blocking)
    try {
      await messaging.publishEvent(
        'rescue.status_updated',
        {
          reportId,
          previousStatus: currentStatus,
          newStatus,
          updatedBy: req.user.id,
          reporterId: currentReport.reporter_id,
          animalType: currentReport.animal_type,
          updatedAt: updatedReport.updated_at,
        },
        'RescueStatusUpdated'
      );

      // If status changed to rescued, also publish rescue.completed
      if (newStatus === 'rescued') {
        await messaging.publishEvent(
          'rescue.completed',
          {
            reportId,
            status: newStatus,
            updatedBy: req.user.id,
            reporterId: currentReport.reporter_id,
            animalType: currentReport.animal_type,
            completedAt: updatedReport.updated_at,
          },
          'RescueCompleted'
        );
      }
    } catch (msgErr) {
      console.error('[Assignments] Warning: Failed to publish rescue.status_updated event:', msgErr.message);
    }

    return successResponse(res, updatedReport, `Report status updated to '${newStatus}'.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
}

/**
 * GET /api/v1/reports/:id/tracking
 * Returns all tracking updates for a report ordered chronologically.
 */
async function getTrackingHistory(req, res, next) {
  try {
    const { id: reportId } = req.params;

    // Verify report exists
    const reportCheck = await db.query(`SELECT id FROM rescue_reports WHERE id = $1`, [reportId]);
    if (reportCheck.rows.length === 0) {
      return errorResponse(res, `Report with ID '${reportId}' not found.`, 404);
    }

    const result = await db.query(
      `SELECT
         t.id,
         t.report_id,
         t.assignment_id,
         t.updated_by,
         u.full_name    AS updated_by_name,
         u.role         AS updated_by_role,
         t.status_update,
         t.notes,
         ST_Y(t.rescuer_location) AS rescuer_latitude,
         ST_X(t.rescuer_location) AS rescuer_longitude,
         t.created_at
       FROM rescue_tracking_updates t
       LEFT JOIN users u ON u.id = t.updated_by
       WHERE t.report_id = $1
       ORDER BY t.created_at ASC`,
      [reportId]
    );

    return successResponse(res, {
      report_id: reportId,
      tracking: result.rows,
      count: result.rows.length,
    }, 'Tracking history retrieved.');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAvailableReports,
  acceptReport,
  getMyAssignments,
  updateStatus,
  getTrackingHistory,
};

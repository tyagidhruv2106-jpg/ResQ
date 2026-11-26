const { db, response } = require('../../../../shared');
const { successResponse, errorResponse } = response;

/**
 * Dashboard statistics for admin
 * GET /api/v1/admin/stats
 */
async function getDashboardStats(req, res, next) {
  try {
    const statsSql = `
      SELECT
        (SELECT COUNT(*) FROM users)::int AS total_users,
        (SELECT COUNT(*) FROM organizations)::int AS total_organizations,
        (SELECT COUNT(*) FROM organizations WHERE is_verified = FALSE AND is_active = TRUE)::int AS pending_verifications,
        (SELECT COUNT(*) FROM rescue_reports)::int AS total_reports,
        (SELECT COUNT(*) FROM rescue_reports WHERE status IN ('reported','matching'))::int AS pending_reports,
        (SELECT COUNT(*) FROM rescue_reports WHERE status = 'rescued')::int AS rescued_count,
        (SELECT COUNT(*) FROM rescue_reports WHERE status = 'assigned' OR status = 'in_progress')::int AS active_rescues,
        (SELECT COUNT(*) FROM rescue_assignments WHERE status = 'accepted')::int AS total_assignments;
    `;

    const result = await db.query(statsSql);
    return successResponse(res, result.rows[0], 'Dashboard statistics retrieved.');
  } catch (error) {
    next(error);
  }
}

/**
 * List all users (admin only)
 * GET /api/v1/admin/users?role=&limit=&offset=
 */
async function getUsers(req, res, next) {
  try {
    const { role, limit = 20, offset = 0 } = req.query;

    const conditions = [];
    const values = [];

    if (role) {
      values.push(role);
      conditions.push(`role = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(parseInt(limit, 10));
    const limitPos = values.length;
    values.push(parseInt(offset, 10));
    const offsetPos = values.length;

    const querySql = `
      SELECT
        id, email, full_name, phone, role, is_active, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${limitPos} OFFSET $${offsetPos};
    `;

    const countSql = `SELECT COUNT(*) AS total FROM users ${whereClause};`;
    const countValues = values.slice(0, conditions.length);

    const [result, countResult] = await Promise.all([
      db.query(querySql, values),
      db.query(countSql, countValues),
    ]);

    return successResponse(res, {
      users: result.rows,
      count: result.rows.length,
      total: parseInt(countResult.rows[0].total, 10),
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    }, 'Users retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * List all rescue reports (admin only) with optional status filter
 * GET /api/v1/admin/reports?status=&limit=&offset=
 */
async function getReports(req, res, next) {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const conditions = [];
    const values = [];

    if (status) {
      values.push(status);
      conditions.push(`rr.status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(parseInt(limit, 10));
    const limitPos = values.length;
    values.push(parseInt(offset, 10));
    const offsetPos = values.length;

    const querySql = `
      SELECT
        rr.id,
        rr.reporter_user_id,
        rr.animal_type,
        rr.description,
        rr.status,
        rr.urgency_level,
        rr.address_text,
        ST_Y(rr.location) AS latitude,
        ST_X(rr.location) AS longitude,
        rr.created_at,
        rr.updated_at,
        o.name AS assigned_org_name,
        ra.status AS assignment_status
      FROM rescue_reports rr
      LEFT JOIN rescue_assignments ra ON ra.report_id = rr.id AND ra.status NOT IN ('rejected','cancelled')
      LEFT JOIN organizations o ON o.id = ra.organization_id
      ${whereClause}
      ORDER BY rr.created_at DESC
      LIMIT $${limitPos} OFFSET $${offsetPos};
    `;

    const countSql = `SELECT COUNT(*) AS total FROM rescue_reports rr ${whereClause};`;
    const countValues = values.slice(0, conditions.length);

    const [result, countResult] = await Promise.all([
      db.query(querySql, values),
      db.query(countSql, countValues),
    ]);

    return successResponse(res, {
      reports: result.rows,
      count: result.rows.length,
      total: parseInt(countResult.rows[0].total, 10),
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    }, 'Reports retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  getUsers,
  getReports,
};

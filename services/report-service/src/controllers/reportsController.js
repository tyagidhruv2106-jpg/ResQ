const { db, response, messaging } = require('../../../../shared');
const { successResponse, errorResponse, validateCoordinates } = response;

/**
 * GET /api/v1/reports/my
 * Returns reports submitted by the authenticated user (reporter_id = req.user.id).
 */
async function getMyReports(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    const { status, limit = 20, offset = 0 } = req.query;
    const conditions = ['reporter_id = $1'];
    const values = [req.user.id];

    if (status) {
      values.push(status.toLowerCase());
      conditions.push(`status = $${values.length}`);
    }

    values.push(parseInt(limit, 10));
    const limitPos = values.length;
    values.push(parseInt(offset, 10));
    const offsetPos = values.length;

    const querySql = `
      SELECT
        id,
        reporter_id,
        animal_type,
        breed,
        condition_description,
        severity_level,
        photo_url,
        ST_Y(location) AS latitude,
        ST_X(location) AS longitude,
        address_text,
        status,
        created_at,
        updated_at
      FROM rescue_reports
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${limitPos} OFFSET $${offsetPos};
    `;

    const result = await db.query(querySql, values);

    const countResult = await db.query(
      `SELECT COUNT(*) FROM rescue_reports WHERE reporter_id = $1`,
      [req.user.id]
    );

    return successResponse(res, {
      reports: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count, 10),
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    }, 'Your reports retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new animal distress report
 * POST /api/v1/reports
 */
async function createReport(req, res, next) {
  try {
    const {
      animal_type,
      breed,
      condition_description,
      severity_level = 'medium',
      latitude,
      longitude,
      address_text,
      photo_url,
      reporter_id,
    } = req.body;

    // Validation
    if (!animal_type || !condition_description) {
      return errorResponse(res, 'animal_type and condition_description are required.', 400);
    }

    if (latitude === undefined || longitude === undefined) {
      return errorResponse(res, 'latitude and longitude are required.', 400);
    }

    const coordCheck = validateCoordinates(latitude, longitude);
    if (!coordCheck.valid) {
      return errorResponse(res, coordCheck.error, 400);
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity_level.toLowerCase())) {
      return errorResponse(res, `Invalid severity_level. Must be one of: ${validSeverities.join(', ')}`, 400);
    }

    // Insert into PostgreSQL using PostGIS ST_SetSRID(ST_MakePoint(lon, lat), 4326)
    // Note: PostGIS expects ST_MakePoint(longitude, latitude)
    const insertSql = `
      INSERT INTO rescue_reports (
        reporter_id,
        animal_type,
        breed,
        condition_description,
        severity_level,
        photo_url,
        location,
        address_text,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        ST_SetSRID(ST_MakePoint($7, $8), 4326),
        $9, 'reported'
      )
      RETURNING 
        id,
        reporter_id,
        animal_type,
        breed,
        condition_description,
        severity_level,
        photo_url,
        ST_Y(location) AS latitude,
        ST_X(location) AS longitude,
        address_text,
        status,
        created_at,
        updated_at;
    `;

    const values = [
      req.user?.id || reporter_id || null,
      animal_type.toLowerCase().trim(),
      breed ? breed.trim() : null,
      condition_description.trim(),
      severity_level.toLowerCase(),
      photo_url || null,
      coordCheck.longitude,
      coordCheck.latitude,
      address_text ? address_text.trim() : null,
    ];

    const result = await db.query(insertSql, values);
    const createdReport = result.rows[0];

    // Asynchronously publish RescueReportCreated event to RabbitMQ
    try {
      await messaging.publishEvent(
        'report.created',
        {
          reportId: createdReport.id,
          reporterId: createdReport.reporter_id,
          animalType: createdReport.animal_type,
          severityLevel: createdReport.severity_level,
          conditionDescription: createdReport.condition_description,
          latitude: parseFloat(createdReport.latitude),
          longitude: parseFloat(createdReport.longitude),
          addressText: createdReport.address_text,
          createdAt: createdReport.created_at,
        },
        'RescueReportCreated'
      );
    } catch (msgErr) {
      console.error('[Report Service] Warning: Failed to publish report.created event:', msgErr.message);
      // We still return 201 because the report is successfully persisted in PostgreSQL
    }

    return successResponse(res, createdReport, 'Animal distress report created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * List all animal distress reports with filtering and spatial coordinates
 * GET /api/v1/reports
 */
async function getReports(req, res, next) {
  try {
    const { status, animal_type, severity_level, limit = 20, offset = 0 } = req.query;

    const conditions = [];
    const values = [];

    if (status) {
      values.push(status.toLowerCase());
      conditions.push(`status = $${values.length}`);
    }

    if (animal_type) {
      values.push(animal_type.toLowerCase());
      conditions.push(`animal_type = $${values.length}`);
    }

    if (severity_level) {
      values.push(severity_level.toLowerCase());
      conditions.push(`severity_level = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(parseInt(limit, 10));
    const limitPlaceholder = `$${values.length}`;
    values.push(parseInt(offset, 10));
    const offsetPlaceholder = `$${values.length}`;

    const querySql = `
      SELECT 
        id,
        reporter_id,
        animal_type,
        breed,
        condition_description,
        severity_level,
        photo_url,
        ST_Y(location) AS latitude,
        ST_X(location) AS longitude,
        address_text,
        status,
        created_at,
        updated_at
      FROM rescue_reports
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder};
    `;

    const result = await db.query(querySql, values);

    // Count total reports matching query
    const countSql = `SELECT COUNT(*) FROM rescue_reports ${whereClause};`;
    const countResult = await db.query(countSql, values.slice(0, conditions.length));
    const total = parseInt(countResult.rows[0].count, 10);

    return successResponse(res, {
      reports: result.rows,
      pagination: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    }, 'Reports retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * Get single report by ID
 * GET /api/v1/reports/:id
 */
async function getReportById(req, res, next) {
  try {
    const { id } = req.params;

    const querySql = `
      SELECT 
        id,
        reporter_id,
        animal_type,
        breed,
        condition_description,
        severity_level,
        photo_url,
        ST_Y(location) AS latitude,
        ST_X(location) AS longitude,
        address_text,
        status,
        created_at,
        updated_at
      FROM rescue_reports
      WHERE id = $1;
    `;

    const result = await db.query(querySql, [id]);
    if (result.rows.length === 0) {
      return errorResponse(res, `Report with ID '${id}' not found.`, 404);
    }

    return successResponse(res, result.rows[0], 'Report details retrieved.');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyReports,
  createReport,
  getReports,
  getReportById,
};

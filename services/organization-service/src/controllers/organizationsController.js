const { db, response } = require('../../../../shared');
const { successResponse, errorResponse, validateCoordinates } = response;

/**
 * Register a new animal rescue organization
 * POST /api/v1/organizations
 */
async function registerOrganization(req, res, next) {
  try {
    const {
      name,
      registration_number,
      contact_email,
      contact_phone,
      address_text,
      latitude,
      longitude,
      operational_radius_km = 15.0,
      animal_types_handled = ['dog', 'cat'],
      is_verified = true,
    } = req.body;

    if (!name || !contact_email || !contact_phone || !address_text) {
      return errorResponse(res, 'name, contact_email, contact_phone, and address_text are required.', 400);
    }

    if (latitude === undefined || longitude === undefined) {
      return errorResponse(res, 'latitude and longitude are required.', 400);
    }

    const coordCheck = validateCoordinates(latitude, longitude);
    if (!coordCheck.valid) {
      return errorResponse(res, coordCheck.error, 400);
    }

    const radius = parseFloat(operational_radius_km);
    if (isNaN(radius) || radius <= 0) {
      return errorResponse(res, 'operational_radius_km must be a positive number.', 400);
    }

    const insertSql = `
      INSERT INTO organizations (
        name,
        registration_number,
        contact_email,
        contact_phone,
        address_text,
        location,
        operational_radius_km,
        animal_types_handled,
        is_verified,
        is_active
      ) VALUES (
        $1, $2, $3, $4, $5,
        ST_SetSRID(ST_MakePoint($6, $7), 4326),
        $8, $9, $10, TRUE
      )
      RETURNING 
        id,
        name,
        registration_number,
        contact_email,
        contact_phone,
        address_text,
        ST_Y(location) AS latitude,
        ST_X(location) AS longitude,
        operational_radius_km,
        animal_types_handled,
        is_verified,
        is_active,
        created_at,
        updated_at;
    `;

    const values = [
      name.trim(),
      registration_number ? registration_number.trim() : null,
      contact_email.trim().toLowerCase(),
      contact_phone.trim(),
      address_text.trim(),
      coordCheck.longitude,
      coordCheck.latitude,
      radius,
      Array.isArray(animal_types_handled) ? animal_types_handled : ['dog', 'cat'],
      Boolean(is_verified),
    ];

    const result = await db.query(insertSql, values);
    return successResponse(res, result.rows[0], 'Organization registered successfully.', 201);
  } catch (error) {
    if (error.code === '23505') {
      // Unique violation
      return errorResponse(res, 'An organization with this registration number already exists.', 409);
    }
    next(error);
  }
}

/**
 * List organizations with optional proximity filter
 * GET /api/v1/organizations?lat=&lon=&radius_km=
 */
async function getOrganizations(req, res, next) {
  try {
    const { lat, lon, radius_km, is_verified, limit = 20, offset = 0 } = req.query;

    let querySql;
    let values = [];

    // If coordinates are provided, perform PostGIS distance calculation
    if (lat !== undefined && lon !== undefined) {
      const coordCheck = validateCoordinates(lat, lon);
      if (!coordCheck.valid) {
        return errorResponse(res, coordCheck.error, 400);
      }

      const searchRadius = parseFloat(radius_km) || 50; // default 50km
      values = [coordCheck.longitude, coordCheck.latitude, searchRadius * 1000];

      let filterExtra = '';
      if (is_verified !== undefined) {
        values.push(is_verified === 'true');
        filterExtra += ` AND is_verified = $${values.length}`;
      }

      values.push(parseInt(limit, 10));
      const limitPos = values.length;
      values.push(parseInt(offset, 10));
      const offsetPos = values.length;

      querySql = `
        SELECT 
          id,
          name,
          registration_number,
          contact_email,
          contact_phone,
          address_text,
          ST_Y(location) AS latitude,
          ST_X(location) AS longitude,
          operational_radius_km,
          animal_types_handled,
          is_verified,
          is_active,
          ROUND(ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 2) AS distance_meters
        FROM organizations
        WHERE is_active = TRUE
          AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
          ${filterExtra}
        ORDER BY distance_meters ASC
        LIMIT $${limitPos} OFFSET $${offsetPos};
      `;
    } else {
      let filterExtra = '';
      if (is_verified !== undefined) {
        values.push(is_verified === 'true');
        filterExtra = ` WHERE is_verified = $1`;
      }

      values.push(parseInt(limit, 10));
      const limitPos = values.length;
      values.push(parseInt(offset, 10));
      const offsetPos = values.length;

      querySql = `
        SELECT 
          id,
          name,
          registration_number,
          contact_email,
          contact_phone,
          address_text,
          ST_Y(location) AS latitude,
          ST_X(location) AS longitude,
          operational_radius_km,
          animal_types_handled,
          is_verified,
          is_active,
          created_at,
          updated_at
        FROM organizations
        ${filterExtra}
        ORDER BY name ASC
        LIMIT $${limitPos} OFFSET $${offsetPos};
      `;
    }

    const result = await db.query(querySql, values);
    return successResponse(res, {
      organizations: result.rows,
      count: result.rows.length,
    }, 'Organizations retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * Get organization by ID
 * GET /api/v1/organizations/:id
 */
async function getOrganizationById(req, res, next) {
  try {
    const { id } = req.params;

    const querySql = `
      SELECT 
        id,
        name,
        registration_number,
        contact_email,
        contact_phone,
        address_text,
        ST_Y(location) AS latitude,
        ST_X(location) AS longitude,
        operational_radius_km,
        animal_types_handled,
        is_verified,
        is_active,
        created_at,
        updated_at
      FROM organizations
      WHERE id = $1;
    `;

    const result = await db.query(querySql, [id]);
    if (result.rows.length === 0) {
      return errorResponse(res, `Organization with ID '${id}' not found.`, 404);
    }

    return successResponse(res, result.rows[0], 'Organization details retrieved.');
  } catch (error) {
    next(error);
  }
}

/**
 * Update organization details
 * PUT /api/v1/organizations/:id
 */
async function updateOrganization(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      contact_email,
      contact_phone,
      address_text,
      operational_radius_km,
      animal_types_handled,
      is_verified,
      is_active,
    } = req.body;

    // Build dynamic SET clause
    const setClauses = [];
    const values = [];

    if (name !== undefined) { values.push(name.trim()); setClauses.push(`name = $${values.length}`); }
    if (contact_email !== undefined) { values.push(contact_email.trim().toLowerCase()); setClauses.push(`contact_email = $${values.length}`); }
    if (contact_phone !== undefined) { values.push(contact_phone.trim()); setClauses.push(`contact_phone = $${values.length}`); }
    if (address_text !== undefined) { values.push(address_text.trim()); setClauses.push(`address_text = $${values.length}`); }
    if (operational_radius_km !== undefined) {
      const radius = parseFloat(operational_radius_km);
      if (isNaN(radius) || radius <= 0) return errorResponse(res, 'operational_radius_km must be a positive number.', 400);
      values.push(radius); setClauses.push(`operational_radius_km = $${values.length}`);
    }
    if (animal_types_handled !== undefined) {
      values.push(Array.isArray(animal_types_handled) ? animal_types_handled : ['dog', 'cat']);
      setClauses.push(`animal_types_handled = $${values.length}`);
    }
    if (is_verified !== undefined) { values.push(Boolean(is_verified)); setClauses.push(`is_verified = $${values.length}`); }
    if (is_active !== undefined) { values.push(Boolean(is_active)); setClauses.push(`is_active = $${values.length}`); }

    if (setClauses.length === 0) {
      return errorResponse(res, 'No fields provided to update.', 400);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);
    const idPos = values.length;

    const updateSql = `
      UPDATE organizations
      SET ${setClauses.join(', ')}
      WHERE id = $${idPos}
      RETURNING
        id, name, registration_number, contact_email, contact_phone,
        address_text,
        ST_Y(location) AS latitude,
        ST_X(location) AS longitude,
        operational_radius_km, animal_types_handled,
        is_verified, is_active, created_at, updated_at;
    `;

    const result = await db.query(updateSql, values);
    if (result.rows.length === 0) {
      return errorResponse(res, `Organization with ID '${id}' not found.`, 404);
    }
    return successResponse(res, result.rows[0], 'Organization updated successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * Get the organization the authenticated user belongs to
 * GET /api/v1/organizations/my
 */
async function getOrganizationByUserId(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return errorResponse(res, 'Authentication required.', 401);

    const querySql = `
      SELECT
        o.id, o.name, o.registration_number, o.contact_email, o.contact_phone,
        o.address_text,
        ST_Y(o.location) AS latitude,
        ST_X(o.location) AS longitude,
        o.operational_radius_km, o.animal_types_handled,
        o.is_verified, o.is_active, o.created_at, o.updated_at,
        om.role AS member_role
      FROM organizations o
      JOIN organization_members om ON om.organization_id = o.id
      WHERE om.user_id = $1
      LIMIT 1;
    `;

    const result = await db.query(querySql, [userId]);
    if (result.rows.length === 0) {
      return errorResponse(res, 'No organization found for this user.', 404);
    }
    return successResponse(res, result.rows[0], 'Organization retrieved.');
  } catch (error) {
    next(error);
  }
}

/**
 * Verify or unverify an organization (admin only)
 * PATCH /api/v1/organizations/:id/verify
 */
async function verifyOrganization(req, res, next) {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    if (verified === undefined) {
      return errorResponse(res, 'Field "verified" (true/false) is required.', 400);
    }

    const updateSql = `
      UPDATE organizations
      SET is_verified = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING
        id, name, contact_email, is_verified, is_active, updated_at;
    `;

    const result = await db.query(updateSql, [Boolean(verified), id]);
    if (result.rows.length === 0) {
      return errorResponse(res, `Organization with ID '${id}' not found.`, 404);
    }
    return successResponse(res, result.rows[0], `Organization ${verified ? 'verified' : 'unverified'} successfully.`);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  getOrganizationByUserId,
  verifyOrganization,
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config, db, response } = require('../../../../shared');
const { successResponse, errorResponse } = response;

const SALT_ROUNDS = 10;
// Roles that any member of the public can self-register as.
// 'admin' and 'rescuer' must be provisioned by an administrator.
const PUBLIC_ROLES = ['citizen', 'org_admin'];
const VALID_ROLES = ['citizen', 'org_admin', 'rescuer', 'admin'];

/**
 * Generate a signed JWT for the given user record
 */
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * Strip password_hash from a user row before returning to the client
 */
function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

/**
 * POST /api/v1/auth/
 * Register a new user
 */
exports.register = async (req, res, next) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    // --- Validation ---
    const errors = [];
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      errors.push('full_name is required and must be at least 2 characters.');
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push('A valid email address is required.');
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      errors.push('Password is required and must be at least 8 characters.');
    }
    if (phone !== undefined && phone !== null && phone !== '') {
      if (typeof phone !== 'string' || !/^\+?[0-9\s\-()]{7,20}$/.test(phone.trim())) {
        errors.push('Phone number format is invalid.');
      }
    }
    const assignedRole = role && PUBLIC_ROLES.includes(role) ? role : 'citizen';
    if (role && !PUBLIC_ROLES.includes(role)) {
      // Silently downgrade privileged role requests to citizen (do not error — prevents enumeration)
      // Admin/rescuer accounts must be provisioned directly by a platform admin.
    }

    if (errors.length > 0) {
      return errorResponse(res, 'Validation failed.', 422, errors);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // --- Duplicate email check ---
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return errorResponse(res, 'An account with this email already exists.', 409);
    }

    // --- Hash password ---
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // --- Insert user ---
    const insertResult = await db.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), NOW())
       RETURNING id, email, full_name, phone, role, is_active, created_at, updated_at`,
      [
        normalizedEmail,
        password_hash,
        full_name.trim(),
        phone ? phone.trim() : null,
        assignedRole,
      ]
    );

    const newUser = insertResult.rows[0];
    const token = signToken(newUser);

    return successResponse(
      res,
      { token, user: sanitizeUser(newUser) },
      'Account created successfully.',
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 * Authenticate and return JWT
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // --- Validation ---
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // --- Fetch user ---
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const user = result.rows[0];

    // --- Check active status ---
    if (!user.is_active) {
      return errorResponse(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    // --- Compare password ---
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const token = signToken(user);

    return successResponse(
      res,
      { token, user: sanitizeUser(user) },
      'Login successful.',
      200
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 * Return the currently authenticated user (fresh from DB)
 */
exports.getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, email, full_name, phone, role, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'User not found.', 404);
    }

    return successResponse(res, { user: result.rows[0] }, 'User profile retrieved.');
  } catch (err) {
    next(err);
  }
};

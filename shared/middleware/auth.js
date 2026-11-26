const jwt = require('jsonwebtoken');
const config = require('../config');
const { errorResponse } = require('../utils/response');

/**
 * authenticate — verify Bearer JWT and attach decoded payload to req.user
 */
exports.authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication required. Please provide a valid token.', 401);
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // { id, email, role, full_name, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token has expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid token. Please log in again.', 401);
  }
};

/**
 * optionalAuthenticate — attach decoded payload if valid Bearer JWT present, continue otherwise
 */
exports.optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
  } catch (err) {
    // Silently continue without user on optional routes
  }
  next();
};

/**
 * authorize — restrict access to specified roles
 * Usage: authorize('admin', 'org_admin')
 */
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required.', 401);
  }

  if (!roles.includes(req.user.role)) {
    return errorResponse(
      res,
      `Access denied. Required role(s): ${roles.join(', ')}.`,
      403
    );
  }

  next();
};

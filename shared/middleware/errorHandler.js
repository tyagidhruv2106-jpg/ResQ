const config = require('../config');
const { errorResponse } = require('../utils/response');

/**
 * Centralized Express Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Express Error] [${req.method}] ${req.originalUrl}:`, {
    message,
    statusCode,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });

  return errorResponse(
    res,
    message,
    statusCode,
    config.nodeEnv === 'development' ? { stack: err.stack } : null
  );
}

module.exports = errorHandler;

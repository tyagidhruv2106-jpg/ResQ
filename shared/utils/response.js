/**
 * Uniform success response formatter
 */
function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    status: 'success',
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Uniform error response formatter
 */
function errorResponse(res, message = 'An error occurred', statusCode = 400, errors = null) {
  const payload = {
    status: 'error',
    statusCode,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
}

/**
 * Validate and sanitize GPS latitude and longitude
 */
function validateCoordinates(lat, lon) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    return { valid: false, error: 'Latitude must be a valid number between -90 and 90 degrees.' };
  }

  if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    return { valid: false, error: 'Longitude must be a valid number between -180 and 180 degrees.' };
  }

  return { valid: true, latitude, longitude };
}

module.exports = {
  successResponse,
  errorResponse,
  validateCoordinates,
};

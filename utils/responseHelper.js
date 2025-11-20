/**
 * Response Helper Utility
 * Standardize API responses với status codes
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message
 * @param {Object} data - Response data
 */
const success = (res, statusCode = 200, message = null, data = null) => {
  const response = {
    success: true,
  };

  if (message) {
    response.message = message;
  }

  if (data) {
    // Merge data vào response
    Object.assign(response, data);
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {string} message - Error message
 * @param {Object} errors - Additional error details
 */
const error = (res, statusCode = 400, message = 'An error occurred', errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    if (Array.isArray(errors)) {
      response.errors = errors;
    } else {
      response.error = errors;
    }
  }

  return res.status(statusCode).json(response);
};

/**
 * Created response (201)
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} data - Response data
 */
const created = (res, message = null, data = null) => {
  return success(res, 201, message, data);
};

/**
 * OK response (200)
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} data - Response data
 */
const ok = (res, message = null, data = null) => {
  return success(res, 200, message, data);
};

/**
 * Bad Request response (400)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Object} errors - Additional error details
 */
const badRequest = (res, message = 'Bad request', errors = null) => {
  return error(res, 400, message, errors);
};

/**
 * Unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, 401, message);
};

/**
 * Forbidden response (403)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const forbidden = (res, message = 'Forbidden') => {
  return error(res, 403, message);
};

/**
 * Not Found response (404)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const notFound = (res, message = 'Not found') => {
  return error(res, 404, message);
};

/**
 * Internal Server Error response (500)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const serverError = (res, message = 'Internal server error') => {
  return error(res, 500, message);
};

module.exports = {
  success,
  error,
  created,
  ok,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
};


const logger = require('../services/logger');

const errorHandler = (err, req, res, next) => {
  // Log error với context
  logger.error('Request error', err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    statusCode: err.statusCode || 500,
    errorName: err.name,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    logger.warn('Validation error', {
      errors: messages,
      url: req.url,
    });
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    logger.warn('Duplicate key error', {
      code: err.code,
      url: req.url,
    });
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value',
      error: 'This value already exists',
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    logger.warn('Invalid ID format', {
      error: err.message,
      url: req.url,
    });
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  logger.error('Unhandled error', err, {
    statusCode,
    url: req.url,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;


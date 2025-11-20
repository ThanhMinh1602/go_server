const morgan = require('morgan');
const logger = require('../services/logger');

// Custom format cho morgan
const morganFormat = ':method :url :status :response-time ms - :res[content-length]';

// Morgan middleware với custom stream
const morganMiddleware = morgan(morganFormat, {
  stream: logger.stream,
  skip: (req, res) => {
    // Skip logging cho health check
    return req.url === '/health';
  },
});

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.debug('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: req.method !== 'GET' ? req.body : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
  });

  // Log response khi hoàn thành
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.debug('Request completed', logData);
    }
  });

  next();
};

module.exports = {
  morganMiddleware,
  requestLogger,
};


const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Tạo thư mục logs nếu chưa có
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Định nghĩa log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Định nghĩa màu sắc cho từng level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Định nghĩa format cho logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Format cho console (có màu sắc)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Tạo transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'debug',
  }),
  
  // File transport cho tất cả logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: format,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // File transport cho errors
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    format: format,
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Tạo logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  format,
  transports,
  // Không exit on error
  exitOnError: false,
});

// Tạo stream cho Morgan (HTTP request logging)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper methods
logger.debug = (message, ...args) => {
  logger.log('debug', message, ...args);
};

logger.info = (message, ...args) => {
  logger.log('info', message, ...args);
};

logger.warn = (message, ...args) => {
  logger.log('warn', message, ...args);
};

logger.error = (message, error = null, ...args) => {
  if (error instanceof Error) {
    logger.log('error', message, { error: error.message, stack: error.stack }, ...args);
  } else if (error) {
    logger.log('error', message, { error }, ...args);
  } else {
    logger.log('error', message, ...args);
  }
};

logger.http = (message, ...args) => {
  logger.log('http', message, ...args);
};

module.exports = logger;


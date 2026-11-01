const winston = require('winston');
const path = require('path');

/**
 * Logger — Winston-based structured logging
 *
 * Log levels (highest to lowest priority):
 *   error → warn → info → http → debug
 *
 * Features:
 *   - Request ID correlation (attach req.id to log context)
 *   - Environment-aware log level
 *   - Separate transports: console, error.log, combined.log, access.log
 *   - Size-based log rotation (5MB error, 10MB combined, 10MB access)
 */

const LOG_DIR = path.join(__dirname, '../../logs');

// Determine log level from env (import env directly would create circular dep)
const LOG_LEVEL = process.env.LOG_LEVEL
  || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const reqIdStr = requestId ? ` [${requestId}]` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}]${reqIdStr} ${level}: ${message}${metaStr}`;
  })
);

// Structured JSON format for file logs
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: {
    service: 'edusphere-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console — always active
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // Error log file
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),

    // Access log — HTTP requests only (filtered from combined)
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'access.log'),
      level: 'http',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],

  // Don't exit on uncaught errors
  exitOnError: false,
});

module.exports = logger;

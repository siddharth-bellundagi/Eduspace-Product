/**
 * requestLogger.js — HTTP request logging middleware
 *
 * Uses Morgan for HTTP request logging, piped into Winston for
 * consistent log formatting across the application.
 *
 * Features:
 *   - Request ID correlation (from X-Request-Id header)
 *   - Response time classification (slow > 2s → warning)
 *   - Content-length tracking
 */
const morgan = require('morgan');
const logger = require('../utils/logger');

// Morgan stream that writes to Winston
const stream = {
  write: (message) => {
    // Remove trailing newline that Morgan adds
    logger.http(message.trim());
  },
};

// Skip logging in test environment
const skip = () => process.env.NODE_ENV === 'test';

// Custom token for response time coloring (used in dev format)
morgan.token('status-color', (req, res) => {
  const status = res.statusCode;
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`; // Red
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`; // Yellow
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`; // Cyan
  return `\x1b[32m${status}\x1b[0m`; // Green
});

// Custom token: request ID
morgan.token('req-id', (req) => req.id || '-');

// Custom token: response time with slow warning
morgan.token('response-time-warn', (req, res) => {
  const time = morgan['response-time'](req, res);
  if (time && parseFloat(time) > 2000) {
    return `\x1b[31m${time}ms ⚠ SLOW\x1b[0m`;
  }
  return `${time}ms`;
});

// Development: detailed, colorful output with request ID
const devFormat = ':req-id :method :url :status-color :response-time-warn - :res[content-length]';

// Production: combined format (includes IP, user-agent, request ID)
const prodFormat = ':req-id :remote-addr - :method :url :status :response-time ms - :res[content-length] ":user-agent"';

// Log slow requests as warnings (separate from the access log)
morgan.token('slow-check', (req, res) => {
  const time = parseFloat(morgan['response-time'](req, res));
  if (time > 2000) {
    logger.warn(`[Slow Request] ${req.method} ${req.originalUrl} took ${time.toFixed(0)}ms`, {
      requestId: req.id,
      responseTime: time,
      status: res.statusCode,
    });
  }
  return '';
});

const requestLogger = morgan(
  process.env.NODE_ENV === 'production'
    ? `${prodFormat} :slow-check`
    : `${devFormat} :slow-check`,
  { stream, skip }
);

module.exports = requestLogger;

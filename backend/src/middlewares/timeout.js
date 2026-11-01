/**
 * timeout.js — Request timeout middleware
 *
 * Prevents requests from hanging indefinitely by enforcing a
 * maximum processing time. Returns 408 Request Timeout if exceeded.
 *
 * Two presets:
 *   - requestTimeout(30000)  — 30s for normal API calls
 *   - uploadTimeout(60000)   — 60s for file upload routes
 *
 * Usage:
 *   app.use(requestTimeout());                     // Global default
 *   router.post('/', uploadTimeout(), handler);     // Per-route override
 */
const { env } = require('../config/env');
const logger = require('../utils/logger');

/**
 * General request timeout middleware
 * @param {number} ms - Timeout in milliseconds (default from env or 30s)
 * @returns {Function} Express middleware
 */
function requestTimeout(ms) {
  const timeout = ms || env.REQUEST_TIMEOUT_MS || 30000;

  return (req, res, next) => {
    // Set the timeout
    req.setTimeout(timeout);

    const timer = setTimeout(() => {
      // Only send timeout if response hasn't started
      if (!res.headersSent) {
        logger.warn(`[Timeout] Request timed out after ${timeout}ms: ${req.method} ${req.originalUrl}`, {
          requestId: req.id,
          ip: req.ip,
        });

        res.status(408).json({
          success: false,
          message: 'Request timeout — the server took too long to respond',
        });
      }
    }, timeout);

    // Clear the timer when the response finishes
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}

/**
 * Extended timeout for file upload routes
 * @param {number} ms - Timeout in milliseconds (default 60s)
 * @returns {Function} Express middleware
 */
function uploadTimeout(ms = 60000) {
  return requestTimeout(ms);
}

module.exports = { requestTimeout, uploadTimeout };

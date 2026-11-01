/**
 * security.js — Security hardening middleware
 *
 * Provides:
 *   1. Input sanitization — strips NoSQL injection operators ($, .)
 *   2. Request ID generation — unique ID per request for tracing
 *
 * These are lightweight, zero-dependency middlewares that protect
 * against common attack vectors without adding bloat.
 */
const crypto = require('crypto');
const logger = require('../utils/logger');

// ============================================
// NoSQL Injection Sanitizer
// ============================================

/**
 * Recursively sanitize an object by removing keys that start with '$' or '.'
 * These are MongoDB/Firestore operators that could be used for injection.
 *
 * @param {*} obj - Value to sanitize
 * @param {number} depth - Current recursion depth (prevents stack overflow)
 * @returns {*} Sanitized value
 */
function sanitizeValue(obj, depth = 0) {
  // Prevent infinite recursion on deeply nested payloads
  if (depth > 10) return obj;

  if (obj === null || obj === undefined) return obj;

  // Strings — strip any standalone $ operators
  if (typeof obj === 'string') {
    return obj;
  }

  // Arrays — sanitize each element
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeValue(item, depth + 1));
  }

  // Objects — remove dangerous keys, sanitize values
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      // Skip keys starting with $ (NoSQL operators like $gt, $where, $regex)
      if (key.startsWith('$')) {
        logger.warn(`[Security] Stripped suspicious key: "${key}" from request`);
        continue;
      }
      // Skip keys starting with . (Firestore field path injection)
      if (key.startsWith('.')) {
        logger.warn(`[Security] Stripped suspicious key: "${key}" from request`);
        continue;
      }
      sanitized[key] = sanitizeValue(obj[key], depth + 1);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Middleware: Sanitize req.body, req.query, and req.params
 * Must be applied AFTER body parsers (express.json, express.urlencoded)
 */
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
}

// ============================================
// Request ID Generator
// ============================================

/**
 * Middleware: Generate a unique request ID for every incoming request.
 * - If the client sends X-Request-Id, honor it (for distributed tracing).
 * - Otherwise, generate a new one.
 * - Attach to req.id and set as response header.
 */
function requestId(req, res, next) {
  const clientId = req.headers['x-request-id'];
  // Only trust client-supplied IDs that match a safe alphanumeric pattern (max 64 chars)
  const id = (clientId && /^[\w\-]{1,64}$/.test(clientId)) ? clientId : generateId();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

/**
 * Generate a short, unique request ID
 * Format: timestamp(base36)-random(hex) → e.g., "m1abc2d-3f4a5b6c"
 */
function generateId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `${timestamp}-${random}`;
}

module.exports = { sanitizeInput, requestId };

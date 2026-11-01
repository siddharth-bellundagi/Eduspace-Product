/**
 * rateLimiter.js — Rate limiting middleware
 *
 * Prevents abuse by limiting the number of requests per IP address.
 * Three presets:
 *   - apiLimiter: general API calls (1000 req / 15 min)
 *   - formLimiter: form submissions (5 req / 15 min) — stricter
 *   - loginLimiter: auth attempts (5 req / 15 min) — strictest
 *
 * IMPORTANT: Uses req.ip (set by Express via 'trust proxy') instead of
 * manually parsing X-Forwarded-For, which is trivially spoofable.
 */
const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

/**
 * General API rate limiter
 * Applied to all /api routes by default
 */
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.IS_DEVELOPMENT ? 10000 : env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests — please try again later',
  },
  skip: (req) => {
    // In development mode, skip rate limiting entirely
    if (env.IS_DEVELOPMENT) return true;
    return false;
  },
  // Use Express's req.ip which respects 'trust proxy' setting in app.js
  // This is safe because app.set('trust proxy', 1) only trusts the first proxy
});

/**
 * Form submission rate limiter
 * Stricter limit — applied to POST endpoints for admission/contact forms
 */
const formLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.IS_DEVELOPMENT ? 1000 : env.FORM_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many form submissions — please wait before trying again',
  },
  skip: (req) => {
    if (env.IS_DEVELOPMENT) return true;
    return false;
  },
});

module.exports = { apiLimiter, formLimiter };

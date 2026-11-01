/**
 * cors.js — CORS configuration
 *
 * Whitelist-based CORS config. In development, allows common local
 * dev server origins. In production, restrict to your actual domain
 * via the ALLOWED_ORIGINS environment variable.
 *
 * No hardcoded production domains — everything is configurable via .env.
 */
const { env } = require('./env');

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Check against env-configured allowed origins
    if (env.ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // Allow production domain if configured
    if (env.PRODUCTION_DOMAIN) {
      const prodOrigins = [
        `https://${env.PRODUCTION_DOMAIN}`,
        `https://www.${env.PRODUCTION_DOMAIN}`,
      ];
      if (prodOrigins.includes(origin)) {
        return callback(null, true);
      }
    }

    // In development, be more permissive with localhost variants
    if (!env.IS_PRODUCTION && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin === 'null')) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Total-Pages', 'X-Request-Id'],
  maxAge: 86400, // 24 hours — browser caches preflight response
};

module.exports = corsOptions;

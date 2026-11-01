/**
 * env.js — Environment configuration loader
 *
 * Loads .env file and validates environment variables.
 */
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

function validateEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (!process.env.JWT_SECRET) {
    if (nodeEnv === 'production') {
      // Hard-fail in production — a known public secret is as good as no secret
      throw new Error(
        '❌ FATAL: JWT_SECRET environment variable is not set. ' +
        'The server cannot start in production without a secure secret. ' +
        'Set JWT_SECRET in your .env file.'
      );
    } else {
      console.warn('⚠️  JWT_SECRET is not set. Using a development-only fallback. Never run this in production.');
    }
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.info('ℹ️  Cloudinary credentials not detected in .env — using reliable local disk file storage as fallback.');
  }
}

const env = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_STAGING: process.env.NODE_ENV === 'staging',
  IS_DEVELOPMENT: !process.env.NODE_ENV || process.env.NODE_ENV === 'development',

  // Auth / JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-insecure-jwt-secret-do-not-use-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'edusphere',

  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],

  // Production domain (for CSP and CORS in production)
  PRODUCTION_DOMAIN: process.env.PRODUCTION_DOMAIN || '',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 1000,
  FORM_RATE_LIMIT_MAX: parseInt(process.env.FORM_RATE_LIMIT_MAX, 10) || 20,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Performance
  REQUEST_TIMEOUT_MS: parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || 30000,
  CACHE_MAX_AGE: parseInt(process.env.CACHE_MAX_AGE, 10) || 300,
};

module.exports = { env, validateEnv };

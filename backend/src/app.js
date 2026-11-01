/**
 * app.js — Express application assembly
 *
 * Middleware order:
 *   1. Request ID → 2. Security headers → 3. CORS → 4. Body parsers →
 *   5. Input sanitization → 6. HPP → 7. Compression → 8. Logging →
 *   9. Rate limiting → 10. Timeout → 11. Routes → 12. 404 → 13. Error handler
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const path = require('path');

// Config
const corsOptions = require('./config/cors');
const { env } = require('./config/env');

// Middlewares
const { requestId, sanitizeInput } = require('./middlewares/security');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { requestTimeout } = require('./middlewares/timeout');

// Routes
const routes = require('./routes');

// Utils
const { NotFoundError } = require('./utils/ApiError');

// ============================================
// Create Express App
// ============================================
const app = express();

// Trust Proxy — MUST be set before rate limiter and any middleware
// that reads req.ip (e.g. behind cPanel / Nginx / Cloudflare)
app.set('trust proxy', 1);

// 1. Request ID
app.use(requestId);

// 2. Security Headers (Helmet)
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
  imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://*.cloudinary.com'],
  connectSrc: ["'self'", 'https://res.cloudinary.com', 'https://api.cloudinary.com'],
  frameSrc: ["'self'", 'https://www.google.com'],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
};

if (env.PRODUCTION_DOMAIN) {
  cspDirectives.connectSrc.push(`https://${env.PRODUCTION_DOMAIN}`);
  cspDirectives.imgSrc.push(`https://${env.PRODUCTION_DOMAIN}`);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
    hsts: env.IS_PRODUCTION ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// 3. CORS
app.use(cors(corsOptions));

// 4. Body Parsers & Uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically (local disk fallback)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 5. Input Sanitization
app.use(sanitizeInput);

// 6. HPP Protection
app.use(
  hpp({
    whitelist: ['category', 'classGrade', 'status', 'tag', 'grade'],
  })
);

// 7. Compression
app.use(
  compression({
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  })
);

// 8. Logging
app.use(requestLogger);

// 9. Rate Limiting
app.use('/api', apiLimiter);

// 10. Request Timeout
app.use(requestTimeout());

// 11. API Routes
app.use('/api', routes);

// Serve frontend static files (only public web assets — never expose backend/)
const FRONTEND_ROOT = path.join(__dirname, '../../');
app.use(express.static(FRONTEND_ROOT, {
  // Block dotfiles (.env, .git, etc.)
  dotfiles: 'deny',
  // Only serve known frontend extensions
  extensions: ['html', 'htm'],
  // Cache static assets in production
  maxAge: env.IS_PRODUCTION ? '1d' : 0,
}));

// Explicitly block backend directory from being served
app.use('/backend', (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
});
app.use('/data', (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
});
app.use('/node_modules', (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
});

// 12. 404 Handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
});

// 13. Global Error Handler
app.use(errorHandler);

module.exports = app;

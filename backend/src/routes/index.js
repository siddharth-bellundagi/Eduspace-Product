/**
 * routes/index.js — Route aggregator
 *
 * Mounts all route modules under their respective prefixes.
 * Also provides an enhanced health check endpoint.
 */
const { Router } = require('express');
const { db } = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');

const router = Router();

// Request Counter
let requestCount = 0;
router.use((req, res, next) => {
  requestCount++;
  next();
});

// ============================================
// Health Check Endpoint
// ============================================
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  let dbConnected = false;
  let dbLatencyMs = 0;

  try {
    const test = await db.get('SELECT 1 AS ok');
    dbConnected = test && test.ok === 1;
    dbLatencyMs = Date.now() - startTime;
  } catch (err) {
    dbConnected = false;
  }

  // Public health check — only expose status, no internal details
  // (Node version, heap memory, DB latency are useful for attackers)
  const healthData = {
    status: dbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  };

  const statusCode = dbConnected ? 200 : 503;
  return res.status(statusCode).json({
    success: dbConnected,
    message: dbConnected ? 'All systems operational' : 'Service temporarily unavailable',
    data: healthData,
  });
});

// ============================================
// API Info Endpoint
// ============================================
router.get('/', (req, res) => {
  ApiResponse.success(
    res,
    {
      name: 'EduSphere School Management API',
      version: '2.0.0',
      description: 'Node.js + SQLite REST API with Cloudinary Media Storage',
      endpoints: {
        health: 'GET /api/health',
        auth: 'POST /api/auth/login, GET /api/auth/verify, GET /api/auth/me',
        admissions: 'POST /api/admissions, GET /api/admissions (admin)',
        contact: 'POST /api/contact, GET /api/contact (admin)',
        alumni: 'POST /api/alumni, GET /api/alumni (admin)',
        gallery: 'GET /api/gallery (public), POST /api/gallery (multi-upload)',
        faculty: 'GET /api/faculty (public), POST /api/faculty (photo upload)',
        news: 'GET /api/news/announcements, GET /api/news/circulars, GET /api/news/holidays',
        ticker: 'GET /api/ticker, GET /api/news/ticker',
        events: 'GET /api/events, POST /api/events (admin)',
        studentLife: 'GET /api/student-life, POST /api/student-life (admin)',
        parents: 'GET /api/parents/downloads, GET /api/parents/circulars, GET /api/parents/pta',
      },
    },
    'Welcome to EduSphere API'
  );
});

// ============================================
// Route Mounting
// ============================================
router.use('/auth', require('./auth.routes'));
router.use('/admissions', require('./admission.routes'));
router.use('/contact', require('./contact.routes'));
router.use('/alumni', require('./alumni.routes'));
router.use('/news', require('./news.routes'));
router.use('/gallery', require('./gallery.routes'));
router.use('/faculty', require('./faculty.routes'));
router.use('/staff', require('./staff.routes'));
router.use('/achievements', require('./achievements.routes'));
router.use('/awards', require('./awards.routes'));
router.use('/academics', require('./academics.routes'));
router.use('/events', require('./events.routes'));
router.use('/student-life', require('./studentLife.routes'));
router.use('/parents', require('./parents.routes'));
router.use('/ticker', require('./ticker.routes'));
router.use('/alumni-content', require('./alumniContent.routes'));
router.use('/ssc-toppers', require('./sscToppers.routes'));

module.exports = router;

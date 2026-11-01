/**
 * auth.routes.js — Authentication routes
 *
 * POST /api/auth/login   — Verify credentials (public, rate-limited)
 * GET  /api/auth/verify   — Check token validity (requires auth)
 * GET  /api/auth/me       — Get admin profile (requires auth)
 */
const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth');
const { formLimiter } = require('../middlewares/rateLimiter');
const { loginRules } = require('../validators/auth.validator');
const validate = require('../middlewares/validator');

const router = Router();

// Public — stricter rate limit on login to prevent brute-force attacks
router.post('/login', formLimiter, loginRules, validate, authController.login);

// Protected — requires valid token in Authorization header
router.get('/verify', verifyToken, authController.verify);

// Protected — get current admin's full profile
router.get('/me', verifyToken, authController.getProfile);

module.exports = router;

/**
 * alumni.routes.js — Alumni registration routes
 *
 * POST   /api/alumni      — Register as alumni (public, rate-limited)
 * GET    /api/alumni       — List all registrations (admin, paginated)
 * GET    /api/alumni/:id   — Get single registration (admin)
 * DELETE /api/alumni/:id   — Delete registration (admin)
 */
const { Router } = require('express');
const alumniController = require('../controllers/alumni.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { formLimiter } = require('../middlewares/rateLimiter');
const { createAlumniRules } = require('../validators/alumni.validator');
const validate = require('../middlewares/validator');

const router = Router();

// ─── Public (Rate-Limited) ───────────────────────────────
router.post('/', formLimiter, createAlumniRules, validate, alumniController.create);

// ─── Admin Protected ─────────────────────────────────────
router.get('/', verifyToken, requireAdmin, alumniController.getAll);
router.get('/:id', verifyToken, requireAdmin, alumniController.getById);
router.delete('/:id', verifyToken, requireAdmin, alumniController.remove);

module.exports = router;

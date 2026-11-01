/**
 * contact.routes.js — Contact inquiry routes
 *
 * POST   /api/contact      — Submit contact message (public, rate-limited)
 * GET    /api/contact       — List all messages (admin, paginated)
 * GET    /api/contact/:id   — Get single message (admin)
 * PATCH  /api/contact/:id   — Update message status (admin)
 * DELETE /api/contact/:id   — Delete message (admin)
 */
const { Router } = require('express');
const contactController = require('../controllers/contact.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { formLimiter } = require('../middlewares/rateLimiter');
const { createContactRules, updateContactStatusRules } = require('../validators/contact.validator');
const validate = require('../middlewares/validator');

const router = Router();

// ─── Public (Rate-Limited) ───────────────────────────────
router.post('/', formLimiter, createContactRules, validate, contactController.create);

// ─── Admin Protected ─────────────────────────────────────
router.get('/', verifyToken, requireAdmin, contactController.getAll);
router.get('/:id', verifyToken, requireAdmin, contactController.getById);
router.patch('/:id', verifyToken, requireAdmin, updateContactStatusRules, validate, contactController.update);
router.delete('/:id', verifyToken, requireAdmin, contactController.remove);

module.exports = router;

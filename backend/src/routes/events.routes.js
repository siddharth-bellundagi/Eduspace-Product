/**
 * events.routes.js — Upcoming Events routes
 *
 * GET    /api/events       — Public: List active upcoming events
 * GET    /api/events/all   — Admin: All events (paginated)
 * GET    /api/events/:id   — Admin: Single event
 * POST   /api/events       — Admin: Create event
 * PUT    /api/events/:id   — Admin: Update event
 * DELETE /api/events/:id   — Admin: Delete event
 */
const { Router } = require('express');
const eventsController = require('../controllers/events.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { createEventRules, updateEventRules } = require('../validators/events.validator');
const validate = require('../middlewares/validator');

const router = Router();

// ─── Public ──────────────────────────────────────────────
router.get('/', eventsController.list);

// ─── Admin Protected ─────────────────────────────────────
router.get('/all', verifyToken, requireAdmin, eventsController.getAll);
router.get('/:id', verifyToken, requireAdmin, eventsController.getById);
router.post('/', verifyToken, requireAdmin, createEventRules, validate, eventsController.create);
router.put('/:id', verifyToken, requireAdmin, updateEventRules, validate, eventsController.update);
router.delete('/:id', verifyToken, requireAdmin, eventsController.remove);

module.exports = router;

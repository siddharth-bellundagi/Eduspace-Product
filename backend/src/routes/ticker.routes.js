/**
 * ticker.routes.js — Standalone ticker route for frontend convenience
 *
 * GET /api/ticker — Public: Returns active ticker items (shortcut)
 *
 * The full ticker CRUD lives under /api/news/ticker/*.
 * This route provides a direct shortcut for the frontend ticker widget.
 */
const { Router } = require('express');
const newsController = require('../controllers/news.controller');

const router = Router();

// Public shortcut — returns only active ticker items sorted by order
router.get('/', newsController.listTicker);

module.exports = router;

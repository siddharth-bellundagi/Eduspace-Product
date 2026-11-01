/**
 * alumniContent.routes.js — Alumni Content routes
 *
 * Sub-routes for: alumni stories, alumni events
 * Public endpoints only return published items.
 */
const { Router } = require('express');
const alumniContentController = require('../controllers/alumniContent.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validator');
const {
  createAlumniStoryRules, updateAlumniStoryRules,
  createAlumniEventRules, updateAlumniEventRules,
} = require('../validators/alumniContent.validator');

const router = Router();

// ─── ALUMNI STORIES ──────────────────────────────────────
// Public
router.get('/stories', alumniContentController.listStories);
// Admin
router.get('/stories/all', verifyToken, requireAdmin, alumniContentController.getAllStories);
router.get('/stories/:id', verifyToken, requireAdmin, alumniContentController.getStoryById);
router.post('/stories', verifyToken, requireAdmin, createAlumniStoryRules, validate, alumniContentController.createStory);
router.put('/stories/:id', verifyToken, requireAdmin, updateAlumniStoryRules, validate, alumniContentController.updateStory);
router.delete('/stories/:id', verifyToken, requireAdmin, alumniContentController.deleteStory);

// ─── ALUMNI EVENTS ───────────────────────────────────────
// Public
router.get('/events', alumniContentController.listAlumniEvents);
// Admin
router.get('/events/all', verifyToken, requireAdmin, alumniContentController.getAllAlumniEvents);
router.get('/events/:id', verifyToken, requireAdmin, alumniContentController.getAlumniEventById);
router.post('/events', verifyToken, requireAdmin, createAlumniEventRules, validate, alumniContentController.createAlumniEvent);
router.put('/events/:id', verifyToken, requireAdmin, updateAlumniEventRules, validate, alumniContentController.updateAlumniEvent);
router.delete('/events/:id', verifyToken, requireAdmin, alumniContentController.deleteAlumniEvent);

module.exports = router;

/**
 * gallery.routes.js — Gallery routes
 *
 * GET    /api/gallery       — Public: List gallery images/albums (filter by category, classGrade)
 * GET    /api/gallery/all   — Admin: All gallery items (paginated)
 * GET    /api/gallery/:id   — Admin: Single gallery item
 * POST   /api/gallery       — Admin: Create gallery album (supports batch multi-photo upload)
 * PUT    /api/gallery/:id   — Admin: Update gallery album
 * DELETE /api/gallery/:id   — Admin: Delete gallery album and assets
 */
const { Router } = require('express');
const galleryController = require('../controllers/gallery.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { imageUpload } = require('../middlewares/upload');
const { createGalleryRules, updateGalleryRules } = require('../validators/gallery.validator');
const validate = require('../middlewares/validator');

const router = Router();

// ─── Public ──────────────────────────────────────────────
router.get('/', galleryController.list);

// ─── Admin Protected ─────────────────────────────────────
router.get('/all', verifyToken, requireAdmin, galleryController.getAll);
router.get('/:id', verifyToken, requireAdmin, galleryController.getById);

// imageUpload.any() flexibly handles single photo or multiple batch photos
router.post('/', verifyToken, requireAdmin, imageUpload.any(), createGalleryRules, validate, galleryController.create);
router.put('/:id', verifyToken, requireAdmin, imageUpload.any(), updateGalleryRules, validate, galleryController.update);
router.delete('/:id', verifyToken, requireAdmin, galleryController.remove);

module.exports = router;

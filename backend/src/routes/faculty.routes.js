/**
 * faculty.routes.js — Faculty & Staff routes
 *
 * GET    /api/faculty       — Public: List active faculty (sorted by display order)
 * GET    /api/faculty/all   — Admin: All faculty (paginated)
 * GET    /api/faculty/:id   — Admin: Single faculty member
 * POST   /api/faculty       — Admin: Create faculty member (with photo upload)
 * PUT    /api/faculty/:id   — Admin: Update faculty member (with photo upload)
 * DELETE /api/faculty/:id   — Admin: Delete faculty member
 */
const { Router } = require('express');
const facultyController = require('../controllers/faculty.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { imageUpload } = require('../middlewares/upload');
const { createFacultyRules, updateFacultyRules } = require('../validators/faculty.validator');
const validate = require('../middlewares/validator');

const router = Router();

// ─── Public ──────────────────────────────────────────────
router.get('/', facultyController.listFaculty);

// ─── Admin Protected ─────────────────────────────────────
router.get('/all', verifyToken, requireAdmin, facultyController.getAllFaculty);
router.get('/:id', verifyToken, requireAdmin, facultyController.getFacultyById);

// Allow faculty photo upload on create and update
router.post(
  '/',
  verifyToken,
  requireAdmin,
  imageUpload.single('photo'),
  createFacultyRules,
  validate,
  facultyController.createFaculty
);

router.put(
  '/:id',
  verifyToken,
  requireAdmin,
  imageUpload.single('photo'),
  updateFacultyRules,
  validate,
  facultyController.updateFaculty
);

router.delete('/:id', verifyToken, requireAdmin, facultyController.deleteFaculty);

module.exports = router;

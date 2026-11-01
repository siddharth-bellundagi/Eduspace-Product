/**
 * staff.routes.js — Staff routes
 *
 * GET    /api/staff       — Public: List active staff (sorted by display order)
 * GET    /api/staff/all   — Admin: All staff (paginated)
 * GET    /api/staff/:id   — Admin: Single staff member
 * POST   /api/staff       — Admin: Create staff member
 * PUT    /api/staff/:id   — Admin: Update staff member
 * DELETE /api/staff/:id   — Admin: Delete staff member
 */
const { Router } = require('express');
const facultyController = require('../controllers/faculty.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { imageUpload } = require('../middlewares/upload');
const { createFacultyRules, updateFacultyRules } = require('../validators/faculty.validator');
const validate = require('../middlewares/validator');

const router = Router();

// ─── Public ──────────────────────────────────────────────
router.get('/', facultyController.listStaff);

// ─── Admin Protected ─────────────────────────────────────
router.get('/all', verifyToken, requireAdmin, facultyController.getAllStaff);
router.get('/:id', verifyToken, requireAdmin, facultyController.getStaffById);
router.post('/', verifyToken, requireAdmin, imageUpload.single('photo'), createFacultyRules, validate, facultyController.createStaff);
router.put('/:id', verifyToken, requireAdmin, imageUpload.single('photo'), updateFacultyRules, validate, facultyController.updateStaff);
router.delete('/:id', verifyToken, requireAdmin, facultyController.deleteStaff);

module.exports = router;

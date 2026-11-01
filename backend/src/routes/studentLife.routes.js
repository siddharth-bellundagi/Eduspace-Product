/**
 * studentLife.routes.js — Student Life routes
 *
 * GET    /api/student-life       — Public: List active items (filter by category)
 * GET    /api/student-life/all   — Admin: All items (paginated)
 * GET    /api/student-life/:id   — Admin: Single item
 * POST   /api/student-life       — Admin: Create item (with optional image)
 * PUT    /api/student-life/:id   — Admin: Update item (with optional image)
 * DELETE /api/student-life/:id   — Admin: Delete item and image
 */
const { Router } = require('express');
const studentLifeController = require('../controllers/studentLife.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { imageUpload } = require('../middlewares/upload');
const { createStudentLifeRules, updateStudentLifeRules } = require('../validators/studentLife.validator');
const validate = require('../middlewares/validator');

const router = Router();

// ─── Public ──────────────────────────────────────────────
router.get('/', studentLifeController.list);

// ─── Admin Protected ─────────────────────────────────────
router.get('/all', verifyToken, requireAdmin, studentLifeController.getAll);
router.get('/:id', verifyToken, requireAdmin, studentLifeController.getById);
router.post('/', verifyToken, requireAdmin, imageUpload.array('images', 10), createStudentLifeRules, validate, studentLifeController.create);
router.put('/:id', verifyToken, requireAdmin, imageUpload.array('images', 10), updateStudentLifeRules, validate, studentLifeController.update);
router.delete('/:id', verifyToken, requireAdmin, studentLifeController.remove);

module.exports = router;

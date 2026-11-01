/**
 * awards.routes.js — Awards routes
 *
 * GET    /api/awards       — Public: List active awards
 * GET    /api/awards/all   — Admin: All awards (paginated)
 * GET    /api/awards/:id   — Admin: Single award
 * POST   /api/awards       — Admin: Create award
 * PUT    /api/awards/:id   — Admin: Update award
 * DELETE /api/awards/:id   — Admin: Delete award
 */
const { Router } = require('express');
const achievementsController = require('../controllers/achievements.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { createAwardRules, updateAwardRules } = require('../validators/achievements.validator');
const validate = require('../middlewares/validator');

const router = Router();

// ─── Public ──────────────────────────────────────────────
router.get('/', achievementsController.listAwards);

// ─── Admin Protected ─────────────────────────────────────
router.get('/all', verifyToken, requireAdmin, achievementsController.getAllAwards);
router.get('/:id', verifyToken, requireAdmin, achievementsController.getAwardById);
router.post('/', verifyToken, requireAdmin, createAwardRules, validate, achievementsController.createAward);
router.put('/:id', verifyToken, requireAdmin, updateAwardRules, validate, achievementsController.updateAward);
router.delete('/:id', verifyToken, requireAdmin, achievementsController.deleteAward);

module.exports = router;

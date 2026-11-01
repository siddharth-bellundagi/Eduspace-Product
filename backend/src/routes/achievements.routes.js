/**
 * achievements.routes.js — Student Achievements routes
 *
 * GET    /api/achievements       — Public: List active achievements (filterable by category)
 * GET    /api/achievements/all   — Admin: All achievements (paginated)
 * GET    /api/achievements/:id   — Admin: Single achievement
 * POST   /api/achievements       — Admin: Create achievement (with student photo upload)
 * PUT    /api/achievements/:id   — Admin: Update achievement (with student photo upload)
 * DELETE /api/achievements/:id   — Admin: Delete achievement
 */
const { Router } = require('express');
const achievementsController = require('../controllers/achievements.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { imageUpload } = require('../middlewares/upload');
const { createAchievementRules, updateAchievementRules } = require('../validators/achievements.validator');
const validate = require('../middlewares/validator');

const router = Router();

// ─── Public ──────────────────────────────────────────────
router.get('/', achievementsController.listAchievements);

// ─── Admin Protected ─────────────────────────────────────
router.get('/all', verifyToken, requireAdmin, achievementsController.getAllAchievements);
router.get('/:id', verifyToken, requireAdmin, achievementsController.getAchievementById);
router.post('/', verifyToken, requireAdmin, imageUpload.single('image'), createAchievementRules, validate, achievementsController.createAchievement);
router.put('/:id', verifyToken, requireAdmin, imageUpload.single('image'), updateAchievementRules, validate, achievementsController.updateAchievement);
router.delete('/:id', verifyToken, requireAdmin, achievementsController.deleteAchievement);

module.exports = router;

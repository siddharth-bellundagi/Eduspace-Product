/**
 * sscToppers.routes.js — SSC Toppers routes
 */
const { Router } = require('express');
const sscToppersController = require('../controllers/sscToppers.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { imageUpload } = require('../middlewares/upload');
const { createTopperRules, updateTopperRules } = require('../validators/sscToppers.validator');
const validate = require('../middlewares/validator');

const router = Router();

// ─── Public ──────────────────────────────────────────────
router.get('/', sscToppersController.listToppers);
router.get('/latest', sscToppersController.getLatestToppers);
router.get('/years', sscToppersController.getYears);

// ─── Admin Protected ─────────────────────────────────────
router.get('/all', verifyToken, requireAdmin, sscToppersController.getAllToppers);
router.get('/:id', verifyToken, requireAdmin, sscToppersController.getTopperById);
router.post('/', verifyToken, requireAdmin, imageUpload.single('image'), createTopperRules, validate, sscToppersController.createTopper);
router.put('/:id', verifyToken, requireAdmin, imageUpload.single('image'), updateTopperRules, validate, sscToppersController.updateTopper);
router.delete('/:id', verifyToken, requireAdmin, sscToppersController.deleteTopper);

module.exports = router;

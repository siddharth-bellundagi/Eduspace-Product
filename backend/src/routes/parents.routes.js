/**
 * parents.routes.js — Parents Section routes
 *
 * Sub-routes for: downloads, circulars, PTA
 * Downloads and circulars support file uploads (PDF/images)
 */
const { Router } = require('express');
const parentsController = require('../controllers/parents.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { mixedUpload } = require('../middlewares/upload');
const validate = require('../middlewares/validator');
const {
  createDownloadRules, updateDownloadRules,
  createParentCircularRules, updateParentCircularRules,
  createPtaRules, updatePtaRules,
} = require('../validators/parents.validator');

const router = Router();

// ─── DOWNLOADS ───────────────────────────────────────────
// Public
router.get('/downloads', parentsController.listDownloads);
// Admin
router.get('/downloads/all', verifyToken, requireAdmin, parentsController.getAllDownloads);
router.get('/downloads/:id', verifyToken, requireAdmin, parentsController.getDownloadById);
router.post('/downloads', verifyToken, requireAdmin, mixedUpload.single('file'), createDownloadRules, validate, parentsController.createDownload);
router.put('/downloads/:id', verifyToken, requireAdmin, mixedUpload.single('file'), updateDownloadRules, validate, parentsController.updateDownload);
router.delete('/downloads/:id', verifyToken, requireAdmin, parentsController.deleteDownload);

// ─── CIRCULARS ───────────────────────────────────────────
// Public
router.get('/circulars', parentsController.listParentCirculars);
// Admin
router.get('/circulars/all', verifyToken, requireAdmin, parentsController.getAllParentCirculars);
router.get('/circulars/:id', verifyToken, requireAdmin, parentsController.getParentCircularById);
router.post('/circulars', verifyToken, requireAdmin, mixedUpload.single('file'), createParentCircularRules, validate, parentsController.createParentCircular);
router.put('/circulars/:id', verifyToken, requireAdmin, mixedUpload.single('file'), updateParentCircularRules, validate, parentsController.updateParentCircular);
router.delete('/circulars/:id', verifyToken, requireAdmin, parentsController.deleteParentCircular);

// ─── PTA ─────────────────────────────────────────────────
// Public
router.get('/pta', parentsController.listPta);
// Admin
router.get('/pta/all', verifyToken, requireAdmin, parentsController.getAllPta);
router.get('/pta/:id', verifyToken, requireAdmin, parentsController.getPtaById);
router.post('/pta', verifyToken, requireAdmin, createPtaRules, validate, parentsController.createPta);
router.put('/pta/:id', verifyToken, requireAdmin, updatePtaRules, validate, parentsController.updatePta);
router.delete('/pta/:id', verifyToken, requireAdmin, parentsController.deletePta);

module.exports = router;

/**
 * admission.routes.js — Admission enquiry routes
 *
 * POST   /api/admissions      — Submit new enquiry (public, rate-limited)
 * GET    /api/admissions       — List all enquiries (admin, paginated)
 * GET    /api/admissions/:id   — Get single enquiry (admin)
 * PATCH  /api/admissions/:id   — Update enquiry status (admin)
 * DELETE /api/admissions/:id   — Delete enquiry (admin)
 */
const { Router } = require('express');
const admissionController = require('../controllers/admission.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { formLimiter } = require('../middlewares/rateLimiter');
const { createAdmissionRules, updateAdmissionStatusRules } = require('../validators/admission.validator');
const validate = require('../middlewares/validator');

const router = Router();

// ─── Public (Rate-Limited) ───────────────────────────────
router.post('/', formLimiter, createAdmissionRules, validate, admissionController.create);

// ─── Admin Protected ─────────────────────────────────────
router.get('/', verifyToken, requireAdmin, admissionController.getAll);
router.get('/:id', verifyToken, requireAdmin, admissionController.getById);
router.patch('/:id', verifyToken, requireAdmin, updateAdmissionStatusRules, validate, admissionController.update);
router.delete('/:id', verifyToken, requireAdmin, admissionController.remove);

module.exports = router;

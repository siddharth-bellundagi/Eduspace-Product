/**
 * admission.validator.js — Validation rules for admission enquiry endpoints
 *
 * Validates all fields required for admission form submissions.
 * Uses express-validator chains, checked by the validate middleware.
 */
const { body } = require('express-validator');
const { ADMISSION_CLASSES } = require('../utils/constants');

/**
 * Rules for POST /api/admissions — public form submission
 */
const createAdmissionRules = [
  body('studentName')
    .trim()
    .notEmpty().withMessage('Student name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Student name must be 2–100 characters'),

  body('parentName')
    .trim()
    .notEmpty().withMessage('Parent/guardian name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Parent name must be 2–100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit Indian mobile number'),

  body('dob')
    .optional({ checkFalsy: true })
    .trim()
    .isISO8601().withMessage('Please enter a valid date (YYYY-MM-DD format)'),

  body('classApplied')
    .trim()
    .notEmpty().withMessage('Class applied for is required')
    .isIn(ADMISSION_CLASSES).withMessage(`Class must be one of: ${ADMISSION_CLASSES.join(', ')}`),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
];

/**
 * Rules for PATCH /api/admissions/:id — admin status update
 */
const updateAdmissionStatusRules = [
  body('status')
    .optional()
    .trim()
    .isIn(['new', 'read', 'replied', 'archived']).withMessage('Status must be: new, read, replied, or archived'),

  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Admin notes cannot exceed 2000 characters'),
];

module.exports = { createAdmissionRules, updateAdmissionStatusRules };

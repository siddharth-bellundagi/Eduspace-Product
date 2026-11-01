/**
 * contact.validator.js — Validation rules for contact form endpoints
 *
 * Validates all fields for contact message submissions.
 */
const { body } = require('express-validator');

/**
 * Rules for POST /api/contact — public form submission
 */
const createContactRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit Indian mobile number'),

  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ min: 2, max: 200 }).withMessage('Subject must be 2–200 characters'),

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Message must be 10–2000 characters'),
];

/**
 * Rules for PATCH /api/contact/:id — admin status update
 */
const updateContactStatusRules = [
  body('status')
    .optional()
    .trim()
    .isIn(['new', 'read', 'replied', 'archived']).withMessage('Status must be: new, read, replied, or archived'),

  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Admin notes cannot exceed 2000 characters'),
];

module.exports = { createContactRules, updateContactStatusRules };

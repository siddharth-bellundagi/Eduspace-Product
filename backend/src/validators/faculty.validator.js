/**
 * faculty.validator.js — Validation rules for faculty & staff endpoints
 */
const { body } = require('express-validator');

const createFacultyRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('designation')
    .trim()
    .notEmpty().withMessage('Designation is required')
    .isLength({ min: 2, max: 100 }).withMessage('Designation must be 2–100 characters'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters'),

  body('qualification')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Qualification cannot exceed 200 characters'),

  body('experience')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Experience cannot exceed 100 characters'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('order')
    .optional()
    .isInt({ min: 0, max: 999 }).withMessage('Display order must be 0–999'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updateFacultyRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('designation')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Designation must be 2–100 characters'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters'),

  body('qualification')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Qualification cannot exceed 200 characters'),

  body('experience')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Experience cannot exceed 100 characters'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('order')
    .optional()
    .isInt({ min: 0, max: 999 }).withMessage('Display order must be 0–999'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

module.exports = { createFacultyRules, updateFacultyRules };

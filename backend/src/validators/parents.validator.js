/**
 * parents.validator.js — Validation rules for parent section endpoints
 *
 * Covers: parent downloads, parent circulars, PTA
 */
const { body } = require('express-validator');

// ============================================
// Parent Downloads
// ============================================
const createDownloadRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

  body('category')
    .optional()
    .trim()
    .isIn(['circular', 'forms', 'syllabus', 'timetable', 'report', 'guidelines', 'other'])
    .withMessage('Invalid category'),

  body('classGrade')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class grade cannot exceed 50 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updateDownloadRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

  body('category')
    .optional()
    .trim()
    .isIn(['circular', 'forms', 'syllabus', 'timetable', 'report', 'guidelines', 'other'])
    .withMessage('Invalid category'),

  body('classGrade')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class grade cannot exceed 50 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

// ============================================
// Parent Circulars
// ============================================
const createParentCircularRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updateParentCircularRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

// ============================================
// PTA
// ============================================
const createPtaRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Content must be 10–5000 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updatePtaRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage('Content must be 10–5000 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

module.exports = {
  createDownloadRules, updateDownloadRules,
  createParentCircularRules, updateParentCircularRules,
  createPtaRules, updatePtaRules,
};

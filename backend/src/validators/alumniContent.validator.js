/**
 * alumniContent.validator.js — Validation rules for alumni content endpoints
 *
 * Covers: alumni stories, alumni events
 */
const { body } = require('express-validator');

// ============================================
// Alumni Stories
// ============================================
const createAlumniStoryRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 20, max: 10000 }).withMessage('Content must be 20–10000 characters'),

  body('author')
    .trim()
    .notEmpty().withMessage('Author name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Author name must be 2–100 characters'),

  body('batch')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Batch cannot exceed 50 characters'),

  body('isPublished')
    .optional()
    .isBoolean({ strict: false }).withMessage('isPublished must be true or false'),
];

const updateAlumniStoryRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('content')
    .optional()
    .trim()
    .isLength({ min: 20, max: 10000 }).withMessage('Content must be 20–10000 characters'),

  body('author')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Author name must be 2–100 characters'),

  body('batch')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Batch cannot exceed 50 characters'),

  body('isPublished')
    .optional()
    .isBoolean({ strict: false }).withMessage('isPublished must be true or false'),
];

// ============================================
// Alumni Events
// ============================================
const createAlumniEventRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Event title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 3000 }).withMessage('Description must be 10–3000 characters'),

  body('date')
    .notEmpty().withMessage('Event date is required')
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),

  body('venue')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Venue cannot exceed 200 characters'),

  body('isPublished')
    .optional()
    .isBoolean({ strict: false }).withMessage('isPublished must be true or false'),
];

const updateAlumniEventRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 3000 }).withMessage('Description must be 10–3000 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),

  body('venue')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Venue cannot exceed 200 characters'),

  body('isPublished')
    .optional()
    .isBoolean({ strict: false }).withMessage('isPublished must be true or false'),
];

module.exports = {
  createAlumniStoryRules, updateAlumniStoryRules,
  createAlumniEventRules, updateAlumniEventRules,
};

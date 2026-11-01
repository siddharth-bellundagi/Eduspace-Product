/**
 * news.validator.js — Validation rules for news & announcements endpoints
 *
 * Covers: announcements, ticker items, circulars, holidays
 */
const { body } = require('express-validator');

// ============================================
// Announcements
// ============================================
const createAnnouncementRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Content must be 10–5000 characters'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Priority must be: low, medium, high, or urgent'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),

  body('expiresAt')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Expiry date must be a valid ISO 8601 date'),
];

const updateAnnouncementRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage('Content must be 10–5000 characters'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Priority must be: low, medium, high, or urgent'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),

  body('expiresAt')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Expiry date must be a valid ISO 8601 date'),
];

// ============================================
// Ticker Items
// ============================================
const createTickerRules = [
  body('text')
    .trim()
    .notEmpty().withMessage('Ticker text is required')
    .isLength({ min: 5, max: 300 }).withMessage('Ticker text must be 5–300 characters'),

  body('link')
    .optional()
    .trim()
    .isURL().withMessage('Link must be a valid URL'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),

  body('order')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Order must be a number between 0 and 100'),
];

const updateTickerRules = [
  body('text')
    .optional()
    .trim()
    .isLength({ min: 5, max: 300 }).withMessage('Ticker text must be 5–300 characters'),

  body('link')
    .optional()
    .trim()
    .isURL().withMessage('Link must be a valid URL'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),

  body('order')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Order must be a number between 0 and 100'),
];

// ============================================
// Circulars
// ============================================
const createCircularRules = [
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

const updateCircularRules = [
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
// Holidays
// ============================================
const createHolidayRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Holiday name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Holiday name must be 2–200 characters'),

  body('date')
    .notEmpty().withMessage('Holiday date is required')
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('type')
    .optional()
    .isIn(['national', 'regional', 'school', 'exam']).withMessage('Type must be: national, regional, school, or exam'),
];

const updateHolidayRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Holiday name must be 2–200 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('type')
    .optional()
    .isIn(['national', 'regional', 'school', 'exam']).withMessage('Type must be: national, regional, school, or exam'),
];

module.exports = {
  createAnnouncementRules,
  updateAnnouncementRules,
  createTickerRules,
  updateTickerRules,
  createCircularRules,
  updateCircularRules,
  createHolidayRules,
  updateHolidayRules,
};

/**
 * events.validator.js — Validation rules for upcoming events endpoints
 */
const { body } = require('express-validator');

const createEventRules = [
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

  body('time')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Time cannot exceed 50 characters'),

  body('venue')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Venue cannot exceed 200 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updateEventRules = [
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

  body('time')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Time cannot exceed 50 characters'),

  body('venue')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Venue cannot exceed 200 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

module.exports = { createEventRules, updateEventRules };

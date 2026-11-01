/**
 * studentLife.validator.js — Validation rules for student life endpoints
 */
const { body } = require('express-validator');
const { STUDENT_LIFE_CATEGORIES } = require('../utils/constants');

const createStudentLifeRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 3000 }).withMessage('Description must be 10–3000 characters'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn(STUDENT_LIFE_CATEGORIES)
    .withMessage(`Category must be one of: ${STUDENT_LIFE_CATEGORIES.join(', ')}`),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updateStudentLifeRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 3000 }).withMessage('Description must be 10–3000 characters'),

  body('category')
    .optional()
    .trim()
    .isIn(STUDENT_LIFE_CATEGORIES)
    .withMessage(`Category must be one of: ${STUDENT_LIFE_CATEGORIES.join(', ')}`),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

module.exports = { createStudentLifeRules, updateStudentLifeRules };

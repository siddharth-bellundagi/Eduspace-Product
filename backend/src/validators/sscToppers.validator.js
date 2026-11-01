/**
 * sscToppers.validator.js — Validation rules for SSC Toppers
 */
const { body } = require('express-validator');

const createTopperRules = [
  body('studentName')
    .trim()
    .notEmpty().withMessage('Student name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Student name must be 2–100 characters'),

  body('percentage')
    .trim()
    .notEmpty().withMessage('Percentage or marks is required')
    .isLength({ max: 50 }).withMessage('Percentage cannot exceed 50 characters'),

  body('academicYear')
    .trim()
    .notEmpty().withMessage('Academic year is required (e.g. 2024-25)')
    .isLength({ min: 4, max: 20 }).withMessage('Academic year must be 4–20 characters'),

  body('rankNum')
    .optional(),

  body('totalMarks')
    .optional()
    .trim()
    .isLength({ max: 50 }),

  body('stream')
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 }),

  body('isActive')
    .optional(),
];

const updateTopperRules = [
  body('studentName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }),

  body('percentage')
    .optional()
    .trim()
    .isLength({ max: 50 }),

  body('academicYear')
    .optional()
    .trim()
    .isLength({ min: 4, max: 20 }),

  body('rankNum')
    .optional(),

  body('totalMarks')
    .optional()
    .trim()
    .isLength({ max: 50 }),

  body('stream')
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 }),

  body('isActive')
    .optional(),
];

module.exports = {
  createTopperRules,
  updateTopperRules,
};

/**
 * alumni.validator.js — Validation rules for alumni registration endpoints
 */
const { body } = require('express-validator');

const createAlumniRules = [
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
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit mobile number'),

  // Allow graduationYear, yearOfPassing, or passoutYear
  body().custom((value, { req }) => {
    const yr = req.body.graduationYear || req.body.yearOfPassing || req.body.passoutYear;
    if (!yr) {
      throw new Error('Year of graduation/passing is required');
    }
    const num = parseInt(yr, 10);
    if (isNaN(num) || num < 1950 || num > new Date().getFullYear()) {
      throw new Error(`Graduation year must be between 1950 and ${new Date().getFullYear()}`);
    }
    return true;
  }),

  body('occupation')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Occupation cannot exceed 200 characters'),

  body('currentOccupation')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Occupation cannot exceed 200 characters'),

  body('message')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
];

module.exports = { createAlumniRules };

/**
 * achievements.validator.js — Validation rules for achievements & awards endpoints
 */
const { body } = require('express-validator');

// ============================================
// Student Achievements
// ============================================
const createAchievementRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Achievement title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 5, max: 3000 }).withMessage('Description must be 5–3000 characters'),

  body('studentName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Student name must be under 100 characters'),

  body('class')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class cannot exceed 50 characters'),

  body('classGrade')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class cannot exceed 50 characters'),

  body('date')
    .optional(),

  body('category')
    .optional()
    .isIn(['academic', 'sports', 'cultural', 'science', 'other'])
    .withMessage('Category must be: academic, sports, cultural, science, or other'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updateAchievementRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 3000 }).withMessage('Description must be 5–3000 characters'),

  body('studentName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Student name must be under 100 characters'),

  body('class')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class cannot exceed 50 characters'),

  body('classGrade')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class cannot exceed 50 characters'),

  body('date')
    .optional(),

  body('category')
    .optional()
    .isIn(['academic', 'sports', 'cultural', 'science', 'other'])
    .withMessage('Category must be: academic, sports, cultural, science, or other'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

// ============================================
// Awards
// ============================================
const createAwardRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Award title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 3000 }).withMessage('Description cannot exceed 3000 characters'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),

  body('year')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Year cannot exceed 20 characters'),

  body('recipient')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Recipient cannot exceed 100 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updateAwardRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 3000 }).withMessage('Description cannot exceed 3000 characters'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),

  body('year')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Year cannot exceed 20 characters'),

  body('recipient')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Recipient cannot exceed 100 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

module.exports = {
  createAchievementRules, updateAchievementRules,
  createAwardRules, updateAwardRules,
};

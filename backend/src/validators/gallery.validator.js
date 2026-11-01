/**
 * gallery.validator.js — Validation rules for gallery endpoints
 */
const { body } = require('express-validator');
const { GALLERY_CATEGORIES } = require('../utils/constants');

const createGalleryRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn(GALLERY_CATEGORIES)
    .withMessage(`Category must be one of: ${GALLERY_CATEGORIES.join(', ')}`),

  body('classGrade')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('classGrade cannot exceed 50 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updateGalleryRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('category')
    .optional()
    .trim()
    .isIn(GALLERY_CATEGORIES)
    .withMessage(`Category must be one of: ${GALLERY_CATEGORIES.join(', ')}`),

  body('classGrade')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('classGrade cannot exceed 50 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

module.exports = { createGalleryRules, updateGalleryRules };

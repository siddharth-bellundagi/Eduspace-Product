/**
 * academics.validator.js — Validation rules for academics endpoints
 *
 * Covers: programs, curriculum, academic calendar, syllabus, exams
 */
const { body } = require('express-validator');

// ============================================
// Academic Programs
// ============================================
const createProgramRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),

  body('sectionKey')
    .optional()
    .trim()
    .isIn(['prePrimary', 'primary', 'secondary']).withMessage('Section key must be: prePrimary, primary, or secondary'),

  body('highlights')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Highlights cannot exceed 2000 characters'),

  body('timings')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Timings cannot exceed 200 characters'),

  body('ageCriteria')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Age criteria cannot exceed 200 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updateProgramRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),

  body('sectionKey')
    .optional()
    .trim()
    .isIn(['prePrimary', 'primary', 'secondary']).withMessage('Section key must be: prePrimary, primary, or secondary'),

  body('highlights')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Highlights cannot exceed 2000 characters'),

  body('timings')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Timings cannot exceed 200 characters'),

  body('ageCriteria')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Age criteria cannot exceed 200 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

// ============================================
// Curriculum (backward compat — same as syllabus)
// ============================================
const createCurriculumRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),

  body('classGrade')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class/Grade cannot exceed 50 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updateCurriculumRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),

  body('classGrade')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class/Grade cannot exceed 50 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

// ============================================
// Academic Calendar
// ============================================
const createCalendarRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 3000 }).withMessage('Description cannot exceed 3000 characters'),

  body('eventDate')
    .notEmpty().withMessage('Event date is required')
    .isISO8601().withMessage('Event date must be a valid date'),

  body('classGrade')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class/Grade cannot exceed 50 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updateCalendarRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 3000 }).withMessage('Description cannot exceed 3000 characters'),

  body('eventDate')
    .optional()
    .isISO8601().withMessage('Event date must be a valid date'),

  body('classGrade')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class/Grade cannot exceed 50 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

// ============================================
// Syllabus & Course Outline
// ============================================
const createSyllabusRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),

  body('classGrade')
    .notEmpty().withMessage('Class/Grade is required')
    .trim()
    .isLength({ max: 50 }).withMessage('Class/Grade cannot exceed 50 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updateSyllabusRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),

  body('classGrade')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class/Grade cannot exceed 50 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

// ============================================
// Exam Schedules
// ============================================
const createExamRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),

  body('examType')
    .optional()
    .isIn(['unit-test', 'mid-term', 'final', 'practical', 'prelim', 'other'])
    .withMessage('Exam type must be: unit-test, mid-term, final, practical, prelim, or other'),

  body('eventDate')
    .optional()
    .isISO8601().withMessage('Event date must be a valid date'),

  body('classGrade')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class/Grade cannot exceed 50 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

const updateExamRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),

  body('examType')
    .optional()
    .isIn(['unit-test', 'mid-term', 'final', 'practical', 'prelim', 'other'])
    .withMessage('Exam type must be: unit-test, mid-term, final, practical, prelim, or other'),

  body('eventDate')
    .optional()
    .isISO8601().withMessage('Event date must be a valid date'),

  body('classGrade')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class/Grade cannot exceed 50 characters'),

  body('isActive')
    .optional()
    .isBoolean({ strict: false }).withMessage('isActive must be true or false'),
];

module.exports = {
  createProgramRules, updateProgramRules,
  createCurriculumRules, updateCurriculumRules,
  createCalendarRules, updateCalendarRules,
  createSyllabusRules, updateSyllabusRules,
  createExamRules, updateExamRules,
};

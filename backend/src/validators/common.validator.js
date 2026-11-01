/**
 * common.validator.js — Shared validation rules
 * Reusable validation chains for common fields like email, phone, etc.
 */
const { body } = require('express-validator');

/**
 * Indian phone number validation (10 digits, optional +91 prefix)
 */
const phoneRule = (field = 'phone', required = false) => {
  let chain = body(field)
    .trim();

  if (required) {
    chain = chain.notEmpty().withMessage('Phone number is required');
  } else {
    chain = chain.optional({ values: 'falsy' });
  }

  return chain
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit Indian phone number');
};

/**
 * Email validation
 */
const emailRule = (field = 'email', required = true) => {
  let chain = body(field)
    .trim()
    .toLowerCase();

  if (required) {
    chain = chain.notEmpty().withMessage('Email is required');
  } else {
    chain = chain.optional({ values: 'falsy' });
  }

  return chain
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail();
};

/**
 * Name validation
 */
const nameRule = (field = 'name', label = 'Name', required = true) => {
  let chain = body(field)
    .trim();

  if (required) {
    chain = chain.notEmpty().withMessage(`${label} is required`);
  } else {
    chain = chain.optional({ values: 'falsy' });
  }

  return chain
    .isLength({ min: 2, max: 100 })
    .withMessage(`${label} must be between 2 and 100 characters`)
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage(`${label} can only contain letters, spaces, dots, hyphens, and apostrophes`);
};

/**
 * Message/text area validation
 */
const messageRule = (field = 'message', maxLength = 2000, required = false) => {
  let chain = body(field)
    .trim();

  if (required) {
    chain = chain.notEmpty().withMessage('Message is required');
  } else {
    chain = chain.optional({ values: 'falsy' });
  }

  return chain
    .isLength({ max: maxLength })
    .withMessage(`Message cannot exceed ${maxLength} characters`);
};

module.exports = { phoneRule, emailRule, nameRule, messageRule };

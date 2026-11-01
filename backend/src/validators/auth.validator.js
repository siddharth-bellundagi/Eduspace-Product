/**
 * auth.validator.js — Validation rules for native JWT auth endpoints
 */
const { body } = require('express-validator');

const loginRules = [
  body('email')
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

module.exports = { loginRules };

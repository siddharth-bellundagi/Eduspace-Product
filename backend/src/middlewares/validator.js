/**
 * validator.js — Express-validator middleware wrapper
 *
 * Provides a reusable middleware that runs validation chains from
 * express-validator and returns formatted error responses.
 */
const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/ApiError');

/**
 * Middleware that checks validation results after express-validator chains.
 * If there are errors, it throws a ValidationError (caught by errorHandler).
 *
 * Usage in routes:
 *   router.post('/admissions',
 *     admissionValidationRules,  // array of express-validator chains
 *     validate,                   // this middleware
 *     admissionController.create  // the actual handler
 *   );
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    throw new ValidationError(formattedErrors);
  }

  next();
}

module.exports = validate;

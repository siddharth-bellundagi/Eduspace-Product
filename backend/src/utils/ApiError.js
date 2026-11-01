/**
 * ApiError — Custom error classes for consistent error handling
 * All errors thrown in the app should use these classes so the
 * global error handler can format them properly.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Array} errors - Field-level validation errors
   * @param {boolean} isOperational - Expected (true) vs unexpected (false) error
   */
  constructor(statusCode, message, errors = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    // Capture stack trace, excluding the constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad request', errors = []) {
    super(400, message, errors);
  }
}

class ValidationError extends ApiError {
  constructor(errors = [], message = 'Validation failed') {
    super(400, message, errors);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized — please login') {
    super(401, message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden — insufficient permissions') {
    super(403, message);
  }
}

class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(409, message);
  }
}

class TooManyRequestsError extends ApiError {
  constructor(message = 'Too many requests — please try again later') {
    super(429, message);
  }
}

class InternalError extends ApiError {
  constructor(message = 'Internal server error') {
    super(500, message, [], false);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalError,
};

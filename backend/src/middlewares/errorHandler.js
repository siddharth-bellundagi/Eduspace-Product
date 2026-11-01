/**
 * errorHandler.js — Global error handling middleware
 *
 * Catches all errors from routes, controllers, and services.
 * Formats standardized JSON responses.
 */
const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];
  let isOperational = err.isOperational ?? false;

  // Express body-parser JSON syntax error
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    isOperational = true;
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'Uploaded file is too large';
    isOperational = true;
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
    isOperational = true;
  }

  // SQLite constraint errors
  if (err.code === 'SQLITE_CONSTRAINT' || err.message?.includes('UNIQUE constraint failed')) {
    statusCode = 409;
    message = 'A record with these unique details already exists.';
    isOperational = true;
  }

  // CORS errors
  if (err.message && err.message.includes('not allowed by CORS')) {
    statusCode = 403;
    message = err.message;
    isOperational = true;
  }

  // Log error
  if (isOperational) {
    logger.warn(`[${statusCode}] ${message}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
  } else {
    logger.error(`[${statusCode}] ${message}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      stack: err.stack,
    });
  }

  const response = {
    success: false,
    message: isOperational ? message : 'Something went wrong — please try again later',
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV === 'development' && !isOperational) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}

module.exports = errorHandler;

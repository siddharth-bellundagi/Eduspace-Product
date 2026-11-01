/**
 * auth.js — JWT Authentication Middleware
 *
 * Verifies Bearer JWT tokens in the Authorization header.
 * Also validates that the user still exists in the database
 * (prevents deleted/deactivated users from keeping access).
 */
const AuthService = require('../services/auth.service');
const { UnauthorizedError, ForbiddenError } = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Verify JWT token from Authorization: Bearer <token>
 * Also checks that the user still exists in the database.
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing. Please log in.');
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) {
      throw new UnauthorizedError('Empty authentication token provided.');
    }

    const decoded = AuthService.verifyToken(token);

    // Verify user still exists in database (prevents access with stale tokens)
    const user = await AuthService.getUserById(decoded.id);
    if (!user) {
      logger.warn(`Auth: Token valid but user ID ${decoded.id} no longer exists in database`);
      throw new UnauthorizedError('Your account has been deactivated. Please contact the administrator.');
    }

    // Use fresh DB data (not stale JWT claims) for role checks
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: user.role === 'admin',
    };
    next();
  } catch (error) {
    if (error.statusCode) {
      return next(error);
    }
    logger.warn('Auth middleware rejection:', error.message);
    return next(new UnauthorizedError('Invalid or expired authentication session.'));
  }
}

/**
 * Require admin privileges
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role !== 'admin' && req.user.isAdmin !== true) {
    logger.warn(`Access denied for ${req.user.email} on ${req.method} ${req.originalUrl}`);
    return next(new ForbiddenError('Administrator access required.'));
  }

  next();
}

module.exports = { verifyToken, requireAdmin };

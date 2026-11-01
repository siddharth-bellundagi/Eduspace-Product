/**
 * auth.service.js — Native JWT & Bcrypt Authentication Service
 *
 * Fully replaces Firebase Auth. Self-contained, secure, independent.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { env } = require('../config/env');
const { UnauthorizedError, BadRequestError } = require('../utils/ApiError');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Authenticate admin user with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} { token, user }
   */
  static async login(email, password) {
    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.get('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);

    if (!user) {
      logger.warn(`Auth: Failed login attempt for unknown user: ${email}`);
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logger.warn(`Auth: Incorrect password for user: ${email}`);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.role === 'admin',
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    logger.info(`Auth: Successful login for ${user.email} (Role: ${user.role})`);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.role === 'admin',
      },
    };
  }

  /**
   * Verify and decode a JWT token
   * @param {string} token
   * @returns {Object} Decoded user payload
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Session has expired. Please log in again.');
      }
      throw new UnauthorizedError('Invalid authentication token.');
    }
  }

  /**
   * Get user profile by ID
   * @param {number|string} id
   */
  static async getUserById(id) {
    const user = await db.get('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [id]);
    return user || null;
  }

  /**
   * Create or update an admin user
   * @param {Object} userData
   */
  static async createOrUpdateAdmin({ email, password, name = 'School Admin', role = 'admin' }) {
    const normalizedEmail = email.trim().toLowerCase();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const existing = await db.get('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]);

    if (existing) {
      await db.run(
        'UPDATE users SET password_hash = ?, name = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [passwordHash, name, role, existing.id]
      );
      logger.info(`Auth: Updated existing admin user: ${normalizedEmail}`);
      return { id: existing.id, email: normalizedEmail, updated: true };
    } else {
      const result = await db.run(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        [normalizedEmail, passwordHash, name, role]
      );
      logger.info(`Auth: Created new admin user: ${normalizedEmail}`);
      return { id: result.lastID, email: normalizedEmail, created: true };
    }
  }
}

module.exports = AuthService;

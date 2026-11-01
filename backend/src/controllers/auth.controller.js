/**
 * auth.controller.js — Native Authentication Controller
 *
 * Handles:
 *   - POST /api/auth/login  — Direct email & password authentication
 *   - GET  /api/auth/verify — Verify current token
 *   - GET  /api/auth/me     — Current user profile
 */
const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);

  // Return token and user data matching the frontend's expectations
  ApiResponse.success(
    res,
    {
      token: result.token,
      idToken: result.token, // backward compatibility with any script expecting idToken
      user: result.user,
      uid: result.user.id,
      email: result.user.email,
      displayName: result.user.name,
      isAdmin: result.user.isAdmin,
    },
    'Admin login successful'
  );
});

/**
 * GET /api/auth/verify
 */
const verify = asyncHandler(async (req, res) => {
  ApiResponse.success(
    res,
    {
      valid: true,
      user: req.user,
      uid: req.user.id,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
    },
    'Authentication session is valid'
  );
});

/**
 * GET /api/auth/me
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await AuthService.getUserById(req.user.id);
  ApiResponse.success(res, profile, 'Admin profile retrieved');
});

module.exports = { login, verify, getProfile };

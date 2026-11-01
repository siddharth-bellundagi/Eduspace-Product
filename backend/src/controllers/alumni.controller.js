/**
 * alumni.controller.js — Alumni Registration controller
 *
 * Handles:
 *   - POST   /api/alumni      — Register as alumni (public, rate-limited)
 *   - GET    /api/alumni       — List all registrations (admin, paginated)
 *   - GET    /api/alumni/:id   — Get single registration (admin)
 *   - DELETE /api/alumni/:id   — Delete registration (admin)
 */
const SqlService = require('../services/sql.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { TABLES, SUBMISSION_STATUS, PAGINATION } = require('../utils/constants');

const alumniService = new SqlService(TABLES.ALUMNI_REGISTRATIONS);

/** POST /api/alumni — Public form submission */
const create = asyncHandler(async (req, res) => {
  const { name, email, phone, yearOfPassing, graduationYear, passoutYear, occupation, currentOccupation, message } = req.body;
  const resolvedYear = String(graduationYear || passoutYear || yearOfPassing || '');
  const resolvedOccupation = occupation || currentOccupation || '';

  const registration = await alumniService.create({
    name,
    email,
    phone: phone || '',
    graduationYear: resolvedYear,   // canonical year column
    passoutYear: resolvedYear,      // kept for backward compat — both columns exist in DB schema
    currentOccupation: resolvedOccupation,
    message: message || '',
    status: SUBMISSION_STATUS.NEW,
  });

  ApiResponse.created(res, { id: registration.id }, 'Alumni registration submitted successfully');
});

/** GET /api/alumni — Admin: List all registrations (paginated) */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit, orderBy, order, status } = req.query;

  const filters = [];
  if (status) {
    filters.push({ field: 'status', operator: '==', value: status });
  }

  const result = await alumniService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: orderBy || 'createdAt',
    order: order || 'desc',
    filters,
  });

  // Ensure both passoutYear and graduationYear are populated for the frontend table
  const enriched = result.data.map((item) => ({
    ...item,
    passoutYear: item.passoutYear || item.graduationYear || '',
    graduationYear: item.graduationYear || item.passoutYear || '',
    currentOccupation: item.currentOccupation || '',
  }));

  ApiResponse.paginated(res, enriched, result.pagination, 'Alumni registrations fetched');
});

/** GET /api/alumni/:id — Admin: Get single registration */
const getById = asyncHandler(async (req, res) => {
  const registration = await alumniService.getById(req.params.id);
  ApiResponse.success(
    res,
    {
      ...registration,
      passoutYear: registration.passoutYear || registration.graduationYear,
    },
    'Alumni registration retrieved'
  );
});

/** DELETE /api/alumni/:id — Admin: Delete registration */
const remove = asyncHandler(async (req, res) => {
  const result = await alumniService.delete(req.params.id);
  ApiResponse.success(res, result, 'Alumni registration deleted');
});

module.exports = { create, getAll, getById, remove };

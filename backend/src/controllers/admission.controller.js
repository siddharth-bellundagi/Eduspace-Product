/**
 * admission.controller.js — Admission Enquiry controller
 *
 * Handles:
 *   - POST   /api/admissions      — Submit new admission enquiry (public, rate-limited)
 *   - GET    /api/admissions       — List all enquiries (admin, paginated)
 *   - GET    /api/admissions/:id   — Get single enquiry (admin)
 *   - PATCH  /api/admissions/:id   — Update enquiry status (admin)
 *   - DELETE /api/admissions/:id   — Delete enquiry (admin)
 */
const SqlService = require('../services/sql.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { TABLES, SUBMISSION_STATUS, PAGINATION } = require('../utils/constants');

const admissionService = new SqlService(TABLES.ADMISSION_ENQUIRIES);

/** POST /api/admissions — Public form submission */
const create = asyncHandler(async (req, res) => {
  const { studentName, parentName, email, phone, dob, classApplied, message } = req.body;

  const enquiry = await admissionService.create({
    studentName,
    parentName,
    email,
    phone,
    dob: dob || '',
    classApplied,
    message: message || '',
    status: SUBMISSION_STATUS.NEW,
    submittedFrom: req.headers['origin'] || req.headers['referer'] || 'website',
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
  });

  ApiResponse.created(res, { id: enquiry.id }, 'Admission enquiry submitted successfully');
});

/** GET /api/admissions — Admin: List all enquiries (paginated) */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit, orderBy, order, status } = req.query;

  const filters = [];
  if (status) {
    filters.push({ field: 'status', operator: '==', value: status });
  }

  const result = await admissionService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: orderBy || 'createdAt',
    order: order || 'desc',
    filters,
  });

  ApiResponse.paginated(res, result.data, result.pagination, 'Admission enquiries fetched');
});

/** GET /api/admissions/:id — Admin: Get single enquiry */
const getById = asyncHandler(async (req, res) => {
  const enquiry = await admissionService.getById(req.params.id);
  ApiResponse.success(res, enquiry, 'Admission enquiry retrieved');
});

/** PATCH /api/admissions/:id — Admin: Update enquiry status/notes */
const update = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;

  const updateData = {};
  if (status) updateData.status = status;
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

  const updated = await admissionService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Admission enquiry updated');
});

/** DELETE /api/admissions/:id — Admin: Delete enquiry */
const remove = asyncHandler(async (req, res) => {
  const result = await admissionService.delete(req.params.id);
  ApiResponse.success(res, result, 'Admission enquiry deleted');
});

module.exports = { create, getAll, getById, update, remove };

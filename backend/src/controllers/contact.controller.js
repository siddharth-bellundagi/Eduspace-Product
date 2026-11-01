/**
 * contact.controller.js — Contact Inquiries controller
 *
 * Handles:
 *   - POST   /api/contact      — Submit contact message (public, rate-limited)
 *   - GET    /api/contact       — List all messages (admin, paginated)
 *   - GET    /api/contact/:id   — Get single message (admin)
 *   - PATCH  /api/contact/:id   — Update message status (admin)
 *   - DELETE /api/contact/:id   — Delete message (admin)
 */
const SqlService = require('../services/sql.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { TABLES, SUBMISSION_STATUS, PAGINATION } = require('../utils/constants');

const contactService = new SqlService(TABLES.CONTACT_INQUIRIES);

/** POST /api/contact — Public form submission */
const create = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  const inquiry = await contactService.create({
    name,
    email,
    phone: phone || '',
    subject,
    message,
    status: SUBMISSION_STATUS.NEW,
    submittedFrom: req.headers['origin'] || req.headers['referer'] || 'website',
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
  });

  ApiResponse.created(res, { id: inquiry.id }, 'Contact message submitted successfully');
});

/** GET /api/contact — Admin: List all messages (paginated) */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit, orderBy, order, status } = req.query;

  const filters = [];
  if (status) {
    filters.push({ field: 'status', operator: '==', value: status });
  }

  const result = await contactService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: orderBy || 'createdAt',
    order: order || 'desc',
    filters,
  });

  ApiResponse.paginated(res, result.data, result.pagination, 'Contact messages fetched');
});

/** GET /api/contact/:id — Admin: Get single message */
const getById = asyncHandler(async (req, res) => {
  const inquiry = await contactService.getById(req.params.id);
  ApiResponse.success(res, inquiry, 'Contact message retrieved');
});

/** PATCH /api/contact/:id — Admin: Update message status/notes */
const update = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;

  const updateData = {};
  if (status) updateData.status = status;
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

  const updated = await contactService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Contact message updated');
});

/** DELETE /api/contact/:id — Admin: Delete message */
const remove = asyncHandler(async (req, res) => {
  const result = await contactService.delete(req.params.id);
  ApiResponse.success(res, result, 'Contact message deleted');
});

module.exports = { create, getAll, getById, update, remove };

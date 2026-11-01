/**
 * events.controller.js — Upcoming Events controller
 *
 * Handles:
 *   - GET    /api/events       — Public: List upcoming events
 *   - GET    /api/events/all   — Admin: All events (paginated)
 *   - GET    /api/events/:id   — Admin: Get single event
 *   - POST   /api/events       — Admin: Create event
 *   - PUT    /api/events/:id   — Admin: Update event
 *   - DELETE /api/events/:id   — Admin: Delete event
 */
const SqlService = require('../services/sql.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { TABLES, PAGINATION } = require('../utils/constants');

const eventService = new SqlService(TABLES.UPCOMING_EVENTS);

/** GET /api/events — Public: Active upcoming events (excludes past events) */
const list = asyncHandler(async (req, res) => {
  const items = await eventService.list({
    orderBy: 'eventDate',
    order: 'asc',
    maxResults: 20,
    filters: [{ field: 'isActive', operator: '==', value: true }],
  });

  // Filter out past events (only show today and future)
  const today = new Date().toISOString().split('T')[0];
  const upcoming = items.filter(
    (e) => !e.eventDate || e.eventDate >= today
  );

  const formatted = upcoming.map((e) => ({
    ...e,
    date: e.eventDate || e.date,
  }));

  ApiResponse.success(res, formatted, 'Upcoming events fetched');
});

/** GET /api/events/all — Admin: All events (paginated) */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit, orderBy, order } = req.query;
  const result = await eventService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: orderBy ? (orderBy === 'date' ? 'eventDate' : orderBy) : 'eventDate',
    order: order || 'asc',
  });

  const formatted = result.data.map((e) => ({
    ...e,
    date: e.eventDate || e.date,
  }));

  ApiResponse.paginated(res, formatted, result.pagination, 'All events fetched');
});

/** GET /api/events/:id — Admin: Single event */
const getById = asyncHandler(async (req, res) => {
  const item = await eventService.getById(req.params.id);
  ApiResponse.success(res, { ...item, date: item.eventDate || item.date }, 'Event retrieved');
});

/** POST /api/events — Admin: Create event */
const create = asyncHandler(async (req, res) => {
  const { title, description, date, time, venue, isActive } = req.body;
  const item = await eventService.create({
    title,
    description: description || '',
    eventDate: date,
    eventTime: time || '',
    venue: venue || '',
    isActive: isActive !== undefined ? isActive : true,
  });
  ApiResponse.created(res, { ...item, date: item.eventDate }, 'Event created');
});

/** PUT /api/events/:id — Admin: Update event */
const update = asyncHandler(async (req, res) => {
  const { title, description, date, time, venue, isActive } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (date !== undefined) updateData.eventDate = date;
  if (time !== undefined) updateData.eventTime = time;
  if (venue !== undefined) updateData.venue = venue;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updated = await eventService.update(req.params.id, updateData);
  ApiResponse.success(res, { ...updated, date: updated.eventDate }, 'Event updated');
});

/** DELETE /api/events/:id — Admin: Delete event */
const remove = asyncHandler(async (req, res) => {
  const result = await eventService.delete(req.params.id);
  ApiResponse.success(res, result, 'Event deleted');
});

module.exports = { list, getAll, getById, create, update, remove };

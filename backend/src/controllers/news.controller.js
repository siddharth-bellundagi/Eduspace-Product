/**
 * news.controller.js — News & Announcements controller
 *
 * Handles:
 *   - Announcements
 *   - News Ticker Items
 *   - Circulars
 *   - Holidays
 */
const SqlService = require('../services/sql.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { TABLES, PAGINATION } = require('../utils/constants');
const { NotFoundError } = require('../utils/ApiError');

const announcementService = new SqlService(TABLES.ANNOUNCEMENTS);
const tickerService = new SqlService(TABLES.TICKER_ITEMS);
const circularHolidayService = new SqlService(TABLES.CIRCULARS_HOLIDAYS);

// ============================================
// ANNOUNCEMENTS
// ============================================

/** GET /api/news/announcements — Public: Active announcements (not expired) */
const listAnnouncements = asyncHandler(async (req, res) => {
  const items = await announcementService.list({
    orderBy: 'createdAt',
    order: 'desc',
    maxResults: 20,
    filters: [{ field: 'isActive', operator: '==', value: true }],
  });

  // Filter out expired announcements (expiresAt < now)
  const now = new Date().toISOString();
  const active = items.filter(
    (item) => !item.expiresAt || item.expiresAt > now
  );

  ApiResponse.success(res, active, 'Announcements fetched');
});

/** GET /api/news/announcements/all — Admin: All announcements (paginated) */
const getAllAnnouncements = asyncHandler(async (req, res) => {
  const { page, limit, orderBy, order } = req.query;
  const result = await announcementService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: orderBy || 'createdAt',
    order: order || 'desc',
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All announcements fetched');
});

/** GET /api/news/announcements/:id — Single announcement */
const getAnnouncementById = asyncHandler(async (req, res) => {
  const item = await announcementService.getById(req.params.id);
  ApiResponse.success(res, item, 'Announcement retrieved');
});

/** POST /api/news/announcements — Admin: Create announcement */
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, priority, isActive, expiresAt } = req.body;
  const item = await announcementService.create({
    title,
    content,
    priority: priority || 'medium',
    isActive: isActive !== undefined ? isActive : true,
    expiresAt: expiresAt || null,
  });
  ApiResponse.created(res, item, 'Announcement created');
});

/** PUT /api/news/announcements/:id — Admin: Update announcement */
const updateAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, priority, isActive, expiresAt } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (priority !== undefined) updateData.priority = priority;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (expiresAt !== undefined) updateData.expiresAt = expiresAt;

  const updated = await announcementService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Announcement updated');
});

/** DELETE /api/news/announcements/:id — Admin: Delete announcement */
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const result = await announcementService.delete(req.params.id);
  ApiResponse.success(res, result, 'Announcement deleted');
});

// ============================================
// TICKER ITEMS
// ============================================

/** GET /api/news/ticker and GET /api/ticker — Public: Active ticker items */
const listTicker = asyncHandler(async (req, res) => {
  const items = await tickerService.list({
    orderBy: 'orderNum',
    order: 'asc',
    maxResults: 25,
    filters: [{ field: 'isActive', operator: '==', value: true }],
  });
  ApiResponse.success(res, items, 'Ticker items fetched');
});

/** GET /api/news/ticker/all — Admin: All ticker items (paginated) */
const getAllTicker = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await tickerService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'orderNum',
    order: 'asc',
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All ticker items fetched');
});

/** GET /api/news/ticker/:id — Admin: Single ticker item */
const getTickerById = asyncHandler(async (req, res) => {
  const item = await tickerService.getById(req.params.id);
  ApiResponse.success(res, item, 'Ticker item retrieved');
});

/** POST /api/news/ticker — Admin: Create ticker item */
const createTicker = asyncHandler(async (req, res) => {
  const { text, link, isActive, order, orderNum } = req.body;
  const item = await tickerService.create({
    text,
    link: link || '',
    isActive: isActive !== undefined ? isActive : true,
    orderNum: orderNum !== undefined ? parseInt(orderNum, 10) : (order !== undefined ? parseInt(order, 10) : 0),
  });
  ApiResponse.created(res, item, 'Ticker item created');
});

/** PUT /api/news/ticker/:id — Admin: Update ticker item */
const updateTicker = asyncHandler(async (req, res) => {
  const { text, link, isActive, order, orderNum } = req.body;
  const updateData = {};
  if (text !== undefined) updateData.text = text;
  if (link !== undefined) updateData.link = link;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (orderNum !== undefined || order !== undefined) {
    updateData.orderNum = parseInt(orderNum !== undefined ? orderNum : order, 10);
  }

  const updated = await tickerService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Ticker item updated');
});

/** DELETE /api/news/ticker/:id — Admin: Delete ticker item */
const deleteTicker = asyncHandler(async (req, res) => {
  const result = await tickerService.delete(req.params.id);
  ApiResponse.success(res, result, 'Ticker item deleted');
});

// ============================================
// CIRCULARS
// ============================================

/** GET /api/news/circulars — Public: Active circulars */
const listCirculars = asyncHandler(async (req, res) => {
  const items = await circularHolidayService.list({
    orderBy: 'createdAt',
    order: 'desc',
    maxResults: 30,
    filters: [
      { field: 'type', operator: '==', value: 'circular' },
      { field: 'isActive', operator: '==', value: true },
    ],
  });
  ApiResponse.success(res, items, 'Circulars fetched');
});

/** GET /api/news/circulars/all — Admin: All circulars (paginated) */
const getAllCirculars = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await circularHolidayService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'createdAt',
    order: 'desc',
    filters: [{ field: 'type', operator: '==', value: 'circular' }],
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All circulars fetched');
});

/** GET /api/news/circulars/:id — Admin: Single circular */
const getCircularById = asyncHandler(async (req, res) => {
  const item = await circularHolidayService.getById(req.params.id);
  if (item.type !== 'circular') throw new NotFoundError('Circular');
  ApiResponse.success(res, item, 'Circular retrieved');
});

/** POST /api/news/circulars — Admin: Create circular */
const createCircular = asyncHandler(async (req, res) => {
  const { title, description, date, isActive, fileUrl } = req.body;
  const item = await circularHolidayService.create({
    type: 'circular',
    title,
    description: description || '',
    eventDate: date || new Date().toISOString(),
    isActive: isActive !== undefined ? isActive : true,
    fileUrl: fileUrl || '',
  });
  ApiResponse.created(res, item, 'Circular created');
});

/** PUT /api/news/circulars/:id — Admin: Update circular */
const updateCircular = asyncHandler(async (req, res) => {
  const { title, description, date, isActive, fileUrl } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (date !== undefined) updateData.eventDate = date;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (fileUrl !== undefined) updateData.fileUrl = fileUrl;

  const updated = await circularHolidayService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Circular updated');
});

/** DELETE /api/news/circulars/:id — Admin: Delete circular */
const deleteCircular = asyncHandler(async (req, res) => {
  const result = await circularHolidayService.delete(req.params.id);
  ApiResponse.success(res, result, 'Circular deleted');
});

// ============================================
// HOLIDAYS
// ============================================

/** GET /api/news/holidays — Public: Holidays */
const listHolidays = asyncHandler(async (req, res) => {
  const items = await circularHolidayService.list({
    orderBy: 'eventDate',
    order: 'asc',
    maxResults: 50,
    filters: [{ field: 'type', operator: '==', value: 'holiday' }],
  });
  ApiResponse.success(res, items, 'Holidays fetched');
});

/** GET /api/news/holidays/all — Admin: All holidays */
const getAllHolidays = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await circularHolidayService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'eventDate',
    order: 'asc',
    filters: [{ field: 'type', operator: '==', value: 'holiday' }],
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All holidays fetched');
});

/** GET /api/news/holidays/:id — Admin: Single holiday */
const getHolidayById = asyncHandler(async (req, res) => {
  const item = await circularHolidayService.getById(req.params.id);
  if (item.type !== 'holiday') throw new NotFoundError('Holiday');
  ApiResponse.success(res, item, 'Holiday retrieved');
});

/** POST /api/news/holidays — Admin: Create holiday */
const createHoliday = asyncHandler(async (req, res) => {
  const { title, date, description } = req.body;
  const item = await circularHolidayService.create({
    type: 'holiday',
    title,
    eventDate: date,
    description: description || '',
    isActive: true,
  });
  ApiResponse.created(res, item, 'Holiday created');
});

/** PUT /api/news/holidays/:id — Admin: Update holiday */
const updateHoliday = asyncHandler(async (req, res) => {
  const { title, date, description } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (date !== undefined) updateData.eventDate = date;
  if (description !== undefined) updateData.description = description;

  const updated = await circularHolidayService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Holiday updated');
});

/** DELETE /api/news/holidays/:id — Admin: Delete holiday */
const deleteHoliday = asyncHandler(async (req, res) => {
  const result = await circularHolidayService.delete(req.params.id);
  ApiResponse.success(res, result, 'Holiday deleted');
});

module.exports = {
  // Announcements
  listAnnouncements, getAllAnnouncements, getAnnouncementById,
  createAnnouncement, updateAnnouncement, deleteAnnouncement,
  // Ticker
  listTicker, getAllTicker, getTickerById,
  createTicker, updateTicker, deleteTicker,
  // Circulars
  listCirculars, getAllCirculars, getCircularById,
  createCircular, updateCircular, deleteCircular,
  // Holidays
  listHolidays, getAllHolidays, getHolidayById,
  createHoliday, updateHoliday, deleteHoliday,
};

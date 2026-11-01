/**
 * alumniContent.controller.js — Alumni Content controller
 *
 * Handles:
 *   - Alumni Stories
 *   - Alumni Events
 */
const SqlService = require('../services/sql.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { TABLES, PAGINATION } = require('../utils/constants');

const storyService = new SqlService(TABLES.STUDENT_ACHIEVEMENTS);
const alumniEventService = new SqlService(TABLES.UPCOMING_EVENTS);

// ============================================
// ALUMNI STORIES
// ============================================

/** GET /api/alumni-content/stories — Public */
const listStories = asyncHandler(async (req, res) => {
  const items = await storyService.list({
    orderBy: 'createdAt',
    order: 'desc',
    maxResults: 20,
    filters: [
      { field: 'category', operator: '==', value: 'alumni-story' },
      { field: 'isActive', operator: '==', value: true },
    ],
  });
  ApiResponse.success(res, items, 'Alumni stories fetched');
});

/** GET /api/alumni-content/stories/all — Admin */
const getAllStories = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await storyService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'createdAt',
    order: 'desc',
    filters: [{ field: 'category', operator: '==', value: 'alumni-story' }],
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All alumni stories fetched');
});

const getStoryById = asyncHandler(async (req, res) => {
  const item = await storyService.getById(req.params.id);
  ApiResponse.success(res, item, 'Alumni story retrieved');
});

const createStory = asyncHandler(async (req, res) => {
  const { title, content, author, batch, isPublished, isActive } = req.body;
  const item = await storyService.create({
    category: 'alumni-story',
    title,
    description: content || '',
    studentName: author || '',
    classGrade: batch || '',
    isActive: isActive !== undefined ? isActive : (isPublished !== undefined ? isPublished : true),
  });
  ApiResponse.created(res, item, 'Alumni story created');
});

const updateStory = asyncHandler(async (req, res) => {
  const { title, content, author, batch, isPublished, isActive } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.description = content;
  if (author !== undefined) updateData.studentName = author;
  if (batch !== undefined) updateData.classGrade = batch;
  if (isActive !== undefined || isPublished !== undefined) {
    updateData.isActive = isActive !== undefined ? isActive : isPublished;
  }

  const updated = await storyService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Alumni story updated');
});

const deleteStory = asyncHandler(async (req, res) => {
  const result = await storyService.delete(req.params.id);
  ApiResponse.success(res, result, 'Alumni story deleted');
});

// ============================================
// ALUMNI EVENTS
// ============================================

const listAlumniEvents = asyncHandler(async (req, res) => {
  const items = await alumniEventService.list({
    orderBy: 'eventDate',
    order: 'asc',
    maxResults: 20,
    filters: [
      { field: 'isActive', operator: '==', value: true },
      { field: 'type', operator: '==', value: 'alumni' },
    ],
  });
  ApiResponse.success(res, items, 'Alumni events fetched');
});

const getAllAlumniEvents = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await alumniEventService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'eventDate',
    order: 'desc',
    filters: [{ field: 'type', operator: '==', value: 'alumni' }],
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All alumni events fetched');
});

const getAlumniEventById = asyncHandler(async (req, res) => {
  const item = await alumniEventService.getById(req.params.id);
  // Validate this record is actually an alumni event
  if (item.type && item.type !== 'alumni') {
    const { NotFoundError } = require('../utils/ApiError');
    throw new NotFoundError('Alumni event');
  }
  ApiResponse.success(res, item, 'Alumni event retrieved');
});

const createAlumniEvent = asyncHandler(async (req, res) => {
  const { title, description, date, venue, isPublished, isActive } = req.body;
  const item = await alumniEventService.create({
    title,
    description: description || '',
    eventDate: date,
    venue: venue || '',
    type: 'alumni',    // tag so it doesn't mix with school events
    isActive: isActive !== undefined ? isActive : (isPublished !== undefined ? isPublished : true),
  });
  ApiResponse.created(res, item, 'Alumni event created');
});

const updateAlumniEvent = asyncHandler(async (req, res) => {
  const { title, description, date, venue, isPublished, isActive } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (date !== undefined) updateData.eventDate = date;
  if (venue !== undefined) updateData.venue = venue;
  if (isActive !== undefined || isPublished !== undefined) {
    updateData.isActive = isActive !== undefined ? isActive : isPublished;
  }

  const updated = await alumniEventService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Alumni event updated');
});

const deleteAlumniEvent = asyncHandler(async (req, res) => {
  const result = await alumniEventService.delete(req.params.id);
  ApiResponse.success(res, result, 'Alumni event deleted');
});

module.exports = {
  listStories, getAllStories, getStoryById,
  createStory, updateStory, deleteStory,
  listAlumniEvents, getAllAlumniEvents, getAlumniEventById,
  createAlumniEvent, updateAlumniEvent, deleteAlumniEvent,
};

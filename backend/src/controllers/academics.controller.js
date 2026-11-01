/**
 * academics.controller.js — Academics controller
 *
 * Handles four sections:
 *   1. Academic Programs (Pre-Primary, Primary, Secondary) — with photo upload
 *   2. Academic Calendar — class-wise events with dates
 *   3. Syllabus & Course Outline — file upload per class
 *   4. Exam Schedules — typed exams with date & file upload
 */
const SqlService = require('../services/sql.service');
const StorageService = require('../services/storage.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { TABLES, PAGINATION } = require('../utils/constants');
const { NotFoundError } = require('../utils/ApiError');

const academicsService = new SqlService(TABLES.ACADEMICS);

// ============================================
// ACADEMIC PROGRAMS (Pre-Primary, Primary, Secondary)
// ============================================

/** GET /api/academics/programs — Public: Active programs */
const listPrograms = asyncHandler(async (req, res) => {
  const items = await academicsService.list({
    orderBy: 'createdAt',
    order: 'asc',
    maxResults: 10,
    filters: [
      { field: 'type', operator: '==', value: 'program' },
      { field: 'isActive', operator: '==', value: true },
    ],
  });
  ApiResponse.success(res, items, 'Academic programs fetched');
});

/** GET /api/academics/programs/all — Admin: All programs */
const getAllPrograms = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await academicsService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'createdAt',
    order: 'asc',
    filters: [{ field: 'type', operator: '==', value: 'program' }],
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All programs fetched');
});

const getProgramById = asyncHandler(async (req, res) => {
  const item = await academicsService.getById(req.params.id);
  if (item.type !== 'program') throw new NotFoundError('Academic program');
  ApiResponse.success(res, item, 'Program retrieved');
});

/** POST /api/academics/programs — Admin: Create program with optional photo */
const createProgram = asyncHandler(async (req, res) => {
  const { title, description, sectionKey, highlights, timings, ageCriteria, isActive } = req.body;

  let imageUrl = '';
  let cloudinaryPublicId = '';
  if (req.file) {
    const fileData = await StorageService.uploadFile(req.file, 'academics');
    imageUrl = fileData.url;
    cloudinaryPublicId = fileData.publicId;
  }

  const item = await academicsService.create({
    type: 'program',
    title,
    content: description || '',
    sectionKey: sectionKey || '',
    highlights: highlights || '',
    timings: timings || '',
    ageCriteria: ageCriteria || '',
    imageUrl,
    cloudinaryPublicId,
    isActive: isActive !== undefined ? isActive : true,
  });
  ApiResponse.created(res, item, 'Academic program created');
});

/** PUT /api/academics/programs/:id — Admin: Update program */
const updateProgram = asyncHandler(async (req, res) => {
  const { title, description, sectionKey, highlights, timings, ageCriteria, isActive } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.content = description;
  if (sectionKey !== undefined) updateData.sectionKey = sectionKey;
  if (highlights !== undefined) updateData.highlights = highlights;
  if (timings !== undefined) updateData.timings = timings;
  if (ageCriteria !== undefined) updateData.ageCriteria = ageCriteria;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (req.file) {
    const existing = await academicsService.getById(req.params.id);
    if (existing && existing.cloudinaryPublicId) {
      await StorageService.deleteFile(existing.cloudinaryPublicId);
    }
    const fileData = await StorageService.uploadFile(req.file, 'academics');
    updateData.imageUrl = fileData.url;
    updateData.cloudinaryPublicId = fileData.publicId;
  }

  const updated = await academicsService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Academic program updated');
});

const deleteProgram = asyncHandler(async (req, res) => {
  const existing = await academicsService.getById(req.params.id);
  if (existing && existing.cloudinaryPublicId) {
    await StorageService.deleteFile(existing.cloudinaryPublicId);
  }
  const result = await academicsService.delete(req.params.id);
  ApiResponse.success(res, result, 'Academic program deleted');
});

// ============================================
// ACADEMIC CALENDAR
// ============================================

/** GET /api/academics/calendar — Public: Active calendar events */
const listCalendar = asyncHandler(async (req, res) => {
  const { classGrade } = req.query;
  const filters = [
    { field: 'type', operator: '==', value: 'calendar' },
    { field: 'isActive', operator: '==', value: true },
  ];
  if (classGrade && classGrade !== 'all') {
    filters.push({ field: 'classGrade', operator: '==', value: classGrade });
  }

  const items = await academicsService.list({
    orderBy: 'eventDate',
    order: 'asc',
    maxResults: 50,
    filters,
  });
  ApiResponse.success(res, items, 'Academic calendar fetched');
});

/** GET /api/academics/calendar/all — Admin: All calendar events */
const getAllCalendar = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await academicsService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'createdAt',
    order: 'desc',
    filters: [{ field: 'type', operator: '==', value: 'calendar' }],
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All calendar events fetched');
});

const getCalendarById = asyncHandler(async (req, res) => {
  const item = await academicsService.getById(req.params.id);
  if (item.type !== 'calendar') throw new NotFoundError('Calendar event');
  ApiResponse.success(res, item, 'Calendar event retrieved');
});

const createCalendar = asyncHandler(async (req, res) => {
  const { title, description, eventDate, classGrade, isActive } = req.body;
  const item = await academicsService.create({
    type: 'calendar',
    title,
    content: description || '',
    eventDate: eventDate || '',
    classGrade: classGrade || 'all',
    isActive: isActive !== undefined ? isActive : true,
  });
  ApiResponse.created(res, item, 'Calendar event created');
});

const updateCalendar = asyncHandler(async (req, res) => {
  const { title, description, eventDate, classGrade, isActive } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.content = description;
  if (eventDate !== undefined) updateData.eventDate = eventDate;
  if (classGrade !== undefined) updateData.classGrade = classGrade;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updated = await academicsService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Calendar event updated');
});

const deleteCalendar = asyncHandler(async (req, res) => {
  const result = await academicsService.delete(req.params.id);
  ApiResponse.success(res, result, 'Calendar event deleted');
});

// ============================================
// SYLLABUS & COURSE OUTLINE
// ============================================

/** GET /api/academics/syllabus — Public: Active syllabus items */
const listSyllabus = asyncHandler(async (req, res) => {
  const { classGrade } = req.query;
  const filters = [
    { field: 'type', operator: '==', value: 'syllabus' },
    { field: 'isActive', operator: '==', value: true },
  ];
  if (classGrade && classGrade !== 'all') {
    filters.push({ field: 'classGrade', operator: '==', value: classGrade });
  }

  const items = await academicsService.list({
    orderBy: 'classGrade',
    order: 'asc',
    maxResults: 50,
    filters,
  });
  ApiResponse.success(res, items, 'Syllabus items fetched');
});

/** GET /api/academics/syllabus/all — Admin: All syllabus items */
const getAllSyllabus = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await academicsService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'classGrade',
    order: 'asc',
    filters: [{ field: 'type', operator: '==', value: 'syllabus' }],
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All syllabus fetched');
});

const getSyllabusById = asyncHandler(async (req, res) => {
  const item = await academicsService.getById(req.params.id);
  if (item.type !== 'syllabus') throw new NotFoundError('Syllabus item');
  ApiResponse.success(res, item, 'Syllabus item retrieved');
});

/** POST /api/academics/syllabus — Admin: Create syllabus with file upload */
const createSyllabus = asyncHandler(async (req, res) => {
  const { title, description, classGrade, isActive } = req.body;

  let fileUrl = '';
  let cloudinaryPublicId = '';
  if (req.file) {
    const fileData = await StorageService.uploadFile(req.file, 'syllabus');
    fileUrl = fileData.url;
    cloudinaryPublicId = fileData.publicId;
  }

  const item = await academicsService.create({
    type: 'syllabus',
    title,
    content: description || '',
    classGrade: classGrade || '',
    fileUrl,
    cloudinaryPublicId,
    isActive: isActive !== undefined ? isActive : true,
  });
  ApiResponse.created(res, item, 'Syllabus item created');
});

const updateSyllabus = asyncHandler(async (req, res) => {
  const { title, description, classGrade, isActive } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.content = description;
  if (classGrade !== undefined) updateData.classGrade = classGrade;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (req.file) {
    const existing = await academicsService.getById(req.params.id);
    if (existing && existing.cloudinaryPublicId) {
      await StorageService.deleteFile(existing.cloudinaryPublicId);
    }
    const fileData = await StorageService.uploadFile(req.file, 'syllabus');
    updateData.fileUrl = fileData.url;
    updateData.cloudinaryPublicId = fileData.publicId;
  }

  const updated = await academicsService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Syllabus item updated');
});

const deleteSyllabus = asyncHandler(async (req, res) => {
  const existing = await academicsService.getById(req.params.id);
  if (existing && existing.cloudinaryPublicId) {
    await StorageService.deleteFile(existing.cloudinaryPublicId);
  }
  const result = await academicsService.delete(req.params.id);
  ApiResponse.success(res, result, 'Syllabus item deleted');
});

// ============================================
// EXAM SCHEDULES
// ============================================

/** GET /api/academics/exams — Public: Active exam schedules */
const listExams = asyncHandler(async (req, res) => {
  const { examType } = req.query;
  const filters = [
    { field: 'type', operator: '==', value: 'exams' },
    { field: 'isActive', operator: '==', value: true },
  ];
  if (examType) {
    filters.push({ field: 'examType', operator: '==', value: examType });
  }

  const items = await academicsService.list({
    orderBy: 'eventDate',
    order: 'asc',
    maxResults: 30,
    filters,
  });
  ApiResponse.success(res, items, 'Exam schedules fetched');
});

/** GET /api/academics/exams/all — Admin: All exam schedules */
const getAllExams = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await academicsService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'createdAt',
    order: 'desc',
    filters: [{ field: 'type', operator: '==', value: 'exams' }],
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All exam schedules fetched');
});

const getExamById = asyncHandler(async (req, res) => {
  const item = await academicsService.getById(req.params.id);
  if (item.type !== 'exams') throw new NotFoundError('Exam schedule');
  ApiResponse.success(res, item, 'Exam schedule retrieved');
});

/** POST /api/academics/exams — Admin: Create exam with optional file */
const createExam = asyncHandler(async (req, res) => {
  const { title, description, examType, eventDate, classGrade, isActive } = req.body;

  let fileUrl = '';
  let cloudinaryPublicId = '';
  if (req.file) {
    const fileData = await StorageService.uploadFile(req.file, 'exams');
    fileUrl = fileData.url;
    cloudinaryPublicId = fileData.publicId;
  }

  const item = await academicsService.create({
    type: 'exams',
    title,
    content: description || '',
    examType: examType || 'unit-test',
    eventDate: eventDate || '',
    classGrade: classGrade || 'all',
    fileUrl,
    cloudinaryPublicId,
    isActive: isActive !== undefined ? isActive : true,
  });
  ApiResponse.created(res, item, 'Exam schedule created');
});

const updateExam = asyncHandler(async (req, res) => {
  const { title, description, examType, eventDate, classGrade, isActive } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.content = description;
  if (examType !== undefined) updateData.examType = examType;
  if (eventDate !== undefined) updateData.eventDate = eventDate;
  if (classGrade !== undefined) updateData.classGrade = classGrade;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (req.file) {
    const existing = await academicsService.getById(req.params.id);
    if (existing && existing.cloudinaryPublicId) {
      await StorageService.deleteFile(existing.cloudinaryPublicId);
    }
    const fileData = await StorageService.uploadFile(req.file, 'exams');
    updateData.fileUrl = fileData.url;
    updateData.cloudinaryPublicId = fileData.publicId;
  }

  const updated = await academicsService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Exam schedule updated');
});

const deleteExam = asyncHandler(async (req, res) => {
  const existing = await academicsService.getById(req.params.id);
  if (existing && existing.cloudinaryPublicId) {
    await StorageService.deleteFile(existing.cloudinaryPublicId);
  }
  const result = await academicsService.delete(req.params.id);
  ApiResponse.success(res, result, 'Exam schedule deleted');
});

// Backward compatibility — Curriculum aliases
const listCurriculum = listSyllabus;
const getAllCurriculum = getAllSyllabus;
const getCurriculumById = getSyllabusById;
const createCurriculum = createSyllabus;
const updateCurriculum = updateSyllabus;
const deleteCurriculum = deleteSyllabus;

module.exports = {
  listPrograms, getAllPrograms, getProgramById,
  createProgram, updateProgram, deleteProgram,
  listCalendar, getAllCalendar, getCalendarById,
  createCalendar, updateCalendar, deleteCalendar,
  listSyllabus, getAllSyllabus, getSyllabusById,
  createSyllabus, updateSyllabus, deleteSyllabus,
  listExams, getAllExams, getExamById,
  createExam, updateExam, deleteExam,
  listCurriculum, getAllCurriculum, getCurriculumById,
  createCurriculum, updateCurriculum, deleteCurriculum,
};

/**
 * achievements.controller.js — Student Achievements & Awards controller
 *
 * Handles:
 *   - Student Achievements (with student photo upload via StorageService)
 *   - Awards & Recognitions
 */
const SqlService = require('../services/sql.service');
const StorageService = require('../services/storage.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { TABLES, PAGINATION } = require('../utils/constants');

const achievementService = new SqlService(TABLES.STUDENT_ACHIEVEMENTS);
const awardService = new SqlService(TABLES.AWARDS);

function formatAchievement(item) {
  if (!item) return item;
  return {
    ...item,
    date: item.achievementDate || item.date || '',
    class: item.classGrade || item.class || '',
    classGrade: item.classGrade || item.class || '',
  };
}

// ============================================
// STUDENT ACHIEVEMENTS
// ============================================

/** GET /api/achievements — Public: List active achievements */
const listAchievements = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filters = [{ field: 'isActive', operator: '==', value: true }];
  if (category && category !== 'all') {
    filters.push({ field: 'category', operator: '==', value: category });
  }

  const items = await achievementService.list({
    orderBy: 'createdAt',
    order: 'desc',
    maxResults: 50,
    filters,
  });
  ApiResponse.success(res, items.map(formatAchievement), 'Student achievements fetched');
});

/** GET /api/achievements/all — Admin: All achievements (paginated) */
const getAllAchievements = asyncHandler(async (req, res) => {
  const { page, limit, category } = req.query;
  const filters = [];
  if (category && category !== 'all') {
    filters.push({ field: 'category', operator: '==', value: category });
  }

  const result = await achievementService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'createdAt',
    order: 'desc',
    filters,
  });
  ApiResponse.paginated(res, result.data.map(formatAchievement), result.pagination, 'All achievements fetched');
});

/** GET /api/achievements/:id — Admin: Single achievement */
const getAchievementById = asyncHandler(async (req, res) => {
  const item = await achievementService.getById(req.params.id);
  ApiResponse.success(res, formatAchievement(item), 'Achievement retrieved');
});

/** POST /api/achievements — Admin: Create achievement with optional photo */
const createAchievement = asyncHandler(async (req, res) => {
  const { title, description, studentName, class: className, classGrade, date, category, isActive } = req.body;

  let imageUrl = '';
  let cloudinaryPublicId = '';
  if (req.file) {
    const fileData = await StorageService.uploadFile(req.file, 'achievements');
    imageUrl = fileData.url;
    cloudinaryPublicId = fileData.publicId;
  }

  const item = await achievementService.create({
    title,
    description,
    studentName: studentName || '',
    classGrade: classGrade || className || '',
    achievementDate: date || new Date().toISOString().split('T')[0],
    category: category || 'academic',
    imageUrl,
    cloudinaryPublicId,
    isActive: isActive !== undefined ? isActive : true,
  });
  ApiResponse.created(res, formatAchievement(item), 'Achievement created successfully');
});

/** PUT /api/achievements/:id — Admin: Update achievement with optional photo */
const updateAchievement = asyncHandler(async (req, res) => {
  const { title, description, studentName, class: className, classGrade, date, category, isActive } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (studentName !== undefined) updateData.studentName = studentName;
  if (className !== undefined || classGrade !== undefined) updateData.classGrade = classGrade || className;
  if (date !== undefined) updateData.achievementDate = date;
  if (category !== undefined) updateData.category = category;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (req.file) {
    const existing = await achievementService.getById(req.params.id);
    if (existing && existing.cloudinaryPublicId) {
      await StorageService.deleteFile(existing.cloudinaryPublicId);
    }
    const fileData = await StorageService.uploadFile(req.file, 'achievements');
    updateData.imageUrl = fileData.url;
    updateData.cloudinaryPublicId = fileData.publicId;
  }

  const updated = await achievementService.update(req.params.id, updateData);
  ApiResponse.success(res, formatAchievement(updated), 'Achievement updated successfully');
});

/** DELETE /api/achievements/:id — Admin: Delete achievement */
const deleteAchievement = asyncHandler(async (req, res) => {
  const existing = await achievementService.getById(req.params.id);
  if (existing && existing.cloudinaryPublicId) {
    await StorageService.deleteFile(existing.cloudinaryPublicId);
  }
  const result = await achievementService.delete(req.params.id);
  ApiResponse.success(res, result, 'Achievement deleted successfully');
});

// ============================================
// AWARDS
// ============================================

const listAwards = asyncHandler(async (req, res) => {
  const items = await awardService.list({
    orderBy: 'createdAt',
    order: 'desc',
    maxResults: 30,
    filters: [{ field: 'isActive', operator: '==', value: true }],
  });
  ApiResponse.success(res, items, 'Awards fetched');
});

const getAllAwards = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await awardService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'createdAt',
    order: 'desc',
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All awards fetched');
});

const getAwardById = asyncHandler(async (req, res) => {
  const item = await awardService.getById(req.params.id);
  ApiResponse.success(res, item, 'Award retrieved');
});

const createAward = asyncHandler(async (req, res) => {
  const { title, description, category, year, recipient, isActive } = req.body;
  const item = await awardService.create({
    title,
    description,
    category: category || 'school',
    year: year || new Date().getFullYear().toString(),
    recipient: recipient || '',
    isActive: isActive !== undefined ? isActive : true,
  });
  ApiResponse.created(res, item, 'Award created');
});

const updateAward = asyncHandler(async (req, res) => {
  const { title, description, category, year, recipient, isActive } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (year !== undefined) updateData.year = year;
  if (recipient !== undefined) updateData.recipient = recipient;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updated = await awardService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Award updated');
});

const deleteAward = asyncHandler(async (req, res) => {
  const result = await awardService.delete(req.params.id);
  ApiResponse.success(res, result, 'Award deleted');
});

module.exports = {
  listAchievements, getAllAchievements, getAchievementById,
  createAchievement, updateAchievement, deleteAchievement,
  listAwards, getAllAwards, getAwardById,
  createAward, updateAward, deleteAward,
};

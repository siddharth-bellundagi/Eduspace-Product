/**
 * parents.controller.js — Parents Section controller
 *
 * Handles:
 *   - Parent Downloads (with PDF/file upload to Cloudinary/disk)
 *   - Parent Circulars
 *   - PTA info
 */
const SqlService = require('../services/sql.service');
const StorageService = require('../services/storage.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { TABLES, PAGINATION } = require('../utils/constants');

const downloadService = new SqlService(TABLES.PARENT_DOWNLOADS);
const circularService = new SqlService(TABLES.CIRCULARS_HOLIDAYS);
const ptaService = new SqlService(TABLES.ACADEMICS);

// ============================================
// PARENT DOWNLOADS
// ============================================

/** GET /api/parents/downloads — Public: Active downloads */
const listDownloads = asyncHandler(async (req, res) => {
  const { category, classGrade } = req.query;
  const filters = [{ field: 'isActive', operator: '==', value: true }];
  if (category) {
    filters.push({ field: 'category', operator: '==', value: category });
  }
  if (classGrade && classGrade !== 'all') {
    filters.push({ field: 'classGrade', operator: '==', value: classGrade });
  }

  const items = await downloadService.list({
    orderBy: 'createdAt',
    order: 'desc',
    maxResults: 100,
    filters,
  });
  ApiResponse.success(res, items, 'Parent downloads fetched');
});

/** GET /api/parents/downloads/all — Admin: All downloads (paginated) */
const getAllDownloads = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await downloadService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'createdAt',
    order: 'desc',
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All downloads fetched');
});

/** GET /api/parents/downloads/:id — Admin: Single download */
const getDownloadById = asyncHandler(async (req, res) => {
  const item = await downloadService.getById(req.params.id);
  ApiResponse.success(res, item, 'Download retrieved');
});

/** POST /api/parents/downloads — Admin: Create download with file upload */
const createDownload = asyncHandler(async (req, res) => {
  const { title, description, category, classGrade, isActive } = req.body;

  let fileUrl = '';
  let cloudinaryPublicId = '';
  let fileSize = 0;

  if (req.file) {
    const fileData = await StorageService.uploadFile(req.file, 'downloads');
    fileUrl = fileData.url;
    cloudinaryPublicId = fileData.publicId;
    fileSize = fileData.size;
  }

  const item = await downloadService.create({
    title,
    description: description || '',
    category: category || 'circular',
    classGrade: classGrade || 'all',
    isActive: isActive !== undefined ? isActive : true,
    fileUrl,
    cloudinaryPublicId,
    fileSize,
  });

  ApiResponse.created(res, item, 'Download created');
});

/** PUT /api/parents/downloads/:id — Admin: Update download */
const updateDownload = asyncHandler(async (req, res) => {
  const { title, description, category, classGrade, isActive } = req.body;
  const updateData = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (classGrade !== undefined) updateData.classGrade = classGrade;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (req.file) {
    const existing = await downloadService.getById(req.params.id);
    if (existing.cloudinaryPublicId) {
      await StorageService.deleteFile(existing.cloudinaryPublicId);
    }
    const fileData = await StorageService.uploadFile(req.file, 'downloads');
    updateData.fileUrl = fileData.url;
    updateData.cloudinaryPublicId = fileData.publicId;
    updateData.fileSize = fileData.size;
  }

  const updated = await downloadService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Download updated');
});

/** DELETE /api/parents/downloads/:id — Admin: Delete download and file */
const deleteDownload = asyncHandler(async (req, res) => {
  const item = await downloadService.getById(req.params.id);
  if (item.cloudinaryPublicId) {
    await StorageService.deleteFile(item.cloudinaryPublicId);
  }
  const result = await downloadService.delete(req.params.id);
  ApiResponse.success(res, result, 'Download deleted');
});

// ============================================
// PARENT CIRCULARS
// ============================================

/** GET /api/parents/circulars — Public: Active circulars */
const listParentCirculars = asyncHandler(async (req, res) => {
  const items = await circularService.list({
    orderBy: 'createdAt',
    order: 'desc',
    maxResults: 30,
    filters: [
      { field: 'type', operator: '==', value: 'circular' },
      { field: 'isActive', operator: '==', value: true },
    ],
  });
  ApiResponse.success(res, items, 'Parent circulars fetched');
});

/** GET /api/parents/circulars/all — Admin: All circulars */
const getAllParentCirculars = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await circularService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'createdAt',
    order: 'desc',
    filters: [{ field: 'type', operator: '==', value: 'circular' }],
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All parent circulars fetched');
});

/** GET /api/parents/circulars/:id — Single circular */
const getParentCircularById = asyncHandler(async (req, res) => {
  const item = await circularService.getById(req.params.id);
  ApiResponse.success(res, item, 'Parent circular retrieved');
});

/** POST /api/parents/circulars — Create circular */
const createParentCircular = asyncHandler(async (req, res) => {
  const { title, description, date, isActive } = req.body;
  let fileUrl = '';
  let cloudinaryPublicId = '';

  if (req.file) {
    const fileData = await StorageService.uploadFile(req.file, 'circulars');
    fileUrl = fileData.url;
    cloudinaryPublicId = fileData.publicId;
  }

  const item = await circularService.create({
    type: 'circular',
    title,
    description: description || '',
    eventDate: date || new Date().toISOString(),
    isActive: isActive !== undefined ? isActive : true,
    fileUrl,
    cloudinaryPublicId,
  });

  ApiResponse.created(res, item, 'Parent circular created');
});

/** PUT /api/parents/circulars/:id — Update circular */
const updateParentCircular = asyncHandler(async (req, res) => {
  const { title, description, date, isActive } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (date !== undefined) updateData.eventDate = date;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (req.file) {
    const existing = await circularService.getById(req.params.id);
    if (existing.cloudinaryPublicId) {
      await StorageService.deleteFile(existing.cloudinaryPublicId);
    }
    const fileData = await StorageService.uploadFile(req.file, 'circulars');
    updateData.fileUrl = fileData.url;
    updateData.cloudinaryPublicId = fileData.publicId;
  }

  const updated = await circularService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Parent circular updated');
});

/** DELETE /api/parents/circulars/:id — Delete circular */
const deleteParentCircular = asyncHandler(async (req, res) => {
  const item = await circularService.getById(req.params.id);
  if (item.cloudinaryPublicId) {
    await StorageService.deleteFile(item.cloudinaryPublicId);
  }
  const result = await circularService.delete(req.params.id);
  ApiResponse.success(res, result, 'Parent circular deleted');
});

// ============================================
// PTA
// ============================================

/** GET /api/parents/pta — Public: Active PTA content */
const listPta = asyncHandler(async (req, res) => {
  const items = await ptaService.list({
    orderBy: 'createdAt',
    order: 'desc',
    maxResults: 20,
    filters: [
      { field: 'type', operator: '==', value: 'pta' },
      { field: 'isActive', operator: '==', value: true },
    ],
  });
  ApiResponse.success(res, items, 'PTA content fetched');
});

/** GET /api/parents/pta/all — Admin: All PTA items */
const getAllPta = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await ptaService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'createdAt',
    order: 'desc',
    filters: [{ field: 'type', operator: '==', value: 'pta' }],
  });
  ApiResponse.paginated(res, result.data, result.pagination, 'All PTA content fetched');
});

/** GET /api/parents/pta/:id — Single PTA item */
const getPtaById = asyncHandler(async (req, res) => {
  const item = await ptaService.getById(req.params.id);
  ApiResponse.success(res, item, 'PTA item retrieved');
});

/** POST /api/parents/pta — Create PTA */
const createPta = asyncHandler(async (req, res) => {
  const { title, content, isActive } = req.body;
  const item = await ptaService.create({
    type: 'pta',
    title,
    content: content || '',
    isActive: isActive !== undefined ? isActive : true,
  });
  ApiResponse.created(res, item, 'PTA item created');
});

/** PUT /api/parents/pta/:id — Update PTA */
const updatePta = asyncHandler(async (req, res) => {
  const { title, content, isActive } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updated = await ptaService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'PTA item updated');
});

/** DELETE /api/parents/pta/:id — Delete PTA */
const deletePta = asyncHandler(async (req, res) => {
  const result = await ptaService.delete(req.params.id);
  ApiResponse.success(res, result, 'PTA item deleted');
});

module.exports = {
  // Downloads
  listDownloads, getAllDownloads, getDownloadById,
  createDownload, updateDownload, deleteDownload,
  // Circulars
  listParentCirculars, getAllParentCirculars, getParentCircularById,
  createParentCircular, updateParentCircular, deleteParentCircular,
  // PTA
  listPta, getAllPta, getPtaById,
  createPta, updatePta, deletePta,
};

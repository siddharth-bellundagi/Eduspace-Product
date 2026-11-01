/**
 * studentLife.controller.js — Student Life & Activities Controller
 *
 * Handles:
 *   - Sports, Cultural, Competitions, Trips, Pre-primary
 *   - Multi-photo upload support & Cloudinary storage
 */
const SqlService = require('../services/sql.service');
const StorageService = require('../services/storage.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { TABLES, PAGINATION } = require('../utils/constants');

const studentLifeService = new SqlService(TABLES.STUDENT_LIFE);

/** GET /api/student-life — Public: Active items (filterable by category) */
const list = asyncHandler(async (req, res) => {
  const { category, classGrade } = req.query;
  const filters = [{ field: 'isActive', operator: '==', value: true }];
  if (category) {
    filters.push({ field: 'category', operator: '==', value: category });
  }
  if (classGrade) {
    filters.push({ field: 'classGrade', operator: '==', value: classGrade });
  }

  const items = await studentLifeService.list({
    orderBy: 'createdAt',
    order: 'desc',
    maxResults: 50,
    filters,
  });

  const enriched = items.map((item) => {
    let images = [];
    if (item.imagesJson) {
      try {
        images = JSON.parse(item.imagesJson);
      } catch (e) {
        images = [];
      }
    }
    return { ...item, images };
  });

  ApiResponse.success(res, enriched, 'Student life items fetched');
});

/** GET /api/student-life/all — Admin: All items (paginated) */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit, category, classGrade } = req.query;
  const filters = [];
  if (category) {
    filters.push({ field: 'category', operator: '==', value: category });
  }
  if (classGrade) {
    filters.push({ field: 'classGrade', operator: '==', value: classGrade });
  }

  const result = await studentLifeService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'createdAt',
    order: 'desc',
    filters,
  });

  const enriched = result.data.map((item) => {
    let images = [];
    if (item.imagesJson) {
      try {
        images = JSON.parse(item.imagesJson);
      } catch (e) {
        images = [];
      }
    }
    return { ...item, images };
  });

  ApiResponse.paginated(res, enriched, result.pagination, 'All student life items fetched');
});

/** GET /api/student-life/:id — Admin: Single item */
const getById = asyncHandler(async (req, res) => {
  const item = await studentLifeService.getById(req.params.id);
  let images = [];
  if (item.imagesJson) {
    try {
      images = JSON.parse(item.imagesJson);
    } catch (e) {
      images = [];
    }
  }
  ApiResponse.success(res, { ...item, images }, 'Student life item retrieved');
});

/** POST /api/student-life — Admin: Create item with optional photos */
const create = asyncHandler(async (req, res) => {
  const { title, description, category, classGrade, isActive } = req.body;

  let primaryUrl = '';
  const uploadedImages = [];

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const uploaded = await StorageService.uploadMultiple(req.files, 'student-life');
    uploaded.forEach((u, idx) => {
      uploadedImages.push({ url: u.url, publicId: u.publicId });
      if (idx === 0) primaryUrl = u.url;
    });
  } else if (req.file) {
    const u = await StorageService.uploadFile(req.file, 'student-life');
    primaryUrl = u.url;
    uploadedImages.push({ url: u.url, publicId: u.publicId });
  }

  const item = await studentLifeService.create({
    title,
    description: description || '',
    category: category || 'sports',
    classGrade: classGrade || '',
    isActive: isActive !== undefined ? isActive : true,
    imageUrl: primaryUrl,
    imagesJson: JSON.stringify(uploadedImages),
  });

  ApiResponse.created(res, { ...item, images: uploadedImages }, 'Student life item created');
});

/** PUT /api/student-life/:id — Admin: Update item */
const update = asyncHandler(async (req, res) => {
  const { title, description, category, classGrade, isActive } = req.body;
  const updateData = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (classGrade !== undefined) updateData.classGrade = classGrade;
  if (isActive !== undefined) updateData.isActive = isActive;

  // New file(s) uploaded — delete old assets first to prevent Cloudinary orphans
  if ((req.files && Array.isArray(req.files) && req.files.length > 0) || req.file) {
    const existing = await studentLifeService.getById(req.params.id);
    if (existing.imagesJson) {
      try {
        const oldPhotos = JSON.parse(existing.imagesJson);
        if (Array.isArray(oldPhotos)) {
          await Promise.all(
            oldPhotos
              .filter((p) => p.publicId)
              .map((p) => StorageService.deleteFile(p.publicId))
          );
        }
      } catch (e) {
        // Ignore cleanup errors — proceed with upload
      }
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploaded = await StorageService.uploadMultiple(req.files, 'student-life');
      updateData.imageUrl = uploaded[0].url;
      updateData.imagesJson = JSON.stringify(uploaded);
    } else {
      const u = await StorageService.uploadFile(req.file, 'student-life');
      updateData.imageUrl = u.url;
      updateData.imagesJson = JSON.stringify([u]);
    }
  }

  const updated = await studentLifeService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'Student life item updated');
});

/** DELETE /api/student-life/:id — Admin: Delete item and assets */
const remove = asyncHandler(async (req, res) => {
  const item = await studentLifeService.getById(req.params.id);
  if (item.imagesJson) {
    try {
      const photos = JSON.parse(item.imagesJson);
      if (Array.isArray(photos)) {
        await Promise.all(
          photos
            .filter((p) => p.publicId)
            .map((p) => StorageService.deleteFile(p.publicId))
        );
      }
    } catch (e) {
      // Ignore cleanup error
    }
  }
  const result = await studentLifeService.delete(req.params.id);
  ApiResponse.success(res, result, 'Student life item deleted');
});

module.exports = { list, getAll, getById, create, update, remove };

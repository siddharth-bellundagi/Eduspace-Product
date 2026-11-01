/**
 * gallery.controller.js — Photo Gallery & Album Controller
 *
 * Supports:
 *   - Single & batch multi-photo uploads in a single click
 *   - Class-wise photo categorization (e.g. Pre-primary, Class 1-9, Campus, Events)
 *   - SQLite storage + Cloudinary CDN / local fallback
 */
const SqlService = require('../services/sql.service');
const StorageService = require('../services/storage.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { TABLES, PAGINATION } = require('../utils/constants');

const galleryService = new SqlService(TABLES.GALLERY);

/**
 * GET /api/gallery — Public: Active gallery images / albums
 * Supports ?category=... and ?classGrade=...
 */
const list = asyncHandler(async (req, res) => {
  const { category, classGrade } = req.query;
  const filters = [{ field: 'isActive', operator: '==', value: true }];

  if (category) {
    filters.push({ field: 'category', operator: '==', value: category });
  }
  if (classGrade) {
    filters.push({ field: 'classGrade', operator: '==', value: classGrade });
  }

  const items = await galleryService.list({
    orderBy: 'createdAt',
    order: 'desc',
    maxResults: 100,
    filters,
  });

  // Parse imagesJson if present
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

  ApiResponse.success(res, enriched, 'Gallery images fetched');
});

/**
 * GET /api/gallery/all — Admin: All gallery items (paginated)
 */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit, category, classGrade } = req.query;
  const filters = [];

  if (category) {
    filters.push({ field: 'category', operator: '==', value: category });
  }
  if (classGrade) {
    filters.push({ field: 'classGrade', operator: '==', value: classGrade });
  }

  const result = await galleryService.getAll({
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

  ApiResponse.paginated(res, enriched, result.pagination, 'All gallery items fetched');
});

/**
 * GET /api/gallery/:id — Single album/image
 */
const getById = asyncHandler(async (req, res) => {
  const item = await galleryService.getById(req.params.id);
  let images = [];
  if (item.imagesJson) {
    try {
      images = JSON.parse(item.imagesJson);
    } catch (e) {
      images = [];
    }
  }
  ApiResponse.success(res, { ...item, images }, 'Gallery item retrieved');
});

/**
 * POST /api/gallery — Admin: Create gallery item
 * Handles both single file (req.file) and multi-file batch (req.files)
 */
const create = asyncHandler(async (req, res) => {
  const { title, category, classGrade, description, isActive } = req.body;

  let primaryUrl = '';
  let primaryPublicId = '';
  const uploadedImages = [];

  // Multi-file upload handling
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const uploaded = await StorageService.uploadMultiple(req.files, 'gallery');
    uploaded.forEach((u, idx) => {
      uploadedImages.push({
        url: u.url,
        publicId: u.publicId,
        fileName: u.fileName,
      });
      if (idx === 0) {
        primaryUrl = u.url;
        primaryPublicId = u.publicId;
      }
    });
  } else if (req.file) {
    // Single file upload
    const u = await StorageService.uploadFile(req.file, 'gallery');
    primaryUrl = u.url;
    primaryPublicId = u.publicId;
    uploadedImages.push({
      url: u.url,
      publicId: u.publicId,
      fileName: u.fileName,
    });
  }

  const item = await galleryService.create({
    title,
    category: category || 'campus',
    classGrade: classGrade || '',
    description: description || '',
    isActive: isActive !== undefined ? isActive : true,
    imageUrl: primaryUrl,
    cloudinaryPublicId: primaryPublicId,
    imagesJson: JSON.stringify(uploadedImages),
  });

  ApiResponse.created(res, { ...item, images: uploadedImages }, 'Gallery item created successfully');
});

/**
 * PUT /api/gallery/:id — Admin: Update gallery item
 */
const update = asyncHandler(async (req, res) => {
  const { title, category, classGrade, description, isActive } = req.body;
  const updateData = {};

  if (title !== undefined) updateData.title = title;
  if (category !== undefined) updateData.category = category;
  if (classGrade !== undefined) updateData.classGrade = classGrade;
  if (description !== undefined) updateData.description = description;
  if (isActive !== undefined) updateData.isActive = isActive;

  // New file(s) uploaded — delete old assets first to prevent Cloudinary orphans
  if ((req.files && Array.isArray(req.files) && req.files.length > 0) || req.file) {
    const existing = await galleryService.getById(req.params.id);
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
      const uploaded = await StorageService.uploadMultiple(req.files, 'gallery');
      updateData.imageUrl = uploaded[0].url;
      updateData.cloudinaryPublicId = uploaded[0].publicId;
      updateData.imagesJson = JSON.stringify(uploaded);
    } else {
      const u = await StorageService.uploadFile(req.file, 'gallery');
      updateData.imageUrl = u.url;
      updateData.cloudinaryPublicId = u.publicId;
      updateData.imagesJson = JSON.stringify([u]);
    }
  }

  const updated = await galleryService.update(req.params.id, updateData);
  let images = [];
  if (updated.imagesJson) {
    try {
      images = JSON.parse(updated.imagesJson);
    } catch (e) {
      images = [];
    }
  }
  ApiResponse.success(res, { ...updated, images }, 'Gallery item updated');
});

/**
 * DELETE /api/gallery/:id — Admin: Delete gallery item and media assets
 */
const remove = asyncHandler(async (req, res) => {
  const item = await galleryService.getById(req.params.id);

  // Delete primary file
  if (item.cloudinaryPublicId) {
    await StorageService.deleteFile(item.cloudinaryPublicId);
  }

  // Delete all photos in album if JSON present
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
      // Ignore JSON parse errors on cleanup
    }
  }

  const result = await galleryService.delete(req.params.id);
  ApiResponse.success(res, result, 'Gallery item deleted');
});

module.exports = { list, getAll, getById, create, update, remove };

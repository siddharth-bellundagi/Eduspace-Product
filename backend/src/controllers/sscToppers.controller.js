/**
 * sscToppers.controller.js — SSC Toppers controller
 *
 * Handles:
 *   - Public listing of toppers by academic year
 *   - Latest year toppers for Homepage highlight
 *   - Available distinct academic years list
 *   - Admin CRUD with student photo upload
 */
const SqlService = require('../services/sql.service');
const StorageService = require('../services/storage.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { TABLES, PAGINATION } = require('../utils/constants');
const { db } = require('../config/database');

const topperService = new SqlService(TABLES.SSC_TOPPERS);

/** GET /api/ssc-toppers — Public: List active toppers (optional ?year=...) */
const listToppers = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const filters = [{ field: 'isActive', operator: '==', value: true }];
  if (year && year !== 'all') {
    filters.push({ field: 'academicYear', operator: '==', value: year });
  }

  const items = await topperService.list({
    orderBy: 'rankNum',
    order: 'asc',
    maxResults: 100,
    filters,
  });

  // Sort primarily by academicYear DESC, then rankNum ASC
  items.sort((a, b) => {
    if (a.academicYear !== b.academicYear) {
      return (b.academicYear || '').localeCompare(a.academicYear || '');
    }
    return (a.rankNum || 1) - (b.rankNum || 1);
  });

  ApiResponse.success(res, items, 'SSC toppers fetched');
});

/** GET /api/ssc-toppers/latest — Public: Latest year top scorers for Homepage */
const getLatestToppers = asyncHandler(async (req, res) => {
  // Find highest academic year with active toppers
  const row = await db.get(
    'SELECT academic_year FROM ssc_toppers WHERE is_active = 1 ORDER BY academic_year DESC LIMIT 1'
  );

  if (!row || !row.academic_year) {
    return ApiResponse.success(res, { year: '', toppers: [] }, 'No toppers found');
  }

  const latestYear = row.academic_year;
  const items = await topperService.list({
    orderBy: 'rankNum',
    order: 'asc',
    maxResults: 10,
    filters: [
      { field: 'isActive', operator: '==', value: true },
      { field: 'academicYear', operator: '==', value: latestYear },
    ],
  });

  ApiResponse.success(res, { year: latestYear, toppers: items }, `Latest toppers for ${latestYear} fetched`);
});

/** GET /api/ssc-toppers/years — Public: Distinct academic years list */
const getYears = asyncHandler(async (req, res) => {
  const rows = await db.all(
    'SELECT DISTINCT academic_year FROM ssc_toppers WHERE is_active = 1 ORDER BY academic_year DESC'
  );
  const years = rows.map(r => r.academic_year);
  ApiResponse.success(res, years, 'Academic years fetched');
});

/** GET /api/ssc-toppers/all — Admin: All toppers paginated */
const getAllToppers = asyncHandler(async (req, res) => {
  const { page, limit, year } = req.query;
  const filters = [];
  if (year && year !== 'all') {
    filters.push({ field: 'academicYear', operator: '==', value: year });
  }

  const result = await topperService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: 'academicYear',
    order: 'desc',
    filters,
  });

  ApiResponse.paginated(res, result.data, result.pagination, 'All SSC toppers fetched');
});

/** GET /api/ssc-toppers/:id — Admin: Single topper */
const getTopperById = asyncHandler(async (req, res) => {
  const item = await topperService.getById(req.params.id);
  ApiResponse.success(res, item, 'Topper retrieved');
});

/** POST /api/ssc-toppers — Admin: Create topper with photo */
const createTopper = asyncHandler(async (req, res) => {
  const { studentName, percentage, totalMarks, rankNum, academicYear, stream, remarks, isActive } = req.body;

  let imageUrl = '';
  let cloudinaryPublicId = '';
  if (req.file) {
    const fileData = await StorageService.uploadFile(req.file, 'toppers');
    imageUrl = fileData.url;
    cloudinaryPublicId = fileData.publicId;
  }

  const item = await topperService.create({
    studentName,
    percentage,
    totalMarks: totalMarks || '',
    rankNum: rankNum !== undefined ? parseInt(rankNum, 10) : 1,
    academicYear: (academicYear || '').trim(),
    stream: stream || 'English Medium',
    remarks: remarks || '',
    imageUrl,
    cloudinaryPublicId,
    isActive: isActive !== undefined ? (isActive === true || isActive === 'true') : true,
  });

  ApiResponse.created(res, item, 'SSC topper created successfully');
});

/** PUT /api/ssc-toppers/:id — Admin: Update topper with photo */
const updateTopper = asyncHandler(async (req, res) => {
  const { studentName, percentage, totalMarks, rankNum, academicYear, stream, remarks, isActive } = req.body;
  const updateData = {};

  if (studentName !== undefined) updateData.studentName = studentName;
  if (percentage !== undefined) updateData.percentage = percentage;
  if (totalMarks !== undefined) updateData.totalMarks = totalMarks;
  if (rankNum !== undefined) updateData.rankNum = parseInt(rankNum, 10);
  if (academicYear !== undefined) updateData.academicYear = (academicYear || '').trim();
  if (stream !== undefined) updateData.stream = stream;
  if (remarks !== undefined) updateData.remarks = remarks;
  if (isActive !== undefined) updateData.isActive = (isActive === true || isActive === 'true');

  if (req.file) {
    const existing = await topperService.getById(req.params.id);
    if (existing && existing.cloudinaryPublicId) {
      await StorageService.deleteFile(existing.cloudinaryPublicId);
    }
    const fileData = await StorageService.uploadFile(req.file, 'toppers');
    updateData.imageUrl = fileData.url;
    updateData.cloudinaryPublicId = fileData.publicId;
  }

  const updated = await topperService.update(req.params.id, updateData);
  ApiResponse.success(res, updated, 'SSC topper updated successfully');
});

/** DELETE /api/ssc-toppers/:id — Admin: Delete topper */
const deleteTopper = asyncHandler(async (req, res) => {
  const existing = await topperService.getById(req.params.id);
  if (existing && existing.cloudinaryPublicId) {
    await StorageService.deleteFile(existing.cloudinaryPublicId);
  }
  const result = await topperService.delete(req.params.id);
  ApiResponse.success(res, result, 'SSC topper deleted successfully');
});

module.exports = {
  listToppers,
  getLatestToppers,
  getYears,
  getAllToppers,
  getTopperById,
  createTopper,
  updateTopper,
  deleteTopper,
};

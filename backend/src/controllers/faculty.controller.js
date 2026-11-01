/**
 * faculty.controller.js — Faculty & Staff controller
 *
 * Handles CRUD for:
 *   - Faculty (teachers / academic faculty)
 *   - Staff (administrative & support staff)
 * Supports:
 *   - Faculty photo upload via Cloudinary or local storage
 *   - Order/sorting for website display
 */
const SqlService = require('../services/sql.service');
const StorageService = require('../services/storage.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { TABLES, PAGINATION } = require('../utils/constants');

const facultyService = new SqlService(TABLES.FACULTY);

/** GET /api/faculty — Public: Active faculty sorted by display order */
const listFaculty = asyncHandler(async (req, res) => {
  const { department } = req.query;
  const filters = [{ field: 'isActive', operator: '==', value: true }];
  if (department) {
    filters.push({ field: 'department', operator: '==', value: department });
  }

  const items = await facultyService.list({
    orderBy: 'orderNum',
    order: 'asc',
    maxResults: 100,
    filters,
  });

  // Provide both imageUrl and photoUrl for compatibility with frontend
  const formatted = items.map((f) => ({
    ...f,
    photoUrl: f.imageUrl || '',
  }));

  ApiResponse.success(res, formatted, 'Faculty list fetched');
});

/** GET /api/faculty/all — Admin: All faculty entries */
const getAllFaculty = asyncHandler(async (req, res) => {
  const { page, limit, orderBy, order } = req.query;
  const result = await facultyService.getAll({
    page: parseInt(page, 10) || 1,
    limit: Math.min(parseInt(limit, 10) || PAGINATION.MAX_LIMIT, PAGINATION.MAX_LIMIT),
    orderBy: orderBy || 'orderNum',
    order: order || 'asc',
  });

  const formatted = result.data.map((f) => ({
    ...f,
    photoUrl: f.imageUrl || '',
  }));

  ApiResponse.paginated(res, formatted, result.pagination, 'All faculty fetched');
});

/** GET /api/faculty/:id — Single member */
const getFacultyById = asyncHandler(async (req, res) => {
  const item = await facultyService.getById(req.params.id);
  ApiResponse.success(res, { ...item, photoUrl: item.imageUrl || '' }, 'Faculty member retrieved');
});

/** POST /api/faculty — Create faculty with optional photo */
const createFaculty = asyncHandler(async (req, res) => {
  const { name, designation, department, qualification, experience, email, phone, order, isActive } = req.body;

  let imageUrl = '';
  let cloudinaryPublicId = '';

  if (req.file) {
    const uploaded = await StorageService.uploadFile(req.file, 'faculty');
    imageUrl = uploaded.url;
    cloudinaryPublicId = uploaded.publicId;
  }

  const item = await facultyService.create({
    name,
    designation,
    department: department || '',
    qualification: qualification || '',
    experience: experience || '',
    email: email || '',
    phone: phone || '',
    imageUrl,
    cloudinaryPublicId,
    orderNum: order !== undefined ? parseInt(order, 10) : 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  ApiResponse.created(res, { ...item, photoUrl: item.imageUrl }, 'Faculty member created');
});

/** PUT /api/faculty/:id — Update faculty info and/or photo */
const updateFaculty = asyncHandler(async (req, res) => {
  const { name, designation, department, qualification, experience, email, phone, order, isActive } = req.body;
  const updateData = {};

  if (name !== undefined) updateData.name = name;
  if (designation !== undefined) updateData.designation = designation;
  if (department !== undefined) updateData.department = department;
  if (qualification !== undefined) updateData.qualification = qualification;
  if (experience !== undefined) updateData.experience = experience;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (order !== undefined) updateData.orderNum = parseInt(order, 10);
  if (isActive !== undefined) updateData.isActive = isActive;

  if (req.file) {
    // Delete existing photo if it exists
    const existing = await facultyService.getById(req.params.id);
    if (existing.cloudinaryPublicId) {
      await StorageService.deleteFile(existing.cloudinaryPublicId);
    }
    const uploaded = await StorageService.uploadFile(req.file, 'faculty');
    updateData.imageUrl = uploaded.url;
    updateData.cloudinaryPublicId = uploaded.publicId;
  }

  const updated = await facultyService.update(req.params.id, updateData);
  ApiResponse.success(res, { ...updated, photoUrl: updated.imageUrl }, 'Faculty member updated');
});

/** DELETE /api/faculty/:id — Delete member and photo */
const deleteFaculty = asyncHandler(async (req, res) => {
  const item = await facultyService.getById(req.params.id);
  if (item.cloudinaryPublicId) {
    await StorageService.deleteFile(item.cloudinaryPublicId);
  }
  const result = await facultyService.delete(req.params.id);
  ApiResponse.success(res, result, 'Faculty member deleted');
});

module.exports = {
  listFaculty,
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  // Backward compatibility alias for staff
  listStaff: listFaculty,
  getAllStaff: getAllFaculty,
  getStaffById: getFacultyById,
  createStaff: createFaculty,
  updateStaff: updateFaculty,
  deleteStaff: deleteFaculty,
};

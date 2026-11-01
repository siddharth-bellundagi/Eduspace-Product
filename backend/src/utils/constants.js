/**
 * constants.js — Application-wide constants
 * Centralized place for magic values used throughout the backend.
 */

// ============================================
// Database Table Names
// ============================================
const TABLES = {
  // Users / Auth
  USERS: 'users',

  // Form submissions
  ADMISSION_ENQUIRIES: 'admission_enquiries',
  CONTACT_INQUIRIES: 'contact_inquiries',
  ALUMNI_REGISTRATIONS: 'alumni_registrations',

  // Dynamic content
  ANNOUNCEMENTS: 'announcements',
  TICKER_ITEMS: 'ticker_items',
  CIRCULARS_HOLIDAYS: 'circulars_holidays',
  UPCOMING_EVENTS: 'upcoming_events',
  GALLERY: 'gallery',
  FACULTY: 'faculty',
  STAFF: 'faculty', // Staff stored in faculty table with designation / department
  STUDENT_ACHIEVEMENTS: 'student_achievements',
  SSC_TOPPERS: 'ssc_toppers',
  AWARDS: 'student_achievements',
  ACADEMICS: 'academics',
  STUDENT_LIFE: 'student_life',
  PARENT_DOWNLOADS: 'parent_downloads',
  PARENT_CIRCULARS: 'circulars_holidays',
  PTA: 'academics',
  ALUMNI_STORIES: 'student_achievements',
  ALUMNI_EVENTS: 'upcoming_events',
};

// Backward-compatible alias for existing controllers
const COLLECTIONS = TABLES;

// ============================================
// Pagination Defaults
// ============================================
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 500,
};

// ============================================
// File Upload Limits
// ============================================
const UPLOAD = {
  MAX_IMAGE_SIZE: 15 * 1024 * 1024,      // 15MB
  MAX_DOCUMENT_SIZE: 25 * 1024 * 1024,   // 25MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// ============================================
// Admission Classes (for validation)
// ============================================
const ADMISSION_CLASSES = [
  'nursery', 'jr-kg', 'sr-kg',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'
];

// ============================================
// Student Life Categories
// ============================================
const STUDENT_LIFE_CATEGORIES = ['sports', 'cultural', 'competitions', 'trips', 'pre-primary'];

// ============================================
// Gallery Categories & Classes
// ============================================
const GALLERY_CATEGORIES = [
  'campus', 'pre-primary', 'academics', 'sports', 'cultural', 'trips', 'events', 'celebrations',
  'nursery', 'jr-kg', 'sr-kg',
  'class-1', 'class-2', 'class-3', 'class-4', 'class-5',
  'class-6', 'class-7', 'class-8', 'class-9', 'other'
];

// ============================================
// Submission Statuses
// ============================================
const SUBMISSION_STATUS = {
  NEW: 'new',
  READ: 'read',
  REPLIED: 'replied',
  ARCHIVED: 'archived',
};

module.exports = {
  TABLES,
  COLLECTIONS,
  PAGINATION,
  UPLOAD,
  ADMISSION_CLASSES,
  STUDENT_LIFE_CATEGORIES,
  GALLERY_CATEGORIES,
  SUBMISSION_STATUS,
};

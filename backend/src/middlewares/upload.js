/**
 * upload.js — Multer file upload middleware
 *
 * Uses DISK storage (not memory) to prevent OOM crashes.
 * Memory storage with 30 files × 25MB = 750MB RAM per request,
 * which exceeds PM2's 300MB memory limit and crashes the process.
 *
 * Disk storage writes files to a temp directory, and controllers
 * read them via fs.readFileSync(file.path) before uploading to Cloudinary.
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { UPLOAD } = require('../utils/constants');
const { BadRequestError } = require('../utils/ApiError');

// Ensure temp upload directory exists
const TEMP_UPLOAD_DIR = path.join(__dirname, '../../uploads/.tmp');
if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
  fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
}

/**
 * Disk storage — writes to uploads/.tmp/ with unique filenames.
 * Files are cleaned up after processing by the controller/storage service.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const imageFilter = (req, file, cb) => {
  if (UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid image type: ${file.mimetype}. Allowed: ${UPLOAD.ALLOWED_IMAGE_TYPES.join(', ')}`
      ),
      false
    );
  }
};

const documentFilter = (req, file, cb) => {
  if (
    UPLOAD.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype) ||
    file.mimetype === 'application/pdf' ||
    file.originalname.toLowerCase().endsWith('.pdf')
  ) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid document type: ${file.mimetype}. Allowed: ${UPLOAD.ALLOWED_DOCUMENT_TYPES.join(', ')}`
      ),
      false
    );
  }
};

const imageOrDocumentFilter = (req, file, cb) => {
  if (
    UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype) ||
    UPLOAD.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype) ||
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`Invalid file format: ${file.mimetype}`), false);
  }
};

const imageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: UPLOAD.MAX_IMAGE_SIZE,
    files: 10, // Reduced from 30 to be more practical
  },
});

const documentUpload = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: UPLOAD.MAX_DOCUMENT_SIZE,
    files: 10,
  },
});

const mixedUpload = multer({
  storage,
  fileFilter: imageOrDocumentFilter,
  limits: {
    fileSize: UPLOAD.MAX_DOCUMENT_SIZE,
    files: 10,
  },
});

module.exports = { imageUpload, documentUpload, mixedUpload };

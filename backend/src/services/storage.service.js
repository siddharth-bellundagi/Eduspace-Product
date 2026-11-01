/**
 * storage.service.js — Media & File Storage Service
 *
 * Primary: Cloudinary (25 GB free cloud space, global CDN, auto-optimization).
 * Fallback: Local disk storage in /uploads/ if Cloudinary credentials are not configured.
 *
 * Supports:
 *   - Single image & PDF uploads
 *   - Multiple photo uploads under a single album/activity in one click
 *   - File deletion (Cloudinary & Local disk)
 */
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { env } = require('../config/env');
const logger = require('../utils/logger');
const { BadRequestError, InternalError } = require('../utils/ApiError');
const { validateMagicBytes } = require('../utils/fileValidator');

// Configure Cloudinary if credentials exist
let isCloudinaryConfigured = false;
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  isCloudinaryConfigured = true;
  logger.info(`✅ Cloudinary configured for cloud: ${env.CLOUDINARY_CLOUD_NAME}`);
} else {
  logger.info('ℹ️  Cloudinary not configured. Storage will use local disk storage in /uploads/');
}

class StorageService {
  /**
   * Upload a single file to Cloudinary or local disk.
   * Supports both memory-storage (file.buffer) and disk-storage (file.path) multer files.
   * @param {Object} file - Multer file object { buffer|path, mimetype, originalname, size }
   * @param {string} folder - Subfolder name (e.g. 'gallery', 'faculty', 'downloads')
   * @returns {Promise<Object>} { url, publicId, fileName, contentType, size }
   */
  static async uploadFile(file, folder = 'general') {
    if (!file || (!file.buffer && !file.path)) {
      throw new BadRequestError('No file provided for upload');
    }

    // Read file buffer (disk storage) or use existing buffer (memory storage)
    const fileBuffer = file.buffer || fs.readFileSync(file.path);
    const fileSize = file.size || fileBuffer.length;

    // Validate magic bytes — reject files whose actual content doesn't match claimed type
    const { valid, detectedType } = validateMagicBytes(fileBuffer, file.mimetype);
    if (!valid) {
      // Clean up temp file before rejecting
      if (file.path) {
        try { fs.unlinkSync(file.path); } catch (_) { /* ignore */ }
      }
      logger.warn(`[Storage] Magic byte validation failed: claimed=${file.mimetype}, detected=${detectedType}, file=${file.originalname}`);
      throw new BadRequestError(
        `File content does not match its type. Expected ${file.mimetype} but file appears to be ${detectedType || 'unknown'}.`
      );
    }

    const sanitizedBase = file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .substring(0, 40);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const filenameWithExt = `${uniqueSuffix}-${sanitizedBase}${path.extname(file.originalname).toLowerCase()}`;

    // 1. Try Cloudinary if configured
    if (isCloudinaryConfigured) {
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `${env.CLOUDINARY_FOLDER}/${folder}`,
              public_id: `${uniqueSuffix}-${sanitizedBase}`,
              resource_type: 'auto', // handles images, raw PDFs, documents
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          uploadStream.end(fileBuffer);
        });

        logger.info(`[Storage] Cloudinary upload successful: ${uploadResult.secure_url}`);

        // Clean up temp file from disk-storage multer (if applicable)
        if (file.path) {
          try { fs.unlinkSync(file.path); } catch (_) { /* ignore */ }
        }

        return {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          fileName: file.originalname,
          contentType: file.mimetype,
          size: fileSize,
          storage: 'cloudinary',
        };
      } catch (err) {
        logger.warn(`[Storage] Cloudinary upload failed (${err.message}) — falling back to local disk.`);
      }
    }

    // 2. Local Disk fallback
    try {
      const isProduction = process.env.NODE_ENV === 'production';

      // Use env vars for configurable paths (no hardcoded school-specific paths)
      const uploadBaseDir = process.env.UPLOAD_DIR ||
        path.join(__dirname, '../../uploads');

      const uploadBaseUrl = process.env.UPLOAD_URL ||
        null; // null = use relative URL for dev

      const targetDir = path.join(uploadBaseDir, folder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, filenameWithExt);
      fs.writeFileSync(filePath, fileBuffer);

      // Clean up temp file from disk-storage multer (if applicable)
      if (file.path) {
        try { fs.unlinkSync(file.path); } catch (_) { /* ignore */ }
      }

      // Return full absolute URL in production, relative in dev
      const localUrl = uploadBaseUrl
        ? `${uploadBaseUrl}/${folder}/${filenameWithExt}`
        : `/uploads/${folder}/${filenameWithExt}`;

      logger.info(`[Storage] Saved to disk: ${localUrl}`);

      return {
        url: localUrl,
        publicId: `local:${folder}/${filenameWithExt}`,
        fileName: file.originalname,
        contentType: file.mimetype,
        size: fileSize,
        storage: 'local',
      };
    } catch (diskErr) {
      logger.error(`[Storage] Local disk upload failed: ${diskErr.message}`);
      throw new InternalError(`Failed to save file: ${diskErr.message}`);
    }
  }

  /**
   * Upload multiple files in parallel (e.g. for batch album/class photo upload)
   * @param {Array<Object>} files - Array of Multer file objects
   * @param {string} folder - Subfolder
   * @returns {Promise<Array<Object>>} Array of file upload details
   */
  static async uploadMultiple(files, folder = 'gallery') {
    if (!files || !Array.isArray(files) || files.length === 0) {
      return [];
    }
    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }

  /**
   * Delete a file from Cloudinary or local disk
   * @param {string} publicId - Cloudinary public_id or local:folder/filename
   */
  static async deleteFile(publicId) {
    if (!publicId) return false;

    try {
      if (publicId.startsWith('local:')) {
        const relativePath = publicId.replace('local:', '');
        const fullPath = path.join(__dirname, '../../uploads', relativePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          logger.info(`[Storage] Deleted local file: ${fullPath}`);
        }
        return true;
      }

      if (isCloudinaryConfigured) {
        await cloudinary.uploader.destroy(publicId);
        logger.info(`[Storage] Deleted Cloudinary asset: ${publicId}`);
        return true;
      }
    } catch (err) {
      logger.warn(`[Storage] Failed to delete asset ${publicId}: ${err.message}`);
    }
    return false;
  }
}

module.exports = StorageService;

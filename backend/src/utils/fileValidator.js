/**
 * fileValidator.js — Magic byte (file signature) validation
 *
 * Validates uploaded files by checking their actual binary content (magic bytes)
 * rather than trusting the client-provided MIME type or file extension,
 * which can be trivially spoofed.
 *
 * This catches attacks where executables (.exe, .sh) are renamed to .jpg
 * and uploaded with a spoofed Content-Type: image/jpeg header.
 */

// Known file signatures (magic bytes) for allowed file types
const FILE_SIGNATURES = {
  // Images
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF],                    // JPEG / JFIF / Exif
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],  // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],  // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],  // GIF89a
  ],
  'image/webp': [
    // RIFF....WEBP — bytes 0-3 = RIFF, bytes 8-11 = WEBP
    // We check the RIFF header; WEBP check done separately
    [0x52, 0x49, 0x46, 0x46],
  ],

  // Documents
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46],              // %PDF
  ],
  'application/msword': [
    [0xD0, 0xCF, 0x11, 0xE0],              // OLE2 (DOC, XLS, PPT)
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4B, 0x03, 0x04],              // PK ZIP (DOCX, XLSX, PPTX)
  ],
};

/**
 * Check if buffer starts with the given signature bytes
 * @param {Buffer} buffer - File content buffer
 * @param {number[]} signature - Expected magic bytes
 * @returns {boolean}
 */
function matchesSignature(buffer, signature) {
  if (buffer.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Validate that a file's actual content matches its claimed MIME type
 * @param {Buffer} buffer - First N bytes of the file
 * @param {string} claimedMimeType - The MIME type from the upload header
 * @returns {{ valid: boolean, detectedType: string|null }}
 */
function validateMagicBytes(buffer, claimedMimeType) {
  if (!buffer || buffer.length < 4) {
    return { valid: false, detectedType: null };
  }

  // Check if the claimed type has known signatures
  const signatures = FILE_SIGNATURES[claimedMimeType];
  if (signatures) {
    for (const sig of signatures) {
      if (matchesSignature(buffer, sig)) {
        // Special case: WebP needs additional check at offset 8
        if (claimedMimeType === 'image/webp') {
          if (buffer.length >= 12) {
            const webpMarker = buffer.slice(8, 12).toString('ascii');
            if (webpMarker !== 'WEBP') {
              return { valid: false, detectedType: 'application/octet-stream' };
            }
          }
        }
        return { valid: true, detectedType: claimedMimeType };
      }
    }
    return { valid: false, detectedType: detectType(buffer) };
  }

  // For types without known signatures, check if it's an image or doc broadly
  if (claimedMimeType.startsWith('image/')) {
    // Must match at least one known image signature
    for (const [type, sigs] of Object.entries(FILE_SIGNATURES)) {
      if (!type.startsWith('image/')) continue;
      for (const sig of sigs) {
        if (matchesSignature(buffer, sig)) {
          return { valid: true, detectedType: type };
        }
      }
    }
    return { valid: false, detectedType: detectType(buffer) };
  }

  // Allow unknown document types through (they passed mimetype filter already)
  return { valid: true, detectedType: claimedMimeType };
}

/**
 * Best-effort detection of actual file type from magic bytes
 */
function detectType(buffer) {
  for (const [type, sigs] of Object.entries(FILE_SIGNATURES)) {
    for (const sig of sigs) {
      if (matchesSignature(buffer, sig)) return type;
    }
  }
  return 'application/octet-stream';
}

module.exports = { validateMagicBytes };

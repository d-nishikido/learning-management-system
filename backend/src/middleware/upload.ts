import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { Request } from 'express';
import { ValidationError } from '../utils/errors';

/**
 * Allowed file types for learning materials
 */
const ALLOWED_FILE_TYPES = {
  // Videos
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
  
  // Documents
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  
  // Audio
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/x-m4a': '.m4a',
  'audio/ogg': '.ogg',
  
  // Images (for thumbnails)
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  
  // Text files
  'text/plain': '.txt',
  'text/markdown': '.md',
  
  // Compressed files
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar',
  'application/x-7z-compressed': '.7z',
};

/**
 * Maximum file sizes by type (in bytes)
 */
const MAX_FILE_SIZES = {
  video: 500 * 1024 * 1024, // 500MB for videos
  document: 50 * 1024 * 1024, // 50MB for documents
  audio: 100 * 1024 * 1024, // 100MB for audio
  image: 10 * 1024 * 1024, // 10MB for images
  text: 5 * 1024 * 1024, // 5MB for text files
  archive: 100 * 1024 * 1024, // 100MB for archives
};

/**
 * Get file category based on MIME type
 */
function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('text/')) return 'text';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('presentation')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
  return 'document'; // Default fallback
}

/**
 * Generate secure filename
 */
function generateSecureFilename(originalName: string, mimeType: string): string {
  const extension = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES] || path.extname(originalName);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const baseName = path.basename(originalName, path.extname(originalName))
    .replace(/[^a-zA-Z0-9\-_]/g, '_') // Replace special characters with underscore
    .substring(0, 50); // Limit length
  
  return `${timestamp}_${randomString}_${baseName}${extension}`;
}

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir(uploadPath: string): Promise<void> {
  try {
    await fs.access(uploadPath);
  } catch {
    await fs.mkdir(uploadPath, { recursive: true });
  }
}

/**
 * File filter function for multer
 */
function fileFilter(_req: Request, file: multer.File, cb: multer.FileFilterCallback): void {
  // Check if file type is allowed
  if (!ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES]) {
    const error = new ValidationError(`File type ${file.mimetype} is not allowed`);
    return cb(error);
  }
  
  cb(null, true);
}

/**
 * Configure multer storage
 */
const storage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    try {
      const courseId = req.params.courseId;
      const lessonId = req.params.lessonId;
      
      if (!courseId || !lessonId) {
        return cb(new ValidationError('Course ID and Lesson ID are required'), '');
      }
      
      const uploadPath = path.join(
        process.cwd(),
        'uploads',
        'materials',
        courseId,
        lessonId
      );
      
      await ensureUploadDir(uploadPath);
      cb(null, uploadPath);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  
  filename: (_req, file, cb) => {
    try {
      const secureFilename = generateSecureFilename(file.originalname, file.mimetype);
      cb(null, secureFilename);
    } catch (error) {
      cb(error as Error, '');
    }
  }
});

/**
 * Configure multer with file size limits
 */
export const uploadMaterial = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(MAX_FILE_SIZES)), // Use the largest size limit
    files: 1, // Only allow one file per upload
    fields: 10, // Limit number of form fields
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024, // 1MB limit for field values
  },
});

/**
 * Middleware to validate file size based on type
 */
export function validateFileSize(req: Request, _res: any, next: any): void {
  if (!req.file) {
    return next();
  }
  
  const fileCategory = getFileCategory(req.file.mimetype);
  const maxSize = MAX_FILE_SIZES[fileCategory as keyof typeof MAX_FILE_SIZES];
  
  if (req.file.size > maxSize) {
    // Delete the uploaded file if it's too large
    fs.unlink(req.file.path).catch(() => {
      // TODO: Replace with proper logging service
      // console.error('Failed to cleanup uploaded file');
    });
    
    const error = new ValidationError(
      `File size ${req.file.size} bytes exceeds maximum allowed size ${maxSize} bytes for ${fileCategory} files`
    );
    return next(error);
  }
  
  next();
}

/**
 * Middleware to add file information to request
 */
export function processFileInfo(req: Request, _res: any, next: any): void {
  if (!req.file) {
    return next();
  }
  
  // Add processed file information to request body
  req.body.filePath = req.file.path;
  req.body.fileSize = req.file.size;
  req.body.fileType = req.file.mimetype;
  req.body.originalFileName = req.file.originalname;
  
  next();
}

/**
 * Cleanup uploaded files in case of error
 */
export function cleanupOnError(err: any, req: Request, _res: any, next: any): void {
  if (req.file && req.file.path) {
    fs.unlink(req.file.path).catch(() => {
      // TODO: Replace with proper logging service
      // console.error('Failed to cleanup uploaded file');
    });
  }
  next(err);
}

/**
 * Export file type constants for use in validation schemas
 */
export { ALLOWED_FILE_TYPES, MAX_FILE_SIZES };
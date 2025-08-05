import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { ValidationError } from '../utils/errors';
import { FileUploadLogger } from '../utils/logger';

/**
 * File magic numbers (signatures) for validation
 */
const FILE_SIGNATURES: Record<string, string[]> = {
  // Images
  'image/jpeg': ['FFD8FF'],
  'image/png': ['89504E47'],
  'image/gif': ['474946'],
  'image/webp': ['52494646'],
  'image/bmp': ['424D'],
  'image/tiff': ['49492A00', '4D4D002A'],
  
  // Videos
  'video/mp4': ['00000018667479', '00000020667479', '66747970'],
  'video/avi': ['52494646'],
  'video/mov': ['66747970717420', '6674797071742020'],
  'video/webm': ['1A45DFA3'],
  'video/quicktime': ['66747970717420'],
  
  // Audio
  'audio/mp3': ['494433', 'FFFB', 'FFF3', 'FFF2'],
  'audio/wav': ['52494646'],
  'audio/ogg': ['4F676753'],
  'audio/m4a': ['66747970'],
  
  // Documents
  'application/pdf': ['255044462D'],
  'application/zip': ['504B0304', '504B0506', '504B0708'],
  'application/x-rar': ['526172211A0700', '526172211A070100']
};

/**
 * Dangerous file extensions that should never be allowed
 */
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.dll', '.so', '.dylib',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.ps1'
];

/**
 * Maximum file name length
 */
const MAX_FILENAME_LENGTH = 255;

/**
 * Validate file header/magic number
 */
export async function validateFileHeader(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.file) {
    return next();
  }

  try {
    const filePath = req.file.path;
    const declaredMimeType = req.file.mimetype;
    
    // Read first 32 bytes of the file to check magic number
    const fileBuffer = await fs.readFile(filePath, { encoding: null });
    const fileHeader = fileBuffer.subarray(0, 32).toString('hex').toUpperCase();
    
    // Get expected signatures for the declared MIME type
    const expectedSignatures = FILE_SIGNATURES[declaredMimeType];
    
    if (expectedSignatures) {
      const isValidSignature = expectedSignatures.some(signature => 
        fileHeader.startsWith(signature.toUpperCase())
      );
      
      if (!isValidSignature) {
        await fs.unlink(filePath).catch(() => {
          // Ignore cleanup errors
        });
        throw new ValidationError(`File header does not match declared type ${declaredMimeType}`);
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validate file name for security issues
 */
export function validateFileName(req: Request, _res: Response, next: NextFunction): void {
  if (!req.file) {
    return next();
  }

  try {
    const originalName = req.file.originalname;
    const fileExtension = path.extname(originalName).toLowerCase();
    
    // Check file name length
    if (originalName.length > MAX_FILENAME_LENGTH) {
      throw new ValidationError(`File name too long. Maximum length is ${MAX_FILENAME_LENGTH} characters`);
    }
    
    // Check for dangerous extensions
    if (DANGEROUS_EXTENSIONS.includes(fileExtension)) {
      throw new ValidationError(`File extension ${fileExtension} is not allowed for security reasons`);
    }
    
    // Check for suspicious patterns
    if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
      throw new ValidationError('File name contains invalid characters');
    }
    
    // Check for null bytes
    if (originalName.includes('\0')) {
      throw new ValidationError('File name contains null bytes');
    }
    
    // Check for control characters
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1f\x7f-\x9f]/.test(originalName)) {
      throw new ValidationError('File name contains control characters');
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validate file content for malicious patterns
 */
export async function scanFileContent(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.file) {
    return next();
  }

  try {
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    
    // Skip content scanning for allowed document types
    // These file types have complex internal structures that may trigger false positives
    const skipContentScanTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'audio/mpeg',
      'audio/wav',
      'audio/x-m4a',
      'audio/ogg',
      // Text files for educational content
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (skipContentScanTypes.includes(mimeType)) {
      return next();
    }
    
    const fileBuffer = await fs.readFile(filePath, { encoding: null });
    
    // Convert to string for pattern matching (first 1MB only for performance)
    const contentToScan = fileBuffer.subarray(0, 1024 * 1024).toString('binary');
    
    // Check for executable headers only (more focused security check)
    const executablePatterns = [
      // eslint-disable-next-line no-control-regex
      /MZ[\x00-\xFF]{2}[\x00-\xFF]*PE\x00\x00/g, // PE header (Windows executables)
      // eslint-disable-next-line no-control-regex
      /\x7fELF/g, // ELF header (Linux executables)
      // Mach-O header (macOS executables)
      // eslint-disable-next-line no-control-regex
      /\xce\xfa\xed\xfe|\xcf\xfa\xed\xfe|\xfe\xed\xfa\xce|\xfe\xed\xfa\xcf/g
    ];
    
    // For text-based files (HTML, TXT, etc), check for script injections
    if (mimeType.startsWith('text/') || mimeType === 'application/javascript') {
      const scriptPatterns = [
        // Script tags
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        // PHP tags
        /<\?php/gi,
        // ASP tags
        /<%[\s\S]*?%>/gi
      ];
      
      for (const pattern of scriptPatterns) {
        if (pattern.test(contentToScan)) {
          await fs.unlink(filePath).catch(() => {
            // Ignore cleanup errors
          });
          throw new ValidationError('File contains suspicious content and has been rejected');
        }
      }
    }
    
    // Check for executable headers in all files
    for (const pattern of executablePatterns) {
      if (pattern.test(contentToScan)) {
        await fs.unlink(filePath).catch(() => {
          // Ignore cleanup errors
        });
        throw new ValidationError('File appears to be an executable and has been rejected');
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validate file size against specific limits
 */
export function validateFileSize(maxSizeBytes: number) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.file) {
      return next();
    }

    if (req.file.size > maxSizeBytes) {
      const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
      const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
      
      // Cleanup uploaded file
      fs.unlink(req.file.path).catch(() => {
        // Ignore cleanup errors
      });
      
      throw new ValidationError(`File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`);
    }

    next();
  };
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
  maxWidth: number,
  maxHeight: number
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.file || !req.file.mimetype.startsWith('image/')) {
      return next();
    }

    try {
      // Use sharp to get image dimensions
      const sharp = await import('sharp');
      const metadata = await sharp.default(req.file.path).metadata();
      
      if (metadata.width && metadata.width > maxWidth) {
        await fs.unlink(req.file.path).catch(() => {});
        throw new ValidationError(`Image width ${metadata.width}px exceeds maximum allowed width of ${maxWidth}px`);
      }
      
      if (metadata.height && metadata.height > maxHeight) {
        await fs.unlink(req.file.path).catch(() => {});
        throw new ValidationError(`Image height ${metadata.height}px exceeds maximum allowed height of ${maxHeight}px`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate video duration
 */
export function validateVideoDuration(maxDurationSeconds: number) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.file || !req.file.mimetype.startsWith('video/')) {
      return next();
    }

    try {
      // Use ffprobe to get video duration
      const ffmpeg = await import('fluent-ffmpeg');
      
      const metadata = await new Promise<any>((resolve, reject) => {
        ffmpeg.default.ffprobe(req.file!.path, (err, metadata) => {
          if (err) reject(err);
          else resolve(metadata);
        });
      });
      
      const duration = metadata.format.duration;
      
      if (duration && duration > maxDurationSeconds) {
        await fs.unlink(req.file.path).catch(() => {});
        const maxDurationMin = Math.floor(maxDurationSeconds / 60);
        const durationMin = Math.floor(duration / 60);
        throw new ValidationError(`Video duration ${durationMin} minutes exceeds maximum allowed duration of ${maxDurationMin} minutes`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Comprehensive file validation middleware
 */
export function validateFileComprehensive(options: {
  maxSizeBytes?: number;
  maxImageWidth?: number;
  maxImageHeight?: number;
  maxVideoDurationSeconds?: number;
  enableHeaderValidation?: boolean;
  enableContentScanning?: boolean;
} = {}) {
  const {
    maxSizeBytes,
    maxImageWidth,
    maxImageHeight,
    maxVideoDurationSeconds,
    enableHeaderValidation = true,
    enableContentScanning = true
  } = options;

  const middleware: Array<(req: Request, res: Response, next: NextFunction) => void | Promise<void>> = [];

  // Always validate file name
  middleware.push(validateFileName);

  // Optional file size validation
  if (maxSizeBytes) {
    middleware.push(validateFileSize(maxSizeBytes));
  }

  // Optional header validation
  if (enableHeaderValidation) {
    middleware.push(validateFileHeader);
  }

  // Optional content scanning
  if (enableContentScanning) {
    middleware.push(scanFileContent);
  }

  // Optional image dimension validation
  if (maxImageWidth && maxImageHeight) {
    middleware.push(validateImageDimensions(maxImageWidth, maxImageHeight));
  }

  // Optional video duration validation
  if (maxVideoDurationSeconds) {
    middleware.push(validateVideoDuration(maxVideoDurationSeconds));
  }

  return middleware;
}

/**
 * Quarantine suspicious files
 */
export async function quarantineFile(filePath: string, reason: string): Promise<void> {
  try {
    const quarantineDir = path.join(process.cwd(), 'quarantine');
    await fs.mkdir(quarantineDir, { recursive: true });
    
    const fileName = path.basename(filePath);
    const timestamp = Date.now();
    const quarantinePath = path.join(quarantineDir, `${timestamp}_${fileName}`);
    
    await fs.rename(filePath, quarantinePath);
    
    // Log quarantine action
    const logEntry = {
      timestamp: new Date().toISOString(),
      originalPath: filePath,
      quarantinePath,
      reason
    };
    
    const logFile = path.join(quarantineDir, 'quarantine.log');
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    
    FileUploadLogger.logFileQuarantine(fileName, reason, quarantinePath);
  } catch (error) {
    FileUploadLogger.logFileCleanup([filePath], false, error instanceof Error ? error.message : 'Unknown error');
  }
}
import { Request, Response, NextFunction } from 'express';
import { ImageProcessingService, ImageProcessingOptions } from '../services/imageProcessingService';
import { VideoProcessingService, VideoProcessingOptions } from '../services/videoProcessingService';
import { ValidationError } from '../utils/errors';
import { FileUploadLogger } from '../utils/logger';

export interface OptimizationResult {
  optimizedPath: string;
  thumbnailPath?: string | undefined;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  dimensions: {
    width: number;
    height: number;
  };
  metadata?: any;
}

/**
 * Configuration for file optimization
 */
export interface OptimizationConfig {
  images: {
    enabled: boolean;
    quality: number;
    maxWidth: number;
    maxHeight: number;
    generateThumbnail: boolean;
    thumbnailSize: number;
    convertToWebP: boolean;
  };
  videos: {
    enabled: boolean;
    quality: 'low' | 'medium' | 'high';
    maxWidth: number;
    maxHeight: number;
    generateThumbnail: boolean;
    compression: 'fast' | 'balanced' | 'best';
    format: 'mp4' | 'webm';
  };
  async: boolean; // Whether to process files asynchronously
}

/**
 * Default optimization configuration
 */
const DEFAULT_CONFIG: OptimizationConfig = {
  images: {
    enabled: true,
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1080,
    generateThumbnail: true,
    thumbnailSize: 300,
    convertToWebP: true
  },
  videos: {
    enabled: true,
    quality: 'medium',
    maxWidth: 1280,
    maxHeight: 720,
    generateThumbnail: true,
    compression: 'balanced',
    format: 'mp4'
  },
  async: false // Process synchronously by default for consistency
};

/**
 * Middleware to optimize uploaded files (images and videos)
 */
export function optimizeFile(config: Partial<OptimizationConfig> = {}) {
  const finalConfig: OptimizationConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    images: { ...DEFAULT_CONFIG.images, ...config.images },
    videos: { ...DEFAULT_CONFIG.videos, ...config.videos }
  };

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      return next();
    }

    try {
      const filePath = req.file.path;
      const fileType = getFileType(req.file.mimetype);

      let optimizationResult: OptimizationResult | null = null;

      switch (fileType) {
        case 'image':
          if (finalConfig.images.enabled) {
            optimizationResult = await optimizeImage(filePath, finalConfig.images);
          }
          break;
        case 'video':
          if (finalConfig.videos.enabled) {
            optimizationResult = await optimizeVideo(filePath, finalConfig.videos);
          }
          break;
        default:
          // Not an optimizable file type, continue without optimization
          return next();
      }

      if (optimizationResult) {
        // Update request with optimization results
        req.body.originalFilePath = filePath;
        req.body.optimizedFilePath = optimizationResult.optimizedPath;
        req.body.thumbnailPath = optimizationResult.thumbnailPath;
        req.body.originalFileSize = optimizationResult.originalSize;
        req.body.optimizedFileSize = optimizationResult.optimizedSize;
        req.body.compressionRatio = optimizationResult.compressionRatio;
        req.body.fileDimensions = optimizationResult.dimensions;
        req.body.optimizationMetadata = optimizationResult.metadata;

        // Update file information to point to optimized version
        req.body.filePath = optimizationResult.optimizedPath;
        req.body.fileSize = optimizationResult.optimizedSize;
      }

      next();
    } catch (error) {
      // If optimization fails, continue with original file
      FileUploadLogger.logOptimizationFailure(
        req.file.path, 
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      // Don't fail the upload, just log the error and continue
      next();
    }
  };
}

/**
 * Optimize image file
 */
async function optimizeImage(
  filePath: string,
  config: OptimizationConfig['images']
): Promise<OptimizationResult> {
  const options: ImageProcessingOptions = {
    width: config.maxWidth,
    height: config.maxHeight,
    quality: config.quality,
    format: config.convertToWebP ? 'webp' : 'jpeg',
    generateThumbnail: config.generateThumbnail,
    thumbnailSize: config.thumbnailSize
  };

  const result = await ImageProcessingService.processImage(filePath, options);
  
  return {
    optimizedPath: result.optimizedPath,
    thumbnailPath: result.thumbnailPath || undefined,
    originalSize: result.originalSize,
    optimizedSize: result.optimizedSize,
    compressionRatio: result.compressionRatio,
    dimensions: result.dimensions
  };
}

/**
 * Optimize video file
 */
async function optimizeVideo(
  filePath: string,
  config: OptimizationConfig['videos']
): Promise<OptimizationResult> {
  const options: VideoProcessingOptions = {
    width: config.maxWidth,
    height: config.maxHeight,
    quality: config.quality,
    format: config.format,
    generateThumbnail: config.generateThumbnail,
    compression: config.compression
  };

  const result = await VideoProcessingService.processVideo(filePath, options);
  
  return {
    optimizedPath: result.optimizedPath,
    thumbnailPath: result.thumbnailPath || undefined,
    originalSize: result.originalSize,
    optimizedSize: result.optimizedSize,
    compressionRatio: result.compressionRatio,
    dimensions: result.dimensions,
    metadata: result.metadata
  };
}

/**
 * Get file type category from MIME type
 */
function getFileType(mimeType: string): 'image' | 'video' | 'other' {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  return 'other';
}

/**
 * Middleware to validate optimized files
 */
export async function validateOptimizedFile(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.body.optimizedFilePath) {
    return next();
  }

  try {
    const filePath = req.body.optimizedFilePath;
    const fileType = getFileType(req.file?.mimetype || '');

    let isValid = false;

    switch (fileType) {
      case 'image':
        isValid = await ImageProcessingService.validateImage(filePath);
        break;
      case 'video':
        isValid = await VideoProcessingService.validateVideo(filePath);
        break;
      default:
        isValid = true; // Skip validation for non-optimizable files
    }

    if (!isValid) {
      throw new ValidationError('Optimized file validation failed');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to clean up temporary files on error
 */
export function cleanupOptimizedFiles(err: any, req: Request, _res: Response, next: NextFunction): void {
  const filesToCleanup: string[] = [];

  if (req.body.optimizedFilePath && req.body.optimizedFilePath !== req.body.originalFilePath) {
    filesToCleanup.push(req.body.optimizedFilePath);
  }

  if (req.body.thumbnailPath) {
    filesToCleanup.push(req.body.thumbnailPath);
  }

  if (filesToCleanup.length > 0) {
    // Clean up asynchronously without blocking the response
    Promise.all([
      ImageProcessingService.cleanup(filesToCleanup),
      VideoProcessingService.cleanup(filesToCleanup)
    ]).catch(cleanupError => {
      FileUploadLogger.logFileCleanup(
        filesToCleanup, 
        false, 
        cleanupError instanceof Error ? cleanupError.message : 'Unknown error'
      );
    });
  }

  next(err);
}

/**
 * Get optimization statistics for monitoring
 */
export interface OptimizationStats {
  totalFiles: number;
  totalOriginalSize: number;
  totalOptimizedSize: number;
  averageCompressionRatio: number;
  imageCount: number;
  videoCount: number;
}

let optimizationStats: OptimizationStats = {
  totalFiles: 0,
  totalOriginalSize: 0,
  totalOptimizedSize: 0,
  averageCompressionRatio: 0,
  imageCount: 0,
  videoCount: 0
};

/**
 * Middleware to track optimization statistics
 */
export function trackOptimizationStats(req: Request, _res: Response, next: NextFunction): void {
  if (req.body.optimizedFilePath && req.body.originalFileSize && req.body.optimizedFileSize) {
    const fileType = getFileType(req.file?.mimetype || '');
    
    optimizationStats.totalFiles++;
    optimizationStats.totalOriginalSize += req.body.originalFileSize;
    optimizationStats.totalOptimizedSize += req.body.optimizedFileSize;
    
    if (fileType === 'image') {
      optimizationStats.imageCount++;
    } else if (fileType === 'video') {
      optimizationStats.videoCount++;
    }

    // Recalculate average compression ratio
    const totalSavings = optimizationStats.totalOriginalSize - optimizationStats.totalOptimizedSize;
    optimizationStats.averageCompressionRatio = (totalSavings / optimizationStats.totalOriginalSize) * 100;
  }

  next();
}

/**
 * Get current optimization statistics
 */
export function getOptimizationStats(): OptimizationStats {
  return { ...optimizationStats };
}

/**
 * Reset optimization statistics
 */
export function resetOptimizationStats(): void {
  optimizationStats = {
    totalFiles: 0,
    totalOriginalSize: 0,
    totalOptimizedSize: 0,
    averageCompressionRatio: 0,
    imageCount: 0,
    videoCount: 0
  };
}
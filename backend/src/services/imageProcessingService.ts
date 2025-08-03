import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { ValidationError } from '../utils/errors';
import { FileUploadLogger } from '../utils/logger';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface ProcessedImageResult {
  optimizedPath: string;
  thumbnailPath?: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export class ImageProcessingService {
  private static readonly DEFAULT_QUALITY = 80;
  private static readonly DEFAULT_THUMBNAIL_SIZE = 300;
  private static readonly SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'tiff', 'bmp'];

  /**
   * Check if file is a supported image format
   */
  static isImage(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase().substring(1);
    return this.SUPPORTED_FORMATS.includes(ext);
  }

  /**
   * Get image metadata
   */
  static async getImageMetadata(filePath: string): Promise<sharp.Metadata> {
    try {
      return await sharp(filePath).metadata();
    } catch (error) {
      throw new ValidationError(`Failed to read image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process and optimize image
   */
  static async processImage(
    inputPath: string,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImageResult> {
    try {
      // Validate input file exists
      await fs.access(inputPath);
      
      if (!this.isImage(inputPath)) {
        throw new ValidationError('File is not a supported image format');
      }

      const {
        width,
        height,
        quality = this.DEFAULT_QUALITY,
        format = 'webp',
        generateThumbnail = true,
        thumbnailSize = this.DEFAULT_THUMBNAIL_SIZE
      } = options;

      // Get original file stats
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      // Get image metadata for validation
      await this.getImageMetadata(inputPath);
      
      // Generate output path
      const inputDir = path.dirname(inputPath);
      const inputName = path.basename(inputPath, path.extname(inputPath));
      const optimizedPath = path.join(inputDir, `${inputName}_optimized.${format}`);

      // Create sharp instance
      let sharpInstance = sharp(inputPath);

      // Apply transformations
      if (width || height) {
        sharpInstance = sharpInstance.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Apply format-specific optimizations
      switch (format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality,
            progressive: true,
            mozjpeg: true
          });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({
            quality,
            compressionLevel: 9,
            adaptiveFiltering: true
          });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality,
            effort: 6
          });
          break;
      }

      // Save optimized image
      await sharpInstance.toFile(optimizedPath);

      // Get optimized file size
      const optimizedStats = await fs.stat(optimizedPath);
      const optimizedSize = optimizedStats.size;

      // Calculate compression ratio
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      // Get final dimensions
      const optimizedMetadata = await this.getImageMetadata(optimizedPath);
      const dimensions = {
        width: optimizedMetadata.width || 0,
        height: optimizedMetadata.height || 0
      };

      const result: ProcessedImageResult = {
        optimizedPath,
        originalSize,
        optimizedSize,
        compressionRatio,
        dimensions
      };

      // Generate thumbnail if requested
      if (generateThumbnail) {
        const thumbnailPath = await this.generateThumbnail(inputPath, thumbnailSize);
        result.thumbnailPath = thumbnailPath;
      }

      return result;
    } catch (error) {
      throw new ValidationError(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate thumbnail
   */
  static async generateThumbnail(
    inputPath: string,
    size: number = this.DEFAULT_THUMBNAIL_SIZE
  ): Promise<string> {
    try {
      const inputDir = path.dirname(inputPath);
      const inputName = path.basename(inputPath, path.extname(inputPath));
      const thumbnailPath = path.join(inputDir, `${inputName}_thumbnail.webp`);

      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'centre'
        })
        .webp({ quality: 80 })
        .toFile(thumbnailPath);

      return thumbnailPath;
    } catch (error) {
      throw new ValidationError(`Thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch process multiple images
   */
  static async batchProcessImages(
    inputPaths: string[],
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImageResult[]> {
    const results: ProcessedImageResult[] = [];
    
    for (const inputPath of inputPaths) {
      try {
        const result = await this.processImage(inputPath, options);
        results.push(result);
      } catch (error) {
        // Log error but continue processing other images
        FileUploadLogger.logOptimizationFailure(inputPath, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return results;
  }

  /**
   * Clean up temporary files
   */
  static async cleanup(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore cleanup errors
        FileUploadLogger.logFileCleanup([filePath], false, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Convert image to WebP format (recommended for web)
   */
  static async convertToWebP(
    inputPath: string,
    quality: number = this.DEFAULT_QUALITY
  ): Promise<string> {
    const inputDir = path.dirname(inputPath);
    const inputName = path.basename(inputPath, path.extname(inputPath));
    const webpPath = path.join(inputDir, `${inputName}.webp`);

    await sharp(inputPath)
      .webp({ quality })
      .toFile(webpPath);

    return webpPath;
  }

  /**
   * Validate image file integrity
   */
  static async validateImage(filePath: string): Promise<boolean> {
    try {
      const metadata = await this.getImageMetadata(filePath);
      return !!(metadata.width && metadata.height && metadata.format);
    } catch {
      return false;
    }
  }
}
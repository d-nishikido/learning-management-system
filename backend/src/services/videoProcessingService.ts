import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { ValidationError } from '../utils/errors';
import { FileUploadLogger } from '../utils/logger';

export interface VideoProcessingOptions {
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
  format?: 'mp4' | 'webm';
  generateThumbnail?: boolean;
  thumbnailTime?: string; // Time in format "00:00:05" (5 seconds)
  compression?: 'fast' | 'balanced' | 'best';
}

export interface ProcessedVideoResult {
  optimizedPath: string;
  thumbnailPath?: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  duration: number;
  dimensions: {
    width: number;
    height: number;
  };
  metadata: VideoMetadata;
}

export interface VideoMetadata {
  duration: number;
  bitrate: number;
  codec: string;
  frameRate: number;
  format: string;
  width: number;
  height: number;
}

export class VideoProcessingService {
  private static readonly SUPPORTED_FORMATS = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'];
  private static readonly DEFAULT_THUMBNAIL_TIME = '00:00:05';

  /**
   * Check if file is a supported video format
   */
  static isVideo(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase().substring(1);
    return this.SUPPORTED_FORMATS.includes(ext);
  }

  /**
   * Get video metadata
   */
  static async getVideoMetadata(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new ValidationError(`Failed to read video metadata: ${err.message}`));
          return;
        }

        try {
          const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
          if (!videoStream) {
            reject(new ValidationError('No video stream found in file'));
            return;
          }

          const result: VideoMetadata = {
            duration: metadata.format.duration || 0,
            bitrate: parseInt(String(metadata.format.bit_rate || '0')),
            codec: videoStream.codec_name || 'unknown',
            frameRate: this.parseFrameRate(videoStream.r_frame_rate || '0/1'),
            format: metadata.format.format_name || 'unknown',
            width: videoStream.width || 0,
            height: videoStream.height || 0
          };

          resolve(result);
        } catch (error) {
          reject(new ValidationError(`Failed to parse video metadata: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      });
    });
  }

  /**
   * Parse frame rate from fractional format (e.g., "30000/1001")
   */
  private static parseFrameRate(frameRateStr: string): number {
    const [numeratorStr, denominatorStr] = frameRateStr.split('/');
    const numerator = Number(numeratorStr);
    const denominator = Number(denominatorStr);
    return denominator && !isNaN(numerator) ? numerator / denominator : 0;
  }

  /**
   * Process and optimize video
   */
  static async processVideo(
    inputPath: string,
    options: VideoProcessingOptions = {}
  ): Promise<ProcessedVideoResult> {
    try {
      // Validate input file exists
      await fs.access(inputPath);
      
      if (!this.isVideo(inputPath)) {
        throw new ValidationError('File is not a supported video format');
      }

      const {
        width,
        height,
        quality = 'medium',
        format = 'mp4',
        generateThumbnail = true,
        thumbnailTime = this.DEFAULT_THUMBNAIL_TIME,
        compression = 'balanced'
      } = options;

      // Get original file stats and validate video
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;
      await this.getVideoMetadata(inputPath);

      // Generate output path
      const inputDir = path.dirname(inputPath);
      const inputName = path.basename(inputPath, path.extname(inputPath));
      const optimizedPath = path.join(inputDir, `${inputName}_optimized.${format}`);

      // Process video
      await this.convertVideo(inputPath, optimizedPath, {
        width: width || undefined,
        height: height || undefined,
        quality,
        format,
        compression
      });

      // Get optimized file size
      const optimizedStats = await fs.stat(optimizedPath);
      const optimizedSize = optimizedStats.size;

      // Calculate compression ratio
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      // Get final metadata
      const optimizedMetadata = await this.getVideoMetadata(optimizedPath);

      const result: ProcessedVideoResult = {
        optimizedPath,
        originalSize,
        optimizedSize,
        compressionRatio,
        duration: optimizedMetadata.duration,
        dimensions: {
          width: optimizedMetadata.width,
          height: optimizedMetadata.height
        },
        metadata: optimizedMetadata
      };

      // Generate thumbnail if requested
      if (generateThumbnail) {
        const thumbnailPath = await this.generateThumbnail(inputPath, thumbnailTime);
        result.thumbnailPath = thumbnailPath;
      }

      return result;
    } catch (error) {
      throw new ValidationError(`Video processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert video with specified options
   */
  private static async convertVideo(
    inputPath: string,
    outputPath: string,
    options: {
      width?: number | undefined;
      height?: number | undefined;
      quality: 'low' | 'medium' | 'high';
      format: 'mp4' | 'webm';
      compression: 'fast' | 'balanced' | 'best';
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      // Set video codec based on format
      if (options.format === 'mp4') {
        command = command.videoCodec('libx264');
      } else if (options.format === 'webm') {
        command = command.videoCodec('libvpx-vp9');
      }

      // Set encoding preset based on compression
      const presets = {
        fast: 'ultrafast',
        balanced: 'medium',
        best: 'slow'
      };
      command = command.addOption('-preset', presets[options.compression]);

      // Set quality (CRF values)
      const qualitySettings = {
        low: '28',
        medium: '23',
        high: '18'
      };
      command = command.addOption('-crf', qualitySettings[options.quality]);

      // Set resolution if specified
      if (options.width && options.height) {
        command = command.size(`${options.width}x${options.height}`);
      } else if (options.width || options.height) {
        // Maintain aspect ratio
        const size = options.width ? `${options.width}x?` : `?x${options.height}`;
        command = command.size(size);
      }

      // Additional optimization options
      command = command
        .addOption('-movflags', '+faststart') // Enable progressive download for web
        .addOption('-pix_fmt', 'yuv420p') // Ensure compatibility
        .audioCodec('aac') // Use AAC audio codec
        .audioBitrate('128k'); // Set audio bitrate

      // Execute conversion
      command
        .output(outputPath)
        .on('error', (err) => {
          reject(new ValidationError(`Video conversion failed: ${err.message}`));
        })
        .on('end', () => {
          resolve();
        })
        .run();
    });
  }

  /**
   * Generate video thumbnail
   */
  static async generateThumbnail(
    inputPath: string,
    time: string = this.DEFAULT_THUMBNAIL_TIME
  ): Promise<string> {
    const inputDir = path.dirname(inputPath);
    const inputName = path.basename(inputPath, path.extname(inputPath));
    const thumbnailPath = path.join(inputDir, `${inputName}_thumbnail.jpg`);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(time)
        .frames(1)
        .size('320x240')
        .format('image2')
        .output(thumbnailPath)
        .on('error', (err) => {
          reject(new ValidationError(`Thumbnail generation failed: ${err.message}`));
        })
        .on('end', () => {
          resolve(thumbnailPath);
        })
        .run();
    });
  }

  /**
   * Extract multiple thumbnails at different time intervals
   */
  static async generateMultipleThumbnails(
    inputPath: string,
    count: number = 5
  ): Promise<string[]> {
    try {
      const metadata = await this.getVideoMetadata(inputPath);
      const duration = metadata.duration;
      const interval = duration / (count + 1);
      
      const thumbnailPaths: string[] = [];
      const inputDir = path.dirname(inputPath);
      const inputName = path.basename(inputPath, path.extname(inputPath));

      for (let i = 1; i <= count; i++) {
        const timeInSeconds = interval * i;
        const timeString = this.secondsToTimeString(timeInSeconds);
        const thumbnailPath = path.join(inputDir, `${inputName}_thumbnail_${i}.jpg`);

        await new Promise<void>((resolve, reject) => {
          ffmpeg(inputPath)
            .seekInput(timeString)
            .frames(1)
            .size('320x240')
            .format('image2')
            .output(thumbnailPath)
            .on('error', (err) => {
              reject(new ValidationError(`Thumbnail ${i} generation failed: ${err.message}`));
            })
            .on('end', () => {
              resolve();
            })
            .run();
        });

        thumbnailPaths.push(thumbnailPath);
      }

      return thumbnailPaths;
    } catch (error) {
      throw new ValidationError(`Multiple thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert seconds to time string format (HH:MM:SS)
   */
  private static secondsToTimeString(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
   * Validate video file integrity
   */
  static async validateVideo(filePath: string): Promise<boolean> {
    try {
      const metadata = await this.getVideoMetadata(filePath);
      return !!(metadata.duration && metadata.width && metadata.height);
    } catch {
      return false;
    }
  }

  /**
   * Get video compression recommendations based on file size and duration
   */
  static getCompressionRecommendation(fileSizeBytes: number, durationSeconds: number): VideoProcessingOptions {
    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    const bitrateKbps = (fileSizeMB * 8 * 1024) / durationSeconds;

    if (bitrateKbps > 5000 || fileSizeMB > 500) {
      return {
        quality: 'medium',
        compression: 'best',
        format: 'mp4',
        width: 1280,
        height: 720
      };
    } else if (bitrateKbps > 2000 || fileSizeMB > 100) {
      return {
        quality: 'medium',
        compression: 'balanced',
        format: 'mp4'
      };
    } else {
      return {
        quality: 'high',
        compression: 'fast',
        format: 'mp4'
      };
    }
  }
}
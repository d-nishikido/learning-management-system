import { Request, Response, NextFunction } from 'express';
import { optimizeFile, validateOptimizedFile, cleanupOptimizedFiles, trackOptimizationStats, getOptimizationStats } from '../fileOptimization';
import { ImageProcessingService } from '../../services/imageProcessingService';
import { VideoProcessingService } from '../../services/videoProcessingService';

// Mock the processing services
jest.mock('../../services/imageProcessingService');
jest.mock('../../services/videoProcessingService');

describe('FileOptimization Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      file: {
        path: '/test/image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
        originalname: 'test-image.jpg'
      } as Express.Multer.File,
      body: {}
    };
    mockResponse = {};
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('optimizeFile middleware', () => {
    it('should skip optimization if no file is uploaded', async () => {
      mockRequest.file = undefined;
      const middleware = optimizeFile();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(ImageProcessingService.processImage).not.toHaveBeenCalled();
    });

    it('should optimize image files', async () => {
      const mockProcessResult = {
        optimizedPath: '/test/image_optimized.webp',
        thumbnailPath: '/test/image_thumbnail.webp',
        originalSize: 1024000,
        optimizedSize: 512000,
        compressionRatio: 50,
        dimensions: { width: 1920, height: 1080 }
      };

      (ImageProcessingService.processImage as jest.Mock).mockResolvedValue(mockProcessResult);

      const middleware = optimizeFile({
        images: { 
          enabled: true, 
          quality: 85, 
          maxWidth: 1920, 
          maxHeight: 1080,
          generateThumbnail: true,
          thumbnailSize: 300,
          convertToWebP: true
        }
      });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ImageProcessingService.processImage).toHaveBeenCalledWith(
        '/test/image.jpg',
        expect.objectContaining({
          width: 1920,
          height: 1080,
          quality: 85
        })
      );

      expect(mockRequest.body.optimizedFilePath).toBe('/test/image_optimized.webp');
      expect(mockRequest.body.thumbnailPath).toBe('/test/image_thumbnail.webp');
      expect(mockRequest.body.compressionRatio).toBe(50);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should optimize video files', async () => {
      mockRequest.file!.mimetype = 'video/mp4';
      mockRequest.file!.path = '/test/video.mp4';

      const mockProcessResult = {
        optimizedPath: '/test/video_optimized.mp4',
        thumbnailPath: '/test/video_thumbnail.jpg',
        originalSize: 5120000,
        optimizedSize: 2560000,
        compressionRatio: 50,
        dimensions: { width: 1280, height: 720 },
        duration: 120,
        metadata: { duration: 120, bitrate: 1000 }
      };

      (VideoProcessingService.processVideo as jest.Mock).mockResolvedValue(mockProcessResult);

      const middleware = optimizeFile({
        videos: { 
          enabled: true, 
          quality: 'medium', 
          maxWidth: 1280, 
          maxHeight: 720,
          generateThumbnail: true,
          compression: 'balanced',
          format: 'mp4'
        }
      });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(VideoProcessingService.processVideo).toHaveBeenCalledWith(
        '/test/video.mp4',
        expect.objectContaining({
          width: 1280,
          height: 720,
          quality: 'medium'
        })
      );

      expect(mockRequest.body.optimizedFilePath).toBe('/test/video_optimized.mp4');
      expect(mockRequest.body.thumbnailPath).toBe('/test/video_thumbnail.jpg');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should skip optimization for non-media files', async () => {
      mockRequest.file!.mimetype = 'application/pdf';
      mockRequest.file!.path = '/test/document.pdf';

      const middleware = optimizeFile();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ImageProcessingService.processImage).not.toHaveBeenCalled();
      expect(VideoProcessingService.processVideo).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue with original file if optimization fails', async () => {
      (ImageProcessingService.processImage as jest.Mock).mockRejectedValue(
        new Error('Optimization failed')
      );

      const middleware = optimizeFile();

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body.optimizedFilePath).toBeUndefined();
    });

    it('should skip optimization when disabled', async () => {
      const middleware = optimizeFile({
        images: { 
          enabled: false,
          quality: 80,
          maxWidth: 1920,
          maxHeight: 1080,
          generateThumbnail: true,
          thumbnailSize: 300,
          convertToWebP: true
        }
      });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ImageProcessingService.processImage).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('validateOptimizedFile middleware', () => {
    it('should skip validation if no optimized file', async () => {
      await validateOptimizedFile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate optimized image file', async () => {
      mockRequest.body.optimizedFilePath = '/test/image_optimized.webp';
      (ImageProcessingService.validateImage as jest.Mock).mockResolvedValue(true);

      await validateOptimizedFile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(ImageProcessingService.validateImage).toHaveBeenCalledWith('/test/image_optimized.webp');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate optimized video file', async () => {
      mockRequest.file!.mimetype = 'video/mp4';
      mockRequest.body.optimizedFilePath = '/test/video_optimized.mp4';
      (VideoProcessingService.validateVideo as jest.Mock).mockResolvedValue(true);

      await validateOptimizedFile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(VideoProcessingService.validateVideo).toHaveBeenCalledWith('/test/video_optimized.mp4');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw error if validation fails', async () => {
      mockRequest.body.optimizedFilePath = '/test/image_optimized.webp';
      (ImageProcessingService.validateImage as jest.Mock).mockResolvedValue(false);

      await validateOptimizedFile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('trackOptimizationStats middleware', () => {
    it('should track optimization statistics', () => {
      mockRequest.body = {
        optimizedFilePath: '/test/image_optimized.webp',
        originalFileSize: 1024000,
        optimizedFileSize: 512000
      };

      trackOptimizationStats(mockRequest as Request, mockResponse as Response, mockNext);

      const stats = getOptimizationStats();
      expect(stats.totalFiles).toBeGreaterThan(0);
      expect(stats.totalOriginalSize).toBeGreaterThan(0);
      expect(stats.totalOptimizedSize).toBeGreaterThan(0);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should skip tracking if no optimization data', () => {
      trackOptimizationStats(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('cleanupOptimizedFiles middleware', () => {
    it('should cleanup optimized files on error', () => {
      const mockError = new Error('Test error');
      mockRequest.body = {
        optimizedFilePath: '/test/image_optimized.webp',
        originalFilePath: '/test/image.jpg',
        thumbnailPath: '/test/image_thumbnail.webp'
      };

      cleanupOptimizedFiles(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should not cleanup if optimized path same as original', () => {
      const mockError = new Error('Test error');
      mockRequest.body = {
        optimizedFilePath: '/test/image.jpg',
        originalFilePath: '/test/image.jpg'
      };

      cleanupOptimizedFiles(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getOptimizationStats', () => {
    it('should return current optimization statistics', () => {
      const stats = getOptimizationStats();

      expect(stats).toHaveProperty('totalFiles');
      expect(stats).toHaveProperty('totalOriginalSize');
      expect(stats).toHaveProperty('totalOptimizedSize');
      expect(stats).toHaveProperty('averageCompressionRatio');
      expect(stats).toHaveProperty('imageCount');
      expect(stats).toHaveProperty('videoCount');
    });
  });
});
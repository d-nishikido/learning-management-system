import { ImageProcessingService } from '../imageProcessingService';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

// Mock Sharp to avoid actual image processing in tests
jest.mock('sharp', () => {
  const mockSharp = {
    metadata: jest.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'jpeg'
    }),
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(undefined)
  };
  
  return jest.fn(() => mockSharp);
});

describe('ImageProcessingService', () => {
  const testImagePath = path.join(__dirname, '../../../test-files/test-image.jpg');
  const outputDir = path.join(__dirname, '../../../test-output');

  beforeAll(async () => {
    // Create test directories
    await fs.mkdir(path.dirname(testImagePath), { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    
    // Create a dummy test file
    await fs.writeFile(testImagePath, Buffer.from('fake-image-data'));
  });

  afterAll(async () => {
    // Cleanup test files
    try {
      await fs.rmdir(path.dirname(testImagePath), { recursive: true });
      await fs.rmdir(outputDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('isImage', () => {
    it('should return true for supported image formats', () => {
      expect(ImageProcessingService.isImage('test.jpg')).toBe(true);
      expect(ImageProcessingService.isImage('test.png')).toBe(true);
      expect(ImageProcessingService.isImage('test.gif')).toBe(true);
      expect(ImageProcessingService.isImage('test.webp')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(ImageProcessingService.isImage('test.txt')).toBe(false);
      expect(ImageProcessingService.isImage('test.pdf')).toBe(false);
      expect(ImageProcessingService.isImage('test.mp4')).toBe(false);
    });
  });

  describe('getImageMetadata', () => {
    it('should return image metadata', async () => {
      const metadata = await ImageProcessingService.getImageMetadata(testImagePath);
      
      expect(metadata).toBeDefined();
      expect(metadata.width).toBe(1920);
      expect(metadata.height).toBe(1080);
      expect(metadata.format).toBe('jpeg');
    });

    it('should throw error for invalid image', async () => {
      const mockSharp = sharp as jest.MockedFunction<typeof sharp>;
      mockSharp.mockImplementationOnce(() => {
        throw new Error('Invalid image');
      });

      await expect(ImageProcessingService.getImageMetadata('invalid.jpg'))
        .rejects.toThrow('Failed to read image metadata');
    });
  });

  describe('processImage', () => {
    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
      
      // Mock fs.stat for file size
      jest.spyOn(fs, 'stat').mockResolvedValue({
        size: 1024000 // 1MB
      } as any);
    });

    it('should process image with default options', async () => {
      const result = await ImageProcessingService.processImage(testImagePath);
      
      expect(result).toBeDefined();
      expect(result.optimizedPath).toContain('_optimized.webp');
      expect(result.originalSize).toBe(1024000);
      expect(result.dimensions).toBeDefined();
    });

    it('should process image with custom options', async () => {
      const options = {
        width: 800,
        height: 600,
        quality: 90,
        format: 'jpeg' as const,
        generateThumbnail: false
      };

      const result = await ImageProcessingService.processImage(testImagePath, options);
      
      expect(result).toBeDefined();
      expect(result.optimizedPath).toContain('_optimized.jpeg');
      expect(result.thumbnailPath).toBeUndefined();
    });

    it('should generate thumbnail when requested', async () => {
      const options = {
        generateThumbnail: true,
        thumbnailSize: 200
      };

      const result = await ImageProcessingService.processImage(testImagePath, options);
      
      expect(result.thumbnailPath).toBeDefined();
      expect(result.thumbnailPath).toContain('_thumbnail.webp');
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail with default size', async () => {
      const thumbnailPath = await ImageProcessingService.generateThumbnail(testImagePath);
      
      expect(thumbnailPath).toContain('_thumbnail.webp');
    });

    it('should generate thumbnail with custom size', async () => {
      const thumbnailPath = await ImageProcessingService.generateThumbnail(testImagePath, 150);
      
      expect(thumbnailPath).toContain('_thumbnail.webp');
    });
  });

  describe('convertToWebP', () => {
    it('should convert image to WebP format', async () => {
      const webpPath = await ImageProcessingService.convertToWebP(testImagePath);
      
      expect(webpPath).toContain('.webp');
    });

    it('should convert with custom quality', async () => {
      const webpPath = await ImageProcessingService.convertToWebP(testImagePath, 95);
      
      expect(webpPath).toContain('.webp');
    });
  });

  describe('validateImage', () => {
    it('should return true for valid image', async () => {
      const isValid = await ImageProcessingService.validateImage(testImagePath);
      
      expect(isValid).toBe(true);
    });

    it('should return false for invalid image', async () => {
      const mockSharp = sharp as jest.MockedFunction<typeof sharp>;
      mockSharp.mockImplementationOnce(() => {
        throw new Error('Invalid image');
      });

      const isValid = await ImageProcessingService.validateImage('invalid.jpg');
      
      expect(isValid).toBe(false);
    });
  });

  describe('batchProcessImages', () => {
    it('should process multiple images', async () => {
      const inputPaths = [testImagePath, testImagePath];
      const results = await ImageProcessingService.batchProcessImages(inputPaths);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
    });

    it('should continue processing even if one image fails', async () => {
      // For this test, we'll just test that it doesn't throw and handles errors gracefully
      jest.spyOn(ImageProcessingService, 'processImage')
        .mockRejectedValueOnce(new Error('Failed to process'))
        .mockResolvedValueOnce({
          optimizedPath: 'test_optimized.webp',
          originalSize: 1024000,
          optimizedSize: 512000,
          compressionRatio: 50,
          dimensions: { width: 1920, height: 1080 }
        });

      const inputPaths = ['invalid.jpg', testImagePath];
      const results = await ImageProcessingService.batchProcessImages(inputPaths);
      
      expect(results).toHaveLength(1); // Only successful processing
    });
  });

  describe('cleanup', () => {
    it('should clean up files without errors', async () => {
      const filesToCleanup = [testImagePath];
      
      // Mock successful unlink
      jest.spyOn(fs, 'unlink').mockResolvedValue();
      
      await expect(ImageProcessingService.cleanup(filesToCleanup))
        .resolves.not.toThrow();
    });

    it('should handle cleanup errors gracefully', async () => {
      const filesToCleanup = ['nonexistent.jpg'];
      
      // Mock failed unlink
      jest.spyOn(fs, 'unlink').mockRejectedValue(new Error('File not found'));
      
      await expect(ImageProcessingService.cleanup(filesToCleanup))
        .resolves.not.toThrow();
    });
  });
});
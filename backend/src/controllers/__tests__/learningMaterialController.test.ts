import { Request, Response, NextFunction } from 'express';
import { LearningMaterialController } from '../learningMaterialController';
import { LearningMaterialService } from '../../services/learningMaterialService';
import { ValidationError } from '../../utils/errors';

// Mock the service
jest.mock('../../services/learningMaterialService');

const mockLearningMaterialService = LearningMaterialService as jest.Mocked<typeof LearningMaterialService>;

interface MockRequest extends Partial<Request> {
  user?: { id: number; role: string };
}

describe('LearningMaterialController', () => {
  let mockRequest: MockRequest;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: { id: 1, role: 'ADMIN' },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      sendFile: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getLearningMaterialsByLesson', () => {
    it('should get learning materials successfully', async () => {
      const mockResult = {
        materials: [
          {
            id: 1,
            title: 'Test Material',
            materialType: 'URL',
            lesson: {
              id: 1,
              title: 'Test Lesson',
              course: { id: 1, title: 'Test Course' },
            },
          },
        ] as any,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockRequest.params = { lessonId: '1' };
      mockLearningMaterialService.getLearningMaterialsByLesson.mockResolvedValue(mockResult);

      await LearningMaterialController.getLearningMaterialsByLesson(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockLearningMaterialService.getLearningMaterialsByLesson).toHaveBeenCalledWith(
        1,
        {},
        true
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Learning materials retrieved successfully',
        data: mockResult,
      });
    });

    it('should call next with error when service throws', async () => {
      const error = new Error('Service error');
      mockRequest.params = { lessonId: '1' };
      mockLearningMaterialService.getLearningMaterialsByLesson.mockRejectedValue(error);

      await LearningMaterialController.getLearningMaterialsByLesson(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getLearningMaterialById', () => {
    it('should get learning material by ID successfully', async () => {
      const mockMaterial = {
        id: 1,
        title: 'Test Material',
        materialType: 'URL',
        lesson: {
          id: 1,
          title: 'Test Lesson',
          course: { id: 1, title: 'Test Course' },
        },
      };

      mockRequest.params = { lessonId: '1', id: '1' };
      mockLearningMaterialService.getLearningMaterialById.mockResolvedValue(mockMaterial as any);

      await LearningMaterialController.getLearningMaterialById(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockLearningMaterialService.getLearningMaterialById).toHaveBeenCalledWith(1, 1, true);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Learning material retrieved successfully',
        data: mockMaterial,
      });
    });
  });

  describe('createLearningMaterial', () => {
    it('should create learning material successfully', async () => {
      const mockMaterial = {
        id: 1,
        title: 'Test Material',
        materialType: 'URL',
        externalUrl: 'https://example.com',
        lesson: {
          id: 1,
          title: 'Test Lesson',
          course: { id: 1, title: 'Test Course' },
        },
      };

      mockRequest.params = { lessonId: '1' };
      mockRequest.body = {
        title: 'Test Material',
        materialType: 'URL',
        externalUrl: 'https://example.com',
      };
      mockLearningMaterialService.createLearningMaterial.mockResolvedValue(mockMaterial as any);

      await LearningMaterialController.createLearningMaterial(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockLearningMaterialService.createLearningMaterial).toHaveBeenCalledWith({
        lessonId: 1,
        title: 'Test Material',
        materialType: 'URL',
        externalUrl: 'https://example.com',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Learning material created successfully',
        data: mockMaterial,
      });
    });
  });

  describe('uploadLearningMaterial', () => {
    it('should upload learning material successfully', async () => {
      const mockMaterial = {
        id: 1,
        title: 'Test File Material',
        materialType: 'FILE',
        filePath: '/path/to/file.pdf',
        lesson: {
          id: 1,
          title: 'Test Lesson',
          course: { id: 1, title: 'Test Course' },
        },
      };

      mockRequest.params = { lessonId: '1' };
      mockRequest.body = {
        title: 'Test File Material',
        filePath: '/path/to/file.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
      };
      mockRequest.file = {
        filename: 'test.pdf',
        path: '/path/to/file.pdf',
        size: 1024,
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      mockLearningMaterialService.createLearningMaterial.mockResolvedValue(mockMaterial as any);

      await LearningMaterialController.uploadLearningMaterial(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockLearningMaterialService.createLearningMaterial).toHaveBeenCalledWith({
        lessonId: 1,
        materialType: 'FILE',
        title: 'Test File Material',
        materialCategory: 'MAIN',
        filePath: '/path/to/file.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        allowManualProgress: false,
        isPublished: false,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Learning material uploaded successfully',
        data: mockMaterial,
      });
    });

    it('should throw ValidationError when no file uploaded', async () => {
      mockRequest.params = { lessonId: '1' };
      mockRequest.file = undefined;

      await LearningMaterialController.uploadLearningMaterial(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('updateLearningMaterial', () => {
    it('should update learning material successfully', async () => {
      const mockMaterial = {
        id: 1,
        title: 'Updated Material',
        materialType: 'URL',
        lesson: {
          id: 1,
          title: 'Test Lesson',
          course: { id: 1, title: 'Test Course' },
        },
      };

      mockRequest.params = { lessonId: '1', id: '1' };
      mockRequest.body = { title: 'Updated Material' };
      mockLearningMaterialService.updateLearningMaterial.mockResolvedValue(mockMaterial as any);

      await LearningMaterialController.updateLearningMaterial(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockLearningMaterialService.updateLearningMaterial).toHaveBeenCalledWith(
        1,
        1,
        { title: 'Updated Material' }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Learning material updated successfully',
        data: mockMaterial,
      });
    });
  });

  describe('deleteLearningMaterial', () => {
    it('should delete learning material successfully', async () => {
      mockRequest.params = { lessonId: '1', id: '1' };
      mockLearningMaterialService.deleteLearningMaterial.mockResolvedValue(undefined);

      await LearningMaterialController.deleteLearningMaterial(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockLearningMaterialService.deleteLearningMaterial).toHaveBeenCalledWith(1, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Learning material deleted successfully',
        data: null,
      });
    });
  });

  describe('downloadLearningMaterial', () => {
    it('should download file material successfully', async () => {
      const mockMaterial = {
        id: 1,
        title: 'Test File',
        materialType: 'FILE',
        filePath: '/path/to/file.pdf',
        fileType: 'application/pdf',
        lesson: {
          id: 1,
          title: 'Test Lesson',
          course: { id: 1, title: 'Test Course' },
        },
      };

      mockRequest.params = { lessonId: '1', id: '1' };
      mockLearningMaterialService.getLearningMaterialById.mockResolvedValue(mockMaterial as any);

      const mockSendFile = jest.fn((_path, callback) => {
        callback(null); // Simulate successful file send
      });
      mockResponse.sendFile = mockSendFile;

      await LearningMaterialController.downloadLearningMaterial(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="Test File"');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockSendFile).toHaveBeenCalledWith('/path/to/file.pdf', expect.any(Function));
    });

    it('should throw ValidationError for non-file material', async () => {
      const mockMaterial = {
        id: 1,
        title: 'Test URL',
        materialType: 'URL',
        externalUrl: 'https://example.com',
        lesson: {
          id: 1,
          title: 'Test Lesson',
          course: { id: 1, title: 'Test Course' },
        },
      };

      mockRequest.params = { lessonId: '1', id: '1' };
      mockLearningMaterialService.getLearningMaterialById.mockResolvedValue(mockMaterial as any);

      await LearningMaterialController.downloadLearningMaterial(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });
});
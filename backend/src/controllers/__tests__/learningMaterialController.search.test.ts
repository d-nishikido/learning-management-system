import { Request, Response, NextFunction } from 'express';
import { LearningMaterialController } from '../learningMaterialController';
import { LearningMaterialService } from '../../services/learningMaterialService';
import { RequestWithUser } from '../../types';

// Mock the service
jest.mock('../../services/learningMaterialService');

const mockLearningMaterialService = LearningMaterialService as jest.Mocked<typeof LearningMaterialService>;

describe('LearningMaterialController.searchLearningMaterials', () => {
  let mockRequest: Partial<RequestWithUser>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      query: {},
      user: {
        id: 1,
        role: 'USER',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  it('should search learning materials successfully', async () => {
    const mockSearchResult = {
      materials: [
        {
          id: 1,
          title: 'Test Material',
          description: 'Test description',
          lesson: {
            id: 1,
            title: 'Test Lesson',
            course: { id: 1, title: 'Test Course' },
          },
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    mockLearningMaterialService.searchLearningMaterials.mockResolvedValue(mockSearchResult);

    mockRequest.query = {
      search: 'test',
      page: '1',
      limit: '10',
    };

    await LearningMaterialController.searchLearningMaterials(
      mockRequest as RequestWithUser,
      mockResponse as Response,
      mockNext
    );

    expect(mockLearningMaterialService.searchLearningMaterials).toHaveBeenCalledWith(
      {
        search: 'test',
        page: '1',
        limit: '10',
      },
      false, // includeUnpublished for regular user
      1 // userId
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Learning materials retrieved successfully',
      data: mockSearchResult,
    });
  });

  it('should allow admin users to see unpublished materials', async () => {
    const mockSearchResult = {
      materials: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };

    mockLearningMaterialService.searchLearningMaterials.mockResolvedValue(mockSearchResult);

    mockRequest.user!.role = 'ADMIN';
    mockRequest.query = { search: 'test' };

    await LearningMaterialController.searchLearningMaterials(
      mockRequest as RequestWithUser,
      mockResponse as Response,
      mockNext
    );

    expect(mockLearningMaterialService.searchLearningMaterials).toHaveBeenCalledWith(
      { search: 'test' },
      true, // includeUnpublished for admin user
      1 // userId
    );
  });

  it('should handle search without user (guest)', async () => {
    const mockSearchResult = {
      materials: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };

    mockLearningMaterialService.searchLearningMaterials.mockResolvedValue(mockSearchResult);

    mockRequest.user = undefined;
    mockRequest.query = { search: 'test' };

    await LearningMaterialController.searchLearningMaterials(
      mockRequest as RequestWithUser,
      mockResponse as Response,
      mockNext
    );

    expect(mockLearningMaterialService.searchLearningMaterials).toHaveBeenCalledWith(
      { search: 'test' },
      false, // includeUnpublished = false for guest
      undefined // userId = undefined for guest
    );
  });

  it('should pass through all query parameters', async () => {
    const mockSearchResult = {
      materials: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };

    mockLearningMaterialService.searchLearningMaterials.mockResolvedValue(mockSearchResult);

    mockRequest.query = {
      search: 'javascript',
      materialType: 'FILE',
      materialCategory: 'MAIN',
      isPublished: 'true',
      page: '2',
      limit: '20',
    };

    await LearningMaterialController.searchLearningMaterials(
      mockRequest as RequestWithUser,
      mockResponse as Response,
      mockNext
    );

    expect(mockLearningMaterialService.searchLearningMaterials).toHaveBeenCalledWith(
      {
        search: 'javascript',
        materialType: 'FILE',
        materialCategory: 'MAIN',
        isPublished: 'true',
        page: '2',
        limit: '20',
      },
      false,
      1
    );
  });

  it('should handle service errors', async () => {
    const mockError = new Error('Database error');
    mockLearningMaterialService.searchLearningMaterials.mockRejectedValue(mockError);

    mockRequest.query = { search: 'test' };

    await LearningMaterialController.searchLearningMaterials(
      mockRequest as RequestWithUser,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(mockError);
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('should handle empty query parameters', async () => {
    const mockSearchResult = {
      materials: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };

    mockLearningMaterialService.searchLearningMaterials.mockResolvedValue(mockSearchResult);

    mockRequest.query = {};

    await LearningMaterialController.searchLearningMaterials(
      mockRequest as RequestWithUser,
      mockResponse as Response,
      mockNext
    );

    expect(mockLearningMaterialService.searchLearningMaterials).toHaveBeenCalledWith(
      {},
      false,
      1
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Learning materials retrieved successfully',
      data: mockSearchResult,
    });
  });
});
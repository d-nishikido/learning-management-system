import { Request, Response } from 'express';
import { LessonController } from '../lessonController';
import { LessonService } from '../../services/lessonService';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { RequestWithUser } from '../../types';

// Mock LessonService
jest.mock('../../services/lessonService');
const mockLessonService = LessonService as jest.Mocked<typeof LessonService>;

describe('LessonController', () => {
  let mockReq: Partial<RequestWithUser>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      user: { id: 1, role: 'ADMIN', username: 'admin', email: 'admin@test.com', firstName: 'Admin', lastName: 'User', isActive: true },
      body: {},
      params: {},
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createLesson', () => {
    const mockLessonData = {
      title: 'Test Lesson',
      description: 'Test Description',
      content: 'Test Content',
      estimatedMinutes: 30,
      isPublished: false,
    };

    const mockCreatedLesson = {
      id: 1,
      courseId: 1,
      ...mockLessonData,
      sortOrder: 1,
      course: { id: 1, title: 'Test Course', isPublished: true },
      _count: { learningMaterials: 0, userProgress: 0 },
    };

    it('should create lesson successfully', async () => {
      mockReq.params = { courseId: '1' };
      mockReq.body = mockLessonData;
      mockLessonService.createLesson.mockResolvedValue(mockCreatedLesson as any);

      await LessonController.createLesson(
        mockReq as RequestWithUser<{ courseId: string }>,
        mockRes as Response
      );

      expect(mockLessonService.createLesson).toHaveBeenCalledWith({
        courseId: 1,
        ...mockLessonData,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedLesson,
        message: 'Lesson created successfully',
      });
    });

    it('should return 400 for invalid course ID', async () => {
      mockReq.params = { courseId: 'invalid' };
      mockReq.body = mockLessonData;

      await LessonController.createLesson(
        mockReq as RequestWithUser<{ courseId: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid course ID',
      });
    });

    it('should return 404 when course not found', async () => {
      mockReq.params = { courseId: '1' };
      mockReq.body = mockLessonData;
      mockLessonService.createLesson.mockRejectedValue(new NotFoundError('Course not found'));

      await LessonController.createLesson(
        mockReq as RequestWithUser<{ courseId: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Course not found',
      });
    });

    it('should return 409 when lesson title conflicts', async () => {
      mockReq.params = { courseId: '1' };
      mockReq.body = mockLessonData;
      mockLessonService.createLesson.mockRejectedValue(
        new ConflictError('A lesson with this title already exists in this course')
      );

      await LessonController.createLesson(
        mockReq as RequestWithUser<{ courseId: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'A lesson with this title already exists in this course',
      });
    });
  });

  describe('getLessonsByCourse', () => {
    const mockLessonsResult = {
      lessons: [
        {
          id: 1,
          courseId: 1,
          title: 'Lesson 1',
          sortOrder: 1,
          isPublished: true,
          course: { id: 1, title: 'Test Course', isPublished: true },
          _count: { learningMaterials: 0, userProgress: 0 },
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    it('should get lessons successfully', async () => {
      mockReq.params = { courseId: '1' };
      mockReq.query = { page: '1', limit: '10' };
      mockLessonService.getLessonsByCourse.mockResolvedValue(mockLessonsResult as any);

      await LessonController.getLessonsByCourse(
        mockReq as Request<{ courseId: string }>,
        mockRes as Response
      );

      expect(mockLessonService.getLessonsByCourse).toHaveBeenCalledWith(
        1,
        { page: 1, limit: 10 },
        true // includeUnpublished for admin
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockLessonsResult,
        message: 'Lessons retrieved successfully',
      });
    });

    it('should return 400 for invalid course ID', async () => {
      mockReq.params = { courseId: 'invalid' };

      await LessonController.getLessonsByCourse(
        mockReq as Request<{ courseId: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid course ID',
      });
    });

    it('should filter by query parameters', async () => {
      mockReq.params = { courseId: '1' };
      mockReq.query = { isPublished: 'true', search: 'test' };
      mockLessonService.getLessonsByCourse.mockResolvedValue(mockLessonsResult as any);

      await LessonController.getLessonsByCourse(
        mockReq as Request<{ courseId: string }>,
        mockRes as Response
      );

      expect(mockLessonService.getLessonsByCourse).toHaveBeenCalledWith(
        1,
        { isPublished: true, search: 'test' },
        true
      );
    });

    it('should not include unpublished for non-admin users', async () => {
      mockReq.user = { id: 1, role: 'USER', username: 'user', email: 'user@test.com', firstName: 'User', lastName: 'Test', isActive: true };
      mockReq.params = { courseId: '1' };
      mockLessonService.getLessonsByCourse.mockResolvedValue(mockLessonsResult as any);

      await LessonController.getLessonsByCourse(
        mockReq as Request<{ courseId: string }>,
        mockRes as Response
      );

      expect(mockLessonService.getLessonsByCourse).toHaveBeenCalledWith(
        1,
        {},
        false // includeUnpublished for regular user
      );
    });
  });

  describe('getLessonById', () => {
    const mockLesson = {
      id: 1,
      courseId: 1,
      title: 'Test Lesson',
      description: 'Test Description',
      content: 'Test Content',
      course: { id: 1, title: 'Test Course', isPublished: true },
      learningMaterials: [],
      _count: { learningMaterials: 0, userProgress: 0 },
    };

    it('should get lesson by ID successfully', async () => {
      mockReq.params = { courseId: '1', id: '1' };
      mockLessonService.getLessonById.mockResolvedValue(mockLesson as any);

      await LessonController.getLessonById(
        mockReq as Request<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockLessonService.getLessonById).toHaveBeenCalledWith(1, 1, true);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockLesson,
        message: 'Lesson retrieved successfully',
      });
    });

    it('should return 400 for invalid course ID', async () => {
      mockReq.params = { courseId: 'invalid', id: '1' };

      await LessonController.getLessonById(
        mockReq as Request<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid course ID',
      });
    });

    it('should return 400 for invalid lesson ID', async () => {
      mockReq.params = { courseId: '1', id: 'invalid' };

      await LessonController.getLessonById(
        mockReq as Request<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid lesson ID',
      });
    });

    it('should return 404 when lesson not found', async () => {
      mockReq.params = { courseId: '1', id: '1' };
      mockLessonService.getLessonById.mockRejectedValue(new NotFoundError('Lesson not found'));

      await LessonController.getLessonById(
        mockReq as Request<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Lesson not found',
      });
    });
  });

  describe('updateLesson', () => {
    const mockUpdateData = {
      title: 'Updated Lesson',
      description: 'Updated Description',
    };

    const mockUpdatedLesson = {
      id: 1,
      courseId: 1,
      ...mockUpdateData,
      course: { id: 1, title: 'Test Course', isPublished: true },
      learningMaterials: [],
      _count: { learningMaterials: 0, userProgress: 0 },
    };

    it('should update lesson successfully', async () => {
      mockReq.params = { courseId: '1', id: '1' };
      mockReq.body = mockUpdateData;
      mockLessonService.updateLesson.mockResolvedValue(mockUpdatedLesson as any);

      await LessonController.updateLesson(
        mockReq as RequestWithUser<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockLessonService.updateLesson).toHaveBeenCalledWith(1, 1, mockUpdateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedLesson,
        message: 'Lesson updated successfully',
      });
    });

    it('should return 400 for invalid course ID', async () => {
      mockReq.params = { courseId: 'invalid', id: '1' };

      await LessonController.updateLesson(
        mockReq as RequestWithUser<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid course ID',
      });
    });

    it('should return 404 when lesson not found', async () => {
      mockReq.params = { courseId: '1', id: '1' };
      mockReq.body = mockUpdateData;
      mockLessonService.updateLesson.mockRejectedValue(new NotFoundError('Lesson not found'));

      await LessonController.updateLesson(
        mockReq as RequestWithUser<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Lesson not found',
      });
    });
  });

  describe('deleteLesson', () => {
    it('should delete lesson successfully', async () => {
      mockReq.params = { courseId: '1', id: '1' };
      mockLessonService.deleteLesson.mockResolvedValue();

      await LessonController.deleteLesson(
        mockReq as RequestWithUser<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockLessonService.deleteLesson).toHaveBeenCalledWith(1, 1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Lesson deleted successfully',
      });
    });

    it('should return 400 for invalid course ID', async () => {
      mockReq.params = { courseId: 'invalid', id: '1' };

      await LessonController.deleteLesson(
        mockReq as RequestWithUser<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid course ID',
      });
    });

    it('should return 409 when lesson has dependencies', async () => {
      mockReq.params = { courseId: '1', id: '1' };
      mockLessonService.deleteLesson.mockRejectedValue(
        new ConflictError('Cannot delete lesson with user progress')
      );

      await LessonController.deleteLesson(
        mockReq as RequestWithUser<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot delete lesson with user progress',
      });
    });
  });

  describe('updateLessonOrder', () => {
    const mockUpdatedLesson = {
      id: 1,
      courseId: 1,
      title: 'Test Lesson',
      sortOrder: 3,
      course: { id: 1, title: 'Test Course', isPublished: true },
      learningMaterials: [],
      _count: { learningMaterials: 0, userProgress: 0 },
    };

    it('should update lesson order successfully', async () => {
      mockReq.params = { courseId: '1', id: '1' };
      mockReq.body = { sortOrder: 3 };
      mockLessonService.updateLessonOrder.mockResolvedValue(mockUpdatedLesson as any);

      await LessonController.updateLessonOrder(
        mockReq as RequestWithUser<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockLessonService.updateLessonOrder).toHaveBeenCalledWith(1, 1, 3);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedLesson,
        message: 'Lesson order updated successfully',
      });
    });

    it('should return 400 for invalid sort order', async () => {
      mockReq.params = { courseId: '1', id: '1' };
      mockReq.body = { sortOrder: 0 };

      await LessonController.updateLessonOrder(
        mockReq as RequestWithUser<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Sort order must be a positive number',
      });
    });

    it('should return 400 for non-numeric sort order', async () => {
      mockReq.params = { courseId: '1', id: '1' };
      mockReq.body = { sortOrder: 'invalid' };

      await LessonController.updateLessonOrder(
        mockReq as RequestWithUser<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Sort order must be a positive number',
      });
    });

    it('should return 404 when lesson not found', async () => {
      mockReq.params = { courseId: '1', id: '1' };
      mockReq.body = { sortOrder: 3 };
      mockLessonService.updateLessonOrder.mockRejectedValue(new NotFoundError('Lesson not found'));

      await LessonController.updateLessonOrder(
        mockReq as RequestWithUser<{ courseId: string; id: string }>,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Lesson not found',
      });
    });
  });
});
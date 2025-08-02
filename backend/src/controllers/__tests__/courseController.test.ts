import { Request, Response } from 'express';
import { CourseController } from '../courseController';
import { CourseService } from '../../services/courseService';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { RequestWithUser } from '../../types';

// Mock CourseService
jest.mock('../../services/courseService');
const mockCourseService = CourseService as jest.Mocked<typeof CourseService>;

describe('CourseController', () => {
  let mockReq: Partial<RequestWithUser>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      user: { id: 1, role: 'ADMIN' },
      body: {},
      params: {},
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createCourse', () => {
    const mockCourseData = {
      title: 'Test Course',
      description: 'Test Description',
      category: 'Programming',
      difficultyLevel: 'BEGINNER' as const,
    };

    const mockCreatedCourse = {
      id: 1,
      ...mockCourseData,
      creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
      _count: { lessons: 0, userProgress: 0 },
    };

    it('should create course successfully', async () => {
      mockReq.body = mockCourseData;
      mockCourseService.createCourse.mockResolvedValue(mockCreatedCourse as any);

      await CourseController.createCourse(
        mockReq as RequestWithUser,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedCourse,
        message: 'Course created successfully',
      });
    });

    it('should handle ConflictError', async () => {
      mockReq.body = mockCourseData;
      mockCourseService.createCourse.mockRejectedValue(new ConflictError('Course already exists'));

      await CourseController.createCourse(
        mockReq as RequestWithUser,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Course already exists',
      });
    });

    it('should handle NotFoundError', async () => {
      mockReq.body = mockCourseData;
      mockCourseService.createCourse.mockRejectedValue(new NotFoundError('Creator not found'));

      await CourseController.createCourse(
        mockReq as RequestWithUser,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Creator not found',
      });
    });
  });

  describe('getAllCourses', () => {
    const mockCoursesResponse = {
      courses: [
        { id: 1, title: 'Course 1', creator: { id: 1, username: 'user1', firstName: 'User', lastName: 'One' } },
        { id: 2, title: 'Course 2', creator: { id: 1, username: 'user1', firstName: 'User', lastName: 'One' } },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    it('should get all courses successfully', async () => {
      mockCourseService.getAllCourses.mockResolvedValue(mockCoursesResponse as any);

      await CourseController.getAllCourses(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCoursesResponse,
        message: 'Courses retrieved successfully',
      });
    });

    it('should include unpublished courses for admin users', async () => {
      mockReq.user = { id: 1, role: 'ADMIN' };
      mockCourseService.getAllCourses.mockResolvedValue(mockCoursesResponse as any);

      await CourseController.getAllCourses(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockCourseService.getAllCourses).toHaveBeenCalledWith({}, true);
    });

    it('should exclude unpublished courses for regular users', async () => {
      mockReq.user = { id: 1, role: 'USER' };
      mockCourseService.getAllCourses.mockResolvedValue(mockCoursesResponse as any);

      await CourseController.getAllCourses(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockCourseService.getAllCourses).toHaveBeenCalledWith({}, false);
    });

    it('should handle query parameters', async () => {
      mockReq.query = {
        category: 'Programming',
        difficultyLevel: 'BEGINNER',
        search: 'test',
        page: '2',
        limit: '5',
      };
      mockCourseService.getAllCourses.mockResolvedValue(mockCoursesResponse as any);

      await CourseController.getAllCourses(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockCourseService.getAllCourses).toHaveBeenCalledWith({
        category: 'Programming',
        difficultyLevel: 'BEGINNER',
        search: 'test',
        page: 2,
        limit: 5,
      }, false);
    });
  });

  describe('getCourseById', () => {
    const mockCourse = {
      id: 1,
      title: 'Test Course',
      creator: { id: 1, username: 'user1', firstName: 'User', lastName: 'One' },
      lessons: [],
      _count: { lessons: 0, userProgress: 0 },
    };

    it('should get course by id successfully', async () => {
      mockReq.params = { id: '1' };
      mockCourseService.getCourseById.mockResolvedValue(mockCourse as any);

      await CourseController.getCourseById(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCourse,
        message: 'Course retrieved successfully',
      });
    });

    it('should handle invalid course ID', async () => {
      mockReq.params = { id: 'invalid' };

      await CourseController.getCourseById(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid course ID',
      });
    });

    it('should handle NotFoundError', async () => {
      mockReq.params = { id: '999' };
      mockCourseService.getCourseById.mockRejectedValue(new NotFoundError('Course not found'));

      await CourseController.getCourseById(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Course not found',
      });
    });
  });

  describe('updateCourse', () => {
    const mockUpdateData = {
      title: 'Updated Course',
      description: 'Updated Description',
    };

    const mockUpdatedCourse = {
      id: 1,
      ...mockUpdateData,
      creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
    };

    it('should update course successfully', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = mockUpdateData;
      mockCourseService.updateCourse.mockResolvedValue(mockUpdatedCourse as any);

      await CourseController.updateCourse(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedCourse,
        message: 'Course updated successfully',
      });
    });

    it('should handle invalid course ID', async () => {
      mockReq.params = { id: 'invalid' };

      await CourseController.updateCourse(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle NotFoundError', async () => {
      mockReq.params = { id: '999' };
      mockReq.body = mockUpdateData;
      mockCourseService.updateCourse.mockRejectedValue(new NotFoundError('Course not found'));

      await CourseController.updateCourse(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteCourse', () => {
    it('should delete course successfully', async () => {
      mockReq.params = { id: '1' };
      mockCourseService.deleteCourse.mockResolvedValue();

      await CourseController.deleteCourse(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Course deleted successfully',
      });
    });

    it('should handle ConflictError', async () => {
      mockReq.params = { id: '1' };
      mockCourseService.deleteCourse.mockRejectedValue(
        new ConflictError('Cannot delete course with enrolled users')
      );

      await CourseController.deleteCourse(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
  });

  describe('enrollInCourse', () => {
    const mockProgress = {
      id: 1,
      userId: 1,
      courseId: 1,
      progressPercentage: 0,
      status: 'NOT_STARTED',
    };

    it('should enroll in course successfully', async () => {
      mockReq.params = { id: '1' };
      mockCourseService.enrollInCourse.mockResolvedValue(mockProgress as any);

      await CourseController.enrollInCourse(
        mockReq as RequestWithUser,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProgress,
        message: 'Successfully enrolled in course',
      });
    });

    it('should handle ConflictError for already enrolled user', async () => {
      mockReq.params = { id: '1' };
      mockCourseService.enrollInCourse.mockRejectedValue(
        new ConflictError('User is already enrolled in this course')
      );

      await CourseController.enrollInCourse(
        mockReq as RequestWithUser,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
  });

  describe('unenrollFromCourse', () => {
    it('should unenroll from course successfully', async () => {
      mockReq.params = { id: '1' };
      mockCourseService.unenrollFromCourse.mockResolvedValue();

      await CourseController.unenrollFromCourse(
        mockReq as RequestWithUser,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully unenrolled from course',
      });
    });

    it('should handle NotFoundError for not enrolled user', async () => {
      mockReq.params = { id: '1' };
      mockCourseService.unenrollFromCourse.mockRejectedValue(
        new NotFoundError('User is not enrolled in this course')
      );

      await CourseController.unenrollFromCourse(
        mockReq as RequestWithUser,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
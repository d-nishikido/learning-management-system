import { LessonService } from '../lessonService';
import { NotFoundError } from '../../utils/errors';

// Mock the entire module
jest.mock('@prisma/client', () => {
  const mockLessonFunctions = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };

  const mockCourseFunctions = {
    findUnique: jest.fn(),
  };

  const mockUserProgressFunctions = {
    findFirst: jest.fn(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      lesson: mockLessonFunctions,
      course: mockCourseFunctions,
      userProgress: mockUserProgressFunctions,
    })),
  };
});

// Get the mocked prisma instance for testing
const { PrismaClient } = require('@prisma/client');
const mockPrisma = new PrismaClient();
const mockLessonFunctions = mockPrisma.lesson;
const mockCourseFunctions = mockPrisma.course;

describe('LessonService - Visibility Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCourse = { id: 2, title: 'Advanced React Patterns' };
  const mockLessons = [
    {
      id: 4,
      courseId: 2,
      title: 'Compound Components',
      sortOrder: 1,
      isPublished: true,
      course: mockCourse,
      _count: { learningMaterials: 0, userProgress: 0 },
    },
    {
      id: 5,
      courseId: 2,
      title: 'Render Props Pattern',
      sortOrder: 2,
      isPublished: true,
      course: mockCourse,
      _count: { learningMaterials: 0, userProgress: 0 },
    },
  ];

  describe('getLessonsByCourse - Visibility Fix', () => {
    it('should allow anonymous users to see published lessons (GitHub Issue #140 fix)', async () => {
      mockCourseFunctions.findUnique.mockResolvedValue(mockCourse);
      mockLessonFunctions.count.mockResolvedValue(2);
      mockLessonFunctions.findMany.mockResolvedValue(mockLessons);

      // Anonymous user (no userId, no userRole)
      const result = await LessonService.getLessonsByCourse(2, { page: 1, limit: 10 });

      expect(result).toEqual({
        lessons: mockLessons,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      // Verify that the query only shows published lessons
      expect(mockLessonFunctions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            courseId: 2,
            isPublished: true,
          }),
        })
      );
    });

    it('should allow non-enrolled users to see published lessons (GitHub Issue #140 fix)', async () => {
      mockCourseFunctions.findUnique.mockResolvedValue(mockCourse);
      mockLessonFunctions.count.mockResolvedValue(2);
      mockLessonFunctions.findMany.mockResolvedValue(mockLessons);

      // Non-enrolled user with USER role
      const result = await LessonService.getLessonsByCourse(2, { page: 1, limit: 10 }, 123, 'USER');

      expect(result).toEqual({
        lessons: mockLessons,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      // Verify that the query only shows published lessons
      expect(mockLessonFunctions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            courseId: 2,
            isPublished: true,
          }),
        })
      );
    });

    it('should allow admin users to see all lessons including unpublished', async () => {
      mockCourseFunctions.findUnique.mockResolvedValue(mockCourse);
      mockLessonFunctions.count.mockResolvedValue(2);
      mockLessonFunctions.findMany.mockResolvedValue(mockLessons);

      // Admin user
      const result = await LessonService.getLessonsByCourse(2, { page: 1, limit: 10 }, 456, 'ADMIN');

      expect(result).toEqual({
        lessons: mockLessons,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      // Verify that admin can see all lessons (no isPublished filter)
      expect(mockLessonFunctions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            courseId: 2,
            // Should not have isPublished filter for admin
          }),
        })
      );
      
      // Ensure isPublished filter is NOT applied for admin
      const whereClause = mockLessonFunctions.findMany.mock.calls[0][0].where;
      expect(whereClause.isPublished).toBeUndefined();
    });

    it('should throw NotFoundError if course does not exist', async () => {
      mockCourseFunctions.findUnique.mockResolvedValue(null);

      await expect(LessonService.getLessonsByCourse(999, {})).rejects.toThrow(
        new NotFoundError('Course not found')
      );
    });
  });
});
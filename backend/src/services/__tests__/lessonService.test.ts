import { LessonService, CreateLessonData, UpdateLessonData } from '../lessonService';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { PrismaClient } from '@prisma/client';

// Create mock functions
const mockLessonFunctions = {
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  updateMany: jest.fn(),
};

const mockCourseFunctions = {
  findUnique: jest.fn(),
};

const mockUserProgressFunctions = {
  findFirst: jest.fn(),
};

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    lesson: mockLessonFunctions,
    course: mockCourseFunctions,
    userProgress: mockUserProgressFunctions,
  })),
}));

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('LessonService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLesson', () => {
    const mockLessonData: CreateLessonData = {
      courseId: 1,
      title: 'Test Lesson',
      description: 'Test Description',
      content: 'Test Content',
      estimatedMinutes: 30,
      isPublished: false,
    };

    const mockCourse = {
      id: 1,
      title: 'Test Course',
      isPublished: true,
    };

    const mockCreatedLesson = {
      id: 1,
      courseId: 1,
      title: 'Test Lesson',
      description: 'Test Description',
      content: 'Test Content',
      estimatedMinutes: 30,
      sortOrder: 1,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      course: mockCourse,
      _count: {
        learningMaterials: 0,
        userProgress: 0,
      },
    };

    it('should create a lesson successfully', async () => {
      mockCourseFunctions.findUnique.mockResolvedValue(mockCourse);
      mockLessonFunctions.findFirst.mockResolvedValue(null); // No existing lesson
      mockLessonFunctions.findFirst.mockResolvedValueOnce(null); // No last lesson
      mockLessonFunctions.create.mockResolvedValue(mockCreatedLesson);

      const result = await LessonService.createLesson(mockLessonData);

      expect(result).toEqual(mockCreatedLesson);
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.lesson.create).toHaveBeenCalledWith({
        data: {
          courseId: 1,
          title: 'Test Lesson',
          description: 'Test Description',
          content: 'Test Content',
          estimatedMinutes: 30,
          sortOrder: 1,
          isPublished: false,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              isPublished: true,
            },
          },
          _count: {
            select: {
              learningMaterials: true,
              userProgress: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundError if course does not exist', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(LessonService.createLesson(mockLessonData)).rejects.toThrow(
        new NotFoundError('Course not found')
      );
    });

    it('should throw ConflictError if lesson with same title already exists', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue({ id: 2, title: 'Test Lesson' });

      await expect(LessonService.createLesson(mockLessonData)).rejects.toThrow(
        new ConflictError('A lesson with this title already exists in this course')
      );
    });

    it('should set sortOrder to next available if not provided', async () => {
      const lastLesson = { id: 2, sortOrder: 5 };
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValueOnce(null); // No existing lesson with same title
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValueOnce(lastLesson); // Last lesson exists
      (mockPrisma.lesson.create as jest.Mock).mockResolvedValue(mockCreatedLesson);

      await LessonService.createLesson(mockLessonData);

      expect(mockPrisma.lesson.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sortOrder: 6, // lastLesson.sortOrder + 1
          }),
        })
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
      estimatedMinutes: 30,
      sortOrder: 1,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      course: {
        id: 1,
        title: 'Test Course',
        isPublished: true,
      },
      learningMaterials: [],
      _count: {
        learningMaterials: 0,
        userProgress: 0,
      },
    };

    it('should get lesson by ID successfully', async () => {
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue(mockLesson);

      const result = await LessonService.getLessonById(1, 1, false);

      expect(result).toEqual(mockLesson);
      expect(mockPrisma.lesson.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          courseId: 1,
          isPublished: true,
          course: {
            isPublished: true,
          },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              isPublished: true,
            },
          },
          learningMaterials: {
            select: {
              id: true,
              title: true,
              materialType: true,
              sortOrder: true,
              isPublished: true,
            },
            where: { isPublished: true },
            orderBy: {
              sortOrder: 'asc',
            },
          },
          _count: {
            select: {
              learningMaterials: true,
              userProgress: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundError if lesson does not exist', async () => {
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(LessonService.getLessonById(1, 1, false)).rejects.toThrow(
        new NotFoundError('Lesson not found')
      );
    });

    it('should include unpublished content when includeUnpublished is true', async () => {
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue(mockLesson);

      await LessonService.getLessonById(1, 1, true);

      expect(mockPrisma.lesson.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          courseId: 1,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              isPublished: true,
            },
          },
          learningMaterials: {
            select: {
              id: true,
              title: true,
              materialType: true,
              sortOrder: true,
              isPublished: true,
            },
            where: {},
            orderBy: {
              sortOrder: 'asc',
            },
          },
          _count: {
            select: {
              learningMaterials: true,
              userProgress: true,
            },
          },
        },
      });
    });
  });

  describe('getLessonsByCourse', () => {
    const mockCourse = { id: 1, title: 'Test Course' };
    const mockLessons = [
      {
        id: 1,
        courseId: 1,
        title: 'Lesson 1',
        sortOrder: 1,
        isPublished: true,
        course: mockCourse,
        _count: { learningMaterials: 0, userProgress: 0 },
      },
      {
        id: 2,
        courseId: 1,
        title: 'Lesson 2',
        sortOrder: 2,
        isPublished: true,
        course: mockCourse,
        _count: { learningMaterials: 0, userProgress: 0 },
      },
    ];

    it('should get lessons for a course successfully for anonymous users', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (mockPrisma.lesson.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);

      const result = await LessonService.getLessonsByCourse(1, { page: 1, limit: 10 });

      expect(result).toEqual({
        lessons: mockLessons,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            courseId: 1,
            isPublished: true, // Anonymous users should only see published lessons
          }),
        })
      );
    });

    it('should allow non-enrolled users to see published lessons', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (mockPrisma.lesson.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);

      // Non-enrolled user (has userId but not admin role)
      const result = await LessonService.getLessonsByCourse(1, { page: 1, limit: 10 }, 123, 'USER');

      expect(result).toEqual({
        lessons: mockLessons,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      
      // Should filter for published lessons only
      expect(mockPrisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            courseId: 1,
            isPublished: true, // Non-enrolled users should see published lessons
          }),
        })
      );
    });

    it('should allow admin users to see all lessons including unpublished', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (mockPrisma.lesson.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);

      // Admin user
      const result = await LessonService.getLessonsByCourse(1, { page: 1, limit: 10 }, 456, 'ADMIN');

      expect(result).toEqual({
        lessons: mockLessons,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      
      // Should not filter by isPublished for admin
      expect(mockPrisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            courseId: 1,
            // Should not have isPublished filter for admin
          }),
        })
      );
    });

    it('should throw NotFoundError if course does not exist', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(LessonService.getLessonsByCourse(1, {})).rejects.toThrow(
        new NotFoundError('Course not found')
      );
    });

    it('should filter lessons by search term', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (mockPrisma.lesson.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.lesson.findMany as jest.Mock).mockResolvedValue([mockLessons[0]]);

      await LessonService.getLessonsByCourse(1, { search: 'test' });

      expect(mockPrisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              {
                title: {
                  contains: 'test',
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: 'test',
                  mode: 'insensitive',
                },
              },
              {
                content: {
                  contains: 'test',
                  mode: 'insensitive',
                },
              },
            ],
          }),
        })
      );
    });
  });

  describe('updateLesson', () => {
    const mockExistingLesson = {
      id: 1,
      courseId: 1,
      title: 'Original Title',
      sortOrder: 1,
    };

    const mockUpdatedLesson = {
      id: 1,
      courseId: 1,
      title: 'Updated Title',
      description: 'Updated Description',
      sortOrder: 1,
      isPublished: true,
      course: {
        id: 1,
        title: 'Test Course',
        isPublished: true,
      },
      learningMaterials: [],
      _count: {
        learningMaterials: 0,
        userProgress: 0,
      },
    };

    it('should update lesson successfully', async () => {
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue(mockExistingLesson);
      (mockPrisma.lesson.update as jest.Mock).mockResolvedValue(mockUpdatedLesson);

      const updateData: UpdateLessonData = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const result = await LessonService.updateLesson(1, 1, updateData);

      expect(result).toEqual(mockUpdatedLesson);
      expect(mockPrisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              isPublished: true,
            },
          },
          learningMaterials: {
            select: {
              id: true,
              title: true,
              materialType: true,
              sortOrder: true,
              isPublished: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
          _count: {
            select: {
              learningMaterials: true,
              userProgress: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundError if lesson does not exist', async () => {
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(LessonService.updateLesson(1, 1, { title: 'New Title' })).rejects.toThrow(
        new NotFoundError('Lesson not found')
      );
    });

    it('should throw ConflictError if title conflicts with existing lesson', async () => {
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValueOnce(mockExistingLesson);
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValueOnce({ id: 2, title: 'Conflicting Title' });

      await expect(LessonService.updateLesson(1, 1, { title: 'Conflicting Title' })).rejects.toThrow(
        new ConflictError('A lesson with this title already exists in this course')
      );
    });
  });

  describe('deleteLesson', () => {
    const mockLesson = {
      id: 1,
      courseId: 1,
      sortOrder: 2,
      _count: {
        userProgress: 0,
        learningMaterials: 0,
      },
    };

    it('should delete lesson successfully', async () => {
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue(mockLesson);
      (mockPrisma.lesson.delete as jest.Mock).mockResolvedValue(undefined);
      (mockPrisma.lesson.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await LessonService.deleteLesson(1, 1);

      expect(mockPrisma.lesson.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.lesson.updateMany).toHaveBeenCalledWith({
        where: {
          courseId: 1,
          sortOrder: { gt: 2 },
        },
        data: {
          sortOrder: { decrement: 1 },
        },
      });
    });

    it('should throw NotFoundError if lesson does not exist', async () => {
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(LessonService.deleteLesson(1, 1)).rejects.toThrow(
        new NotFoundError('Lesson not found')
      );
    });

    it('should throw ConflictError if lesson has user progress', async () => {
      const lessonWithProgress = {
        ...mockLesson,
        _count: { userProgress: 1, learningMaterials: 0 },
      };
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue(lessonWithProgress);

      await expect(LessonService.deleteLesson(1, 1)).rejects.toThrow(
        new ConflictError('Cannot delete lesson with user progress')
      );
    });

    it('should throw ConflictError if lesson has learning materials', async () => {
      const lessonWithMaterials = {
        ...mockLesson,
        _count: { userProgress: 0, learningMaterials: 1 },
      };
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue(lessonWithMaterials);

      await expect(LessonService.deleteLesson(1, 1)).rejects.toThrow(
        new ConflictError('Cannot delete lesson with learning materials')
      );
    });
  });

  describe('updateLessonOrder', () => {
    const mockLesson = {
      id: 1,
      courseId: 1,
      sortOrder: 2,
    };

    const mockUpdatedLesson = {
      id: 1,
      courseId: 1,
      title: 'Test Lesson',
      sortOrder: 4,
      course: {
        id: 1,
        title: 'Test Course',
        isPublished: true,
      },
      learningMaterials: [],
      _count: {
        learningMaterials: 0,
        userProgress: 0,
      },
    };

    it('should update lesson order successfully', async () => {
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue(mockLesson);
      (mockPrisma.lesson.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
      (mockPrisma.lesson.update as jest.Mock).mockResolvedValue(mockUpdatedLesson);

      const result = await LessonService.updateLessonOrder(1, 1, 4);

      expect(result).toEqual(mockUpdatedLesson);
      expect(mockPrisma.lesson.updateMany).toHaveBeenCalledWith({
        where: {
          courseId: 1,
          id: { not: 1 },
          sortOrder: { gt: 2, lte: 4 },
        },
        data: {
          sortOrder: { decrement: 1 },
        },
      });
      expect(mockPrisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { sortOrder: 4 },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundError if lesson does not exist', async () => {
      (mockPrisma.lesson.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(LessonService.updateLessonOrder(1, 1, 4)).rejects.toThrow(
        new NotFoundError('Lesson not found')
      );
    });
  });
});
import { CourseService, CreateCourseData, UpdateCourseData, CourseQuery } from '../courseService';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    course: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    userProgress: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('CourseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCourse', () => {
    const mockCourseData: CreateCourseData = {
      title: 'Test Course',
      description: 'Test Description',
      category: 'Programming',
      difficultyLevel: 'BEGINNER',
      estimatedHours: 10,
      createdBy: 1,
    };

    const mockCreatedCourse = {
      id: 1,
      title: 'Test Course',
      description: 'Test Description',
      category: 'Programming',
      difficultyLevel: 'BEGINNER',
      estimatedHours: 10,
      thumbnailUrl: null,
      isPublished: false,
      sortOrder: 0,
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      creator: {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      },
      _count: {
        lessons: 0,
        userProgress: 0,
      },
    };

    it('should create a course successfully', async () => {
      (mockPrisma.course.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (mockPrisma.course.create as jest.Mock).mockResolvedValue(mockCreatedCourse);

      const result = await CourseService.createCourse(mockCourseData);

      expect(result).toEqual(mockCreatedCourse);
      expect(mockPrisma.course.findFirst).toHaveBeenCalledWith({
        where: { title: mockCourseData.title },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockCourseData.createdBy },
      });
    });

    it('should throw ConflictError if course title already exists', async () => {
      (mockPrisma.course.findFirst as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(CourseService.createCourse(mockCourseData)).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError if creator does not exist', async () => {
      (mockPrisma.course.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(CourseService.createCourse(mockCourseData)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCourseById', () => {
    const mockCourse = {
      id: 1,
      title: 'Test Course',
      description: 'Test Description',
      category: 'Programming',
      difficultyLevel: 'BEGINNER',
      isPublished: true,
      creator: {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      },
      lessons: [],
      _count: {
        lessons: 0,
        userProgress: 0,
      },
    };

    it('should get course by id successfully', async () => {
      (mockPrisma.course.findFirst as jest.Mock).mockResolvedValue(mockCourse);

      const result = await CourseService.getCourseById(1);

      expect(result).toEqual(mockCourse);
      expect(mockPrisma.course.findFirst).toHaveBeenCalledWith({
        where: { id: 1, isPublished: true },
        include: expect.any(Object),
      });
    });

    it('should include unpublished courses when flag is set', async () => {
      (mockPrisma.course.findFirst as jest.Mock).mockResolvedValue(mockCourse);

      await CourseService.getCourseById(1, true);

      expect(mockPrisma.course.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundError if course does not exist', async () => {
      (mockPrisma.course.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(CourseService.getCourseById(1)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAllCourses', () => {
    const mockCourses = [
      {
        id: 1,
        title: 'Course 1',
        creator: { id: 1, username: 'user1', firstName: 'User', lastName: 'One' },
        _count: { lessons: 0, userProgress: 0 },
      },
      {
        id: 2,
        title: 'Course 2',
        creator: { id: 1, username: 'user1', firstName: 'User', lastName: 'One' },
        _count: { lessons: 0, userProgress: 0 },
      },
    ];

    it('should get all courses with default pagination', async () => {
      (mockPrisma.course.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

      const result = await CourseService.getAllCourses();

      expect(result).toEqual({
        courses: mockCourses,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const query: CourseQuery = {
        category: 'Programming',
        difficultyLevel: 'BEGINNER',
        isPublished: true,
        search: 'test',
      };

      (mockPrisma.course.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.course.findMany as jest.Mock).mockResolvedValue([mockCourses[0]]);

      await CourseService.getAllCourses(query);

      expect(mockPrisma.course.count).toHaveBeenCalledWith({
        where: {
          category: 'Programming',
          difficultyLevel: 'BEGINNER',
          isPublished: true,
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ],
        },
      });
    });
  });

  describe('updateCourse', () => {
    const mockUpdateData: UpdateCourseData = {
      title: 'Updated Course',
      description: 'Updated Description',
    };

    const mockUpdatedCourse = {
      id: 1,
      title: 'Updated Course',
      description: 'Updated Description',
      creator: {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      },
      lessons: [],
      _count: {
        lessons: 0,
        userProgress: 0,
      },
    };

    it('should update course successfully', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue({ id: 1, title: 'Old Title' });
      (mockPrisma.course.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.course.update as jest.Mock).mockResolvedValue(mockUpdatedCourse);

      const result = await CourseService.updateCourse(1, mockUpdateData);

      expect(result).toEqual(mockUpdatedCourse);
    });

    it('should throw NotFoundError if course does not exist', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(CourseService.updateCourse(1, mockUpdateData)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if title conflicts with another course', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue({ id: 1, title: 'Old Title' });
      (mockPrisma.course.findFirst as jest.Mock).mockResolvedValue({ id: 2, title: 'Updated Course' });

      await expect(CourseService.updateCourse(1, mockUpdateData)).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteCourse', () => {
    it('should delete course successfully', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        _count: { userProgress: 0 },
      });
      (mockPrisma.course.delete as jest.Mock).mockResolvedValue({});

      await CourseService.deleteCourse(1);

      expect(mockPrisma.course.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundError if course does not exist', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(CourseService.deleteCourse(1)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if course has enrolled users', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        _count: { userProgress: 5 },
      });

      await expect(CourseService.deleteCourse(1)).rejects.toThrow(ConflictError);
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

    it('should enroll user in course successfully', async () => {
      (mockPrisma.course.findFirst as jest.Mock).mockResolvedValue({ id: 1, isPublished: true });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.userProgress.create as jest.Mock).mockResolvedValue(mockProgress);

      const result = await CourseService.enrollInCourse(1, 1);

      expect(result).toEqual(mockProgress);
    });

    it('should throw NotFoundError if course is not published', async () => {
      (mockPrisma.course.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(CourseService.enrollInCourse(1, 1)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if user is already enrolled', async () => {
      (mockPrisma.course.findFirst as jest.Mock).mockResolvedValue({ id: 1, isPublished: true });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(CourseService.enrollInCourse(1, 1)).rejects.toThrow(ConflictError);
    });
  });

  describe('unenrollFromCourse', () => {
    it('should unenroll user from course successfully', async () => {
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
      (mockPrisma.userProgress.delete as jest.Mock).mockResolvedValue({});

      await CourseService.unenrollFromCourse(1, 1);

      expect(mockPrisma.userProgress.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundError if user is not enrolled', async () => {
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(CourseService.unenrollFromCourse(1, 1)).rejects.toThrow(NotFoundError);
    });
  });
});
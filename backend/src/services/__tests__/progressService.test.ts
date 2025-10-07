import { ProgressService, CreateProgressData, UpdateProgressData, ProgressQuery } from '../progressService';
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors';
import { PrismaClient, ProgressType } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    userProgress: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      upsert: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    learningMaterial: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    learningStreak: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    progressHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
  })),
}));

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('ProgressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUserProgress', () => {
    const mockProgressData = [
      {
        id: 1,
        userId: 1,
        courseId: 1,
        lessonId: 1,
        materialId: 1,
        progressType: 'AUTO' as ProgressType,
        progressRate: 50,
        spentMinutes: 30,
        isCompleted: false,
        lastAccessed: new Date(),
        course: { id: 1, title: 'Test Course' },
        lesson: { id: 1, title: 'Test Lesson' },
        material: { id: 1, title: 'Test Material' },
      },
    ];

    it('should get all user progress with pagination', async () => {
      const query: ProgressQuery = { page: 1, limit: 20 };
      
      (mockPrisma.userProgress.findMany as jest.Mock).mockResolvedValue(mockProgressData);
      (mockPrisma.userProgress.count as jest.Mock).mockResolvedValue(1);

      const result = await ProgressService.getAllUserProgress(1, query);

      expect(result.data).toEqual(mockProgressData);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter progress by courseId', async () => {
      const query: ProgressQuery = { courseId: 1 };
      
      (mockPrisma.userProgress.findMany as jest.Mock).mockResolvedValue(mockProgressData);
      (mockPrisma.userProgress.count as jest.Mock).mockResolvedValue(1);

      await ProgressService.getAllUserProgress(1, query);

      expect(mockPrisma.userProgress.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
            courseId: 1,
          }),
        })
      );
    });
  });

  describe('createProgress', () => {
    const mockCourseData = { id: 1, title: 'Test Course' };
    const mockLessonData = { id: 1, title: 'Test Lesson', courseId: 1 };
    const mockMaterialData = { 
      id: 1, 
      title: 'Test Material', 
      lessonId: 1,
      lesson: mockLessonData 
    };

    it('should create new progress record successfully', async () => {
      const progressData: CreateProgressData = {
        userId: 1,
        courseId: 1,
        lessonId: 1,
        materialId: 1,
        progressType: 'AUTO',
        progressRate: 50,
        spentMinutes: 30,
      };

      const mockCreatedProgress = {
        id: 1,
        ...progressData,
        isCompleted: false,
        course: mockCourseData,
        lesson: mockLessonData,
        material: mockMaterialData,
      };

      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourseData);
      (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLessonData);
      (mockPrisma.learningMaterial.findUnique as jest.Mock).mockResolvedValue(mockMaterialData);
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.userProgress.create as jest.Mock).mockResolvedValue(mockCreatedProgress);

      const result = await ProgressService.createProgress(progressData);

      expect(result).toEqual(mockCreatedProgress);
      expect(mockPrisma.userProgress.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          courseId: 1,
          lessonId: 1,
          materialId: 1,
          progressType: 'AUTO',
          progressRate: 50,
          spentMinutes: 30,
          isCompleted: false,
        }),
        include: {
          course: true,
          lesson: true,
          material: true,
        },
      });
    });

    it('should throw ValidationError if course does not exist', async () => {
      const progressData: CreateProgressData = {
        userId: 1,
        courseId: 999,
        progressRate: 50,
      };

      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(ProgressService.createProgress(progressData)).rejects.toThrow(ValidationError);
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('should throw ConflictError if progress record already exists', async () => {
      const progressData: CreateProgressData = {
        userId: 1,
        courseId: 1,
        lessonId: 1,
        materialId: 1,
      };

      const existingProgress = { id: 1, userId: 1, courseId: 1 };

      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourseData);
      (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLessonData);
      (mockPrisma.learningMaterial.findUnique as jest.Mock).mockResolvedValue(mockMaterialData);
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(existingProgress);

      await expect(ProgressService.createProgress(progressData)).rejects.toThrow(ConflictError);
    });
  });

  describe('updateProgress', () => {
    it('should update progress record successfully', async () => {
      const existingProgress = {
        id: 1,
        userId: 1,
        courseId: 1,
        progressRate: 30,
        isCompleted: false,
      };

      const updateData: UpdateProgressData = {
        progressRate: 75,
        spentMinutes: 45,
      };

      const updatedProgress = {
        ...existingProgress,
        ...updateData,
        isCompleted: false,
        course: { id: 1, title: 'Test Course' },
        lesson: { id: 1, title: 'Test Lesson' },
        material: { id: 1, title: 'Test Material' },
      };

      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(existingProgress);
      (mockPrisma.userProgress.update as jest.Mock).mockResolvedValue(updatedProgress);

      const result = await ProgressService.updateProgress(1, 1, updateData);

      expect(result).toEqual(updatedProgress);
      expect(mockPrisma.userProgress.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          progressRate: 75,
          spentMinutes: 45,
          isCompleted: false,
          lastAccessed: expect.any(Date),
        }),
        include: {
          course: true,
          lesson: true,
          material: true,
        },
      });
    });

    it('should throw NotFoundError if progress record does not exist', async () => {
      const updateData: UpdateProgressData = { progressRate: 75 };

      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(ProgressService.updateProgress(999, 1, updateData)).rejects.toThrow(NotFoundError);
    });

    it('should mark as completed when progress rate reaches 100', async () => {
      const existingProgress = {
        id: 1,
        userId: 1,
        courseId: 1,
        progressRate: 30,
        isCompleted: false,
        completionDate: null,
      };

      const updateData: UpdateProgressData = { progressRate: 100 };

      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(existingProgress);
      (mockPrisma.userProgress.update as jest.Mock).mockResolvedValue({
        ...existingProgress,
        ...updateData,
        isCompleted: true,
      });

      await ProgressService.updateProgress(1, 1, updateData);

      expect(mockPrisma.userProgress.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          progressRate: 100,
          isCompleted: true,
          completionDate: expect.any(Date),
        }),
        include: {
          course: true,
          lesson: true,
          material: true,
        },
      });
    });
  });

  describe('getCourseProgress', () => {
    it('should get progress for a specific course', async () => {
      const mockCourse = { id: 1, title: 'Test Course' };
      const mockProgress = [
        {
          id: 1,
          userId: 1,
          courseId: 1,
          course: mockCourse,
          lesson: null,
          material: null,
        },
      ];

      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (mockPrisma.userProgress.findMany as jest.Mock).mockResolvedValue(mockProgress);

      const result = await ProgressService.getCourseProgress(1, 1);

      expect(result).toEqual(mockProgress);
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.userProgress.findMany).toHaveBeenCalledWith({
        where: { userId: 1, courseId: 1 },
        include: {
          course: true,
          lesson: true,
          material: true,
        },
        orderBy: [
          { lesson: { sortOrder: 'asc' } },
          { material: { sortOrder: 'asc' } },
        ],
      });
    });

    it('should throw NotFoundError if course does not exist', async () => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(ProgressService.getCourseProgress(1, 999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('markMaterialComplete', () => {
    const mockMaterial = {
      id: 1,
      title: 'Test Material',
      lessonId: 1,
      lesson: {
        id: 1,
        title: 'Test Lesson',
        courseId: 1,
      },
    };

    it('should mark material as completed for new progress', async () => {
      const mockCompletedProgress = {
        id: 1,
        userId: 1,
        courseId: 1,
        lessonId: 1,
        materialId: 1,
        progressRate: 100,
        isCompleted: true,
        completionDate: new Date(),
        course: { id: 1, title: 'Test Course' },
        lesson: { id: 1, title: 'Test Lesson' },
        material: mockMaterial,
      };

      (mockPrisma.learningMaterial.findUnique as jest.Mock).mockResolvedValue(mockMaterial);
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.userProgress.create as jest.Mock).mockResolvedValue(mockCompletedProgress);
      (mockPrisma.learningStreak.upsert as jest.Mock).mockResolvedValue({});

      const result = await ProgressService.markMaterialComplete(1, 1);

      expect(result).toEqual(mockCompletedProgress);
      expect(mockPrisma.userProgress.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          courseId: 1,
          lessonId: 1,
          materialId: 1,
          progressRate: 100,
          isCompleted: true,
          completionDate: expect.any(Date),
        },
        include: {
          course: true,
          lesson: true,
          material: true,
        },
      });
    });

    it('should throw NotFoundError if material does not exist', async () => {
      (mockPrisma.learningMaterial.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(ProgressService.markMaterialComplete(1, 999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateManualProgress with history tracking', () => {
    it('should create progress history when updating manual progress', async () => {
      const mockMaterial = {
        id: 1,
        lessonId: 1,
        allowManualProgress: true,
        lesson: {
          id: 1,
          courseId: 1,
        },
      };

      const existingProgress = {
        id: 100,
        userId: 1,
        courseId: 1,
        lessonId: 1,
        materialId: 1,
        progressType: 'MANUAL',
        progressRate: 25.0,
        spentMinutes: 15,
        isCompleted: false,
      };

      const updatedProgress = {
        ...existingProgress,
        progressRate: 50.0,
        manualProgressRate: 50.0,
        spentMinutes: 45,
      };

      (mockPrisma.learningMaterial.findUnique as jest.Mock).mockResolvedValue(mockMaterial);
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(existingProgress);
      (mockPrisma.userProgress.update as jest.Mock).mockResolvedValue(updatedProgress);
      (mockPrisma.progressHistory.create as jest.Mock).mockResolvedValue({
        id: 1,
        progressId: 100,
        progressRate: 50.0,
        spentMinutes: 30,
        changedBy: 1,
        notes: 'Progress update',
        createdAt: new Date(),
      });

      const result = await ProgressService.updateManualProgress(1, 1, 50.0, 30, 'Progress update');

      expect(mockPrisma.progressHistory.create).toHaveBeenCalledWith({
        data: {
          progressId: 100,
          progressRate: 50.0,
          spentMinutes: 30,
          changedBy: 1,
          notes: 'Progress update',
        },
      });
    });

    it('should create progress history when creating new manual progress', async () => {
      const mockMaterial = {
        id: 1,
        lessonId: 1,
        allowManualProgress: true,
        lesson: {
          id: 1,
          courseId: 1,
        },
      };

      const newProgress = {
        id: 200,
        userId: 1,
        courseId: 1,
        lessonId: 1,
        materialId: 1,
        progressType: 'MANUAL',
        progressRate: 25.0,
        manualProgressRate: 25.0,
        spentMinutes: 15,
        isCompleted: false,
      };

      (mockPrisma.learningMaterial.findUnique as jest.Mock).mockResolvedValue(mockMaterial);
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.userProgress.create as jest.Mock).mockResolvedValue(newProgress);
      (mockPrisma.progressHistory.create as jest.Mock).mockResolvedValue({
        id: 2,
        progressId: 200,
        progressRate: 25.0,
        spentMinutes: 15,
        changedBy: 1,
        notes: null,
        createdAt: new Date(),
      });

      const result = await ProgressService.updateManualProgress(1, 1, 25.0, 15);

      expect(mockPrisma.progressHistory.create).toHaveBeenCalledWith({
        data: {
          progressId: 200,
          progressRate: 25.0,
          spentMinutes: 15,
          changedBy: 1,
        },
      });
    });
  });
});
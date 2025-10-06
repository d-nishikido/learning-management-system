import { NotFoundError } from '../../utils/errors';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client before importing the service
const mockPrisma = {
  lesson: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  userProgress: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  learningMaterial: {
    findMany: jest.fn(),
  },
  learningStreak: {
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  course: {
    count: jest.fn(),
  },
} as unknown as PrismaClient;

const prisma = mockPrisma;

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Import service after mocking
import { ProgressService } from '../progressService';

describe('ProgressService - markLessonComplete', () => {
  const mockUserId = 1;
  const mockLessonId = 10;
  const mockCourseId = 5;

  const mockLesson = {
    id: mockLessonId,
    courseId: mockCourseId,
    title: 'Test Lesson',
    estimatedMinutes: 60,
    course: {
      id: mockCourseId,
      title: 'Test Course',
    },
  };

  const mockMaterials = [
    { id: 101, lessonId: mockLessonId, title: 'Material 1' },
    { id: 102, lessonId: mockLessonId, title: 'Material 2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mark a lesson as complete successfully when no previous progress exists', async () => {
    // Setup
    (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);
    (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.learningMaterial.findMany as jest.Mock).mockResolvedValue(mockMaterials);
    
    const expectedProgress = {
      id: 1,
      userId: mockUserId,
      courseId: mockCourseId,
      lessonId: mockLessonId,
      materialId: null,
      progressRate: 100,
      isCompleted: true,
      completionDate: expect.any(Date),
      course: { id: mockCourseId },
      lesson: mockLesson,
      material: null,
    };
    
    (mockPrisma.userProgress.create as jest.Mock).mockResolvedValue(expectedProgress);

    // Mock updateCourseProgress dependencies
    (mockPrisma.lesson.findMany as jest.Mock).mockResolvedValue([mockLesson]);
    (mockPrisma.userProgress.findMany as jest.Mock).mockResolvedValue([expectedProgress]);

    // Execute
    const result = await ProgressService.markLessonComplete(mockUserId, mockLessonId);

    // Assert
    expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
      where: { id: mockLessonId },
      include: { course: true },
    });

    expect(prisma.userProgress.create).toHaveBeenCalledWith({
      data: {
        userId: mockUserId,
        courseId: mockCourseId,
        lessonId: mockLessonId,
        materialId: null,
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

    expect(result).toEqual(expectedProgress);
  });

  it('should update existing lesson progress when already exists', async () => {
    // Setup
    const existingProgress = {
      id: 1,
      userId: mockUserId,
      courseId: mockCourseId,
      lessonId: mockLessonId,
      materialId: null,
      progressRate: 50,
      isCompleted: false,
      completionDate: null,
    };

    (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);
    (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(existingProgress);
    (mockPrisma.learningMaterial.findMany as jest.Mock).mockResolvedValue(mockMaterials);
    
    const updatedProgress = {
      ...existingProgress,
      progressRate: 100,
      isCompleted: true,
      completionDate: new Date(),
      course: { id: mockCourseId },
      lesson: mockLesson,
      material: null,
    };
    
    (mockPrisma.userProgress.update as jest.Mock).mockResolvedValue(updatedProgress);

    // Mock updateCourseProgress dependencies
    (mockPrisma.lesson.findMany as jest.Mock).mockResolvedValue([mockLesson]);
    (mockPrisma.userProgress.findMany as jest.Mock).mockResolvedValue([updatedProgress]);

    // Execute
    const result = await ProgressService.markLessonComplete(mockUserId, mockLessonId);

    // Assert
    expect(prisma.userProgress.update).toHaveBeenCalledWith({
      where: { id: existingProgress.id },
      data: {
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

    expect(result).toEqual(updatedProgress);
  });

  it('should mark all lesson materials as completed', async () => {
    // Setup
    (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);
    (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.learningMaterial.findMany as jest.Mock).mockResolvedValue(mockMaterials);
    (mockPrisma.userProgress.create as jest.Mock).mockResolvedValue({
      id: 1,
      userId: mockUserId,
      courseId: mockCourseId,
      lessonId: mockLessonId,
      materialId: null,
      progressRate: 100,
      isCompleted: true,
      completionDate: new Date(),
      course: { id: mockCourseId },
      lesson: mockLesson,
      material: null,
    });

    // Mock updateCourseProgress dependencies
    (mockPrisma.lesson.findMany as jest.Mock).mockResolvedValue([mockLesson]);
    (mockPrisma.userProgress.findMany as jest.Mock).mockResolvedValue([]);

    // Execute
    await ProgressService.markLessonComplete(mockUserId, mockLessonId);

    // Assert - verify materials were also marked as complete
    expect(prisma.learningMaterial.findMany).toHaveBeenCalledWith({
      where: { lessonId: mockLessonId },
    });

    // Should create progress records for each material
    expect(prisma.userProgress.create).toHaveBeenCalledTimes(3); // 1 for lesson + 2 for materials
  });

  it('should throw NotFoundError when lesson does not exist', async () => {
    // Setup
    (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);

    // Execute & Assert
    await expect(
      ProgressService.markLessonComplete(mockUserId, mockLessonId)
    ).rejects.toThrow(NotFoundError);
    
    expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
      where: { id: mockLessonId },
      include: { course: true },
    });
    
    expect(prisma.userProgress.create).not.toHaveBeenCalled();
    expect(prisma.userProgress.update).not.toHaveBeenCalled();
  });

  describe('markLessonIncomplete', () => {
    it('should mark a lesson as incomplete successfully', async () => {
      // Setup
      const existingProgress = {
        id: 1,
        userId: mockUserId,
        courseId: mockCourseId,
        lessonId: mockLessonId,
        materialId: null,
        progressRate: 100,
        isCompleted: true,
        completionDate: new Date(),
      };

      (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(existingProgress);

      const updatedProgress = {
        ...existingProgress,
        progressRate: 0,
        isCompleted: false,
        completionDate: null,
        course: { id: mockCourseId },
        lesson: mockLesson,
        material: null,
      };

      (mockPrisma.userProgress.update as jest.Mock).mockResolvedValue(updatedProgress);

      // Mock updateCourseProgress dependencies
      (mockPrisma.lesson.findMany as jest.Mock).mockResolvedValue([mockLesson]);
      (mockPrisma.userProgress.findMany as jest.Mock).mockResolvedValue([]);

      // Execute
      const result = await ProgressService.markLessonIncomplete(mockUserId, mockLessonId);

      // Assert
      expect(prisma.userProgress.update).toHaveBeenCalledWith({
        where: { id: existingProgress.id },
        data: {
          progressRate: 0,
          isCompleted: false,
          completionDate: null,
        },
        include: {
          course: true,
          lesson: true,
          material: true,
        },
      });

      expect(result).toEqual(updatedProgress);
    });

    it('should throw NotFoundError when lesson does not exist', async () => {
      // Setup
      (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);

      // Execute & Assert
      await expect(
        ProgressService.markLessonIncomplete(mockUserId, mockLessonId)
      ).rejects.toThrow(NotFoundError);

      expect(prisma.userProgress.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when lesson progress does not exist', async () => {
      // Setup
      (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);

      // Execute & Assert
      await expect(
        ProgressService.markLessonIncomplete(mockUserId, mockLessonId)
      ).rejects.toThrow(NotFoundError);

      expect(prisma.userProgress.update).not.toHaveBeenCalled();
    });
  });

  describe('updateCourseProgress', () => {
    it('should use default 30 minutes for lessons without estimatedMinutes', async () => {
      // Setup
      const mockLessons = [
        { id: 1, courseId: mockCourseId, estimatedMinutes: null, isPublished: true },
        { id: 2, courseId: mockCourseId, estimatedMinutes: null, isPublished: true },
      ];

      const completedLessons = [
        { id: 1, lessonId: 1, isCompleted: true },
      ];

      (mockPrisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
      (mockPrisma.userProgress.findMany as jest.Mock)
        .mockResolvedValueOnce(completedLessons) // For completed lessons query
        .mockResolvedValueOnce(null); // For course progress query

      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.userProgress.create as jest.Mock).mockResolvedValue({});

      // Execute
      await ProgressService.updateCourseProgress(mockUserId, mockCourseId);

      // Assert
      // Total duration: 30 (default) + 30 (default) = 60 minutes
      // Completed duration: 30 minutes
      // Progress: (30 / 60) * 100 = 50%
      expect(prisma.userProgress.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          courseId: mockCourseId,
          lessonId: null,
          materialId: null,
          progressRate: 50,
          isCompleted: false,
          completionDate: null,
        },
      });
    });

    it('should calculate course progress based on lesson durations', async () => {
      // Setup
      const mockLessons = [
        { id: 1, courseId: mockCourseId, estimatedMinutes: 30, isPublished: true },
        { id: 2, courseId: mockCourseId, estimatedMinutes: 45, isPublished: true },
        { id: 3, courseId: mockCourseId, estimatedMinutes: 60, isPublished: true },
      ];

      const completedLessons = [
        { id: 1, lessonId: 1, isCompleted: true },
        { id: 2, lessonId: 3, isCompleted: true },
      ];

      (mockPrisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
      (mockPrisma.userProgress.findMany as jest.Mock)
        .mockResolvedValueOnce(completedLessons) // For completed lessons query
        .mockResolvedValueOnce(null); // For course progress query
      
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.userProgress.create as jest.Mock).mockResolvedValue({});

      // Execute
      await ProgressService.updateCourseProgress(mockUserId, mockCourseId);

      // Assert
      // Total duration: 30 + 45 + 60 = 135 minutes
      // Completed duration: 30 + 60 = 90 minutes
      // Progress: (90 / 135) * 100 = 66.67 ≈ 67%
      expect(prisma.userProgress.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          courseId: mockCourseId,
          lessonId: null,
          materialId: null,
          progressRate: 67,
          isCompleted: false,
          completionDate: null,
        },
      });
    });

    it('should mark course as completed when all lessons are done', async () => {
      // Setup
      const mockLessons = [
        { id: 1, courseId: mockCourseId, estimatedMinutes: 30, isPublished: true },
        { id: 2, courseId: mockCourseId, estimatedMinutes: 45, isPublished: true },
      ];

      const completedLessons = [
        { id: 1, lessonId: 1, isCompleted: true },
        { id: 2, lessonId: 2, isCompleted: true },
      ];

      (mockPrisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
      (mockPrisma.userProgress.findMany as jest.Mock).mockResolvedValue(completedLessons);
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.userProgress.create as jest.Mock).mockResolvedValue({});

      // Execute
      await ProgressService.updateCourseProgress(mockUserId, mockCourseId);

      // Assert
      expect(prisma.userProgress.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          courseId: mockCourseId,
          lessonId: null,
          materialId: null,
          progressRate: 100,
          isCompleted: true,
          completionDate: expect.any(Date),
        },
      });
    });
  });
});
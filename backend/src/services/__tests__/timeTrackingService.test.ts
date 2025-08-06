import { TimeTrackingService } from '../timeTrackingService';
import { SessionData } from '../progressService';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { PrismaClient, AccessType } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    userMaterialAccess: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    learningMaterial: {
      findUnique: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
    userProgress: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    learningStreak: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  })),
}));

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('TimeTrackingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startSession', () => {
    const mockMaterial = { id: 1, title: 'Test Material' };
    const mockCourse = { id: 1, title: 'Test Course' };
    const mockLesson = { id: 1, title: 'Test Lesson' };

    it('should start a new learning session successfully', async () => {
      const sessionData: SessionData = {
        userId: 1,
        materialId: 1,
        courseId: 1,
        lessonId: 1,
      };

      const mockAccess = {
        id: 1,
        userId: 1,
        materialId: 1,
        accessType: 'VIEW' as AccessType,
        sessionDuration: null,
        accessedAt: new Date(),
      };

      (mockPrisma.learningMaterial.findUnique as jest.Mock).mockResolvedValue(mockMaterial);
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);
      (mockPrisma.userMaterialAccess.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.userMaterialAccess.create as jest.Mock).mockResolvedValue(mockAccess);

      const result = await TimeTrackingService.startSession(sessionData);

      expect(result).toEqual({
        id: 1,
        userId: 1,
        materialId: 1,
        courseId: 1,
        lessonId: 1,
        startTime: mockAccess.accessedAt,
        endTime: null,
        duration: 0,
        isActive: true,
      });

      expect(mockPrisma.userMaterialAccess.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          materialId: 1,
          accessType: 'VIEW',
          sessionDuration: null,
          accessedAt: expect.any(Date),
        },
      });
    });

    it('should throw ValidationError if material does not exist', async () => {
      const sessionData: SessionData = {
        userId: 1,
        materialId: 999,
      };

      (mockPrisma.learningMaterial.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(TimeTrackingService.startSession(sessionData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if course does not exist', async () => {
      const sessionData: SessionData = {
        userId: 1,
        courseId: 999,
      };

      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(TimeTrackingService.startSession(sessionData)).rejects.toThrow(ValidationError);
    });
  });

  describe('updateSession', () => {
    it('should update session duration successfully', async () => {
      const mockAccess = {
        id: 1,
        userId: 1,
        materialId: 1,
        sessionDuration: null,
        accessedAt: new Date(),
      };

      const updatedAccess = {
        ...mockAccess,
        sessionDuration: 30,
      };

      (mockPrisma.userMaterialAccess.findFirst as jest.Mock).mockResolvedValue(mockAccess);
      (mockPrisma.userMaterialAccess.update as jest.Mock).mockResolvedValue(updatedAccess);

      const result = await TimeTrackingService.updateSession(1, 1, 30);

      expect(result).toEqual({
        id: 1,
        userId: 1,
        materialId: 1,
        courseId: undefined,
        lessonId: undefined,
        startTime: mockAccess.accessedAt,
        endTime: null,
        duration: 30,
        isActive: true,
      });

      expect(mockPrisma.userMaterialAccess.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { sessionDuration: 30 },
      });
    });

    it('should throw NotFoundError if session does not exist', async () => {
      (mockPrisma.userMaterialAccess.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(TimeTrackingService.updateSession(999, 1, 30)).rejects.toThrow(NotFoundError);
    });
  });

  describe('endSession', () => {
    it('should end session and update progress successfully', async () => {
      const startTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const mockAccess = {
        id: 1,
        userId: 1,
        materialId: 1,
        sessionDuration: null,
        accessedAt: startTime,
        material: {
          id: 1,
          title: 'Test Material',
          lessonId: 1,
          lesson: {
            id: 1,
            courseId: 1,
          },
        },
      };

      const existingProgress = {
        id: 1,
        userId: 1,
        courseId: 1,
        lessonId: 1,
        materialId: 1,
        spentMinutes: 15,
      };

      const updatedAccess = {
        ...mockAccess,
        sessionDuration: 30,
      };

      (mockPrisma.userMaterialAccess.findFirst as jest.Mock).mockResolvedValue(mockAccess);
      (mockPrisma.userMaterialAccess.update as jest.Mock).mockResolvedValue(updatedAccess);
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(existingProgress);
      (mockPrisma.userProgress.update as jest.Mock).mockResolvedValue({
        ...existingProgress,
        spentMinutes: 45,
      });
      (mockPrisma.learningStreak.upsert as jest.Mock).mockResolvedValue({});

      const result = await TimeTrackingService.endSession(1, 1);

      expect(result.progressUpdated).toBe(true);
      expect(result.session.isActive).toBe(false);
      expect(result.session.duration).toBe(30);

      expect(mockPrisma.userProgress.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          spentMinutes: { increment: 30 },
          lastAccessed: expect.any(Date),
        },
      });
    });

    it('should create new progress if none exists', async () => {
      const startTime = new Date(Date.now() - 30 * 60 * 1000);
      const mockAccess = {
        id: 1,
        userId: 1,
        materialId: 1,
        sessionDuration: null,
        accessedAt: startTime,
        material: {
          id: 1,
          title: 'Test Material',
          lessonId: 1,
          lesson: {
            id: 1,
            courseId: 1,
          },
        },
      };

      (mockPrisma.userMaterialAccess.findFirst as jest.Mock).mockResolvedValue(mockAccess);
      (mockPrisma.userMaterialAccess.update as jest.Mock).mockResolvedValue({
        ...mockAccess,
        sessionDuration: 30,
      });
      (mockPrisma.userProgress.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.userProgress.create as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 1,
        courseId: 1,
        lessonId: 1,
        materialId: 1,
        spentMinutes: 30,
      });
      (mockPrisma.learningStreak.upsert as jest.Mock).mockResolvedValue({});

      const result = await TimeTrackingService.endSession(1, 1);

      expect(result.progressUpdated).toBe(true);
      expect(mockPrisma.userProgress.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          courseId: 1,
          lessonId: 1,
          materialId: 1,
          progressType: 'AUTO',
          progressRate: 0,
          spentMinutes: 30,
          lastAccessed: expect.any(Date),
        },
      });
    });
  });

  describe('getTimeStats', () => {
    it('should return time statistics for user', async () => {
      const mockStats = {
        _sum: { spentMinutes: 150 },
        _max: { spentMinutes: 60 },
      };

      const mockStreakStats = {
        currentStreak: 5,
        longestStreak: 10,
        totalStudyDays: 20,
        averageMinutesPerDay: 7.5,
        streakHistory: [],
      };

      (mockPrisma.userProgress.aggregate as jest.Mock)
        .mockResolvedValueOnce(mockStats) // totalMinutesResult
        .mockResolvedValueOnce(mockStats) // longestSessionResult
        .mockResolvedValueOnce({ _sum: { spentMinutes: 100 } }) // weeklyResult
        .mockResolvedValueOnce({ _sum: { spentMinutes: 140 } }); // monthlyResult

      (mockPrisma.userProgress.count as jest.Mock).mockResolvedValue(10);

      // Mock the getStreakStats method
      jest.spyOn(TimeTrackingService, 'getStreakStats').mockResolvedValue(mockStreakStats);

      const result = await TimeTrackingService.getTimeStats(1);

      expect(result).toEqual({
        totalMinutes: 150,
        dailyAverage: expect.any(Number),
        weeklyTotal: 100,
        monthlyTotal: 140,
        longestSession: 60,
        sessionsCount: 10,
        currentStreak: 5,
        bestStreak: 10,
      });
    });
  });

  describe('getStreakStats', () => {
    it('should calculate streak statistics correctly', async () => {
      const mockStreaks = [
        {
          userId: 1,
          streakDate: new Date('2024-01-03'),
          minutesStudied: 30,
          materialsAccessed: 2,
          lessonsCompleted: 1,
        },
        {
          userId: 1,
          streakDate: new Date('2024-01-02'),
          minutesStudied: 45,
          materialsAccessed: 3,
          lessonsCompleted: 1,
        },
        {
          userId: 1,
          streakDate: new Date('2024-01-01'),
          minutesStudied: 60,
          materialsAccessed: 4,
          lessonsCompleted: 2,
        },
      ];

      (mockPrisma.learningStreak.findMany as jest.Mock).mockResolvedValue(mockStreaks);

      const result = await TimeTrackingService.getStreakStats(1);

      expect(result.totalStudyDays).toBe(3);
      expect(result.averageMinutesPerDay).toBe(45); // (30+45+60)/3
      expect(result.streakHistory).toHaveLength(3);
      expect(result.streakHistory[0]).toEqual({
        date: '2024-01-03',
        minutesStudied: 30,
        materialsAccessed: 2,
        lessonsCompleted: 1,
      });
    });

    it('should handle empty streak data', async () => {
      (mockPrisma.learningStreak.findMany as jest.Mock).mockResolvedValue([]);

      const result = await TimeTrackingService.getStreakStats(1);

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.totalStudyDays).toBe(0);
      expect(result.averageMinutesPerDay).toBe(0);
      expect(result.streakHistory).toEqual([]);
    });
  });
});
import { 
  LearningHistoryService, 
  AccessHistoryQuery
} from '../learningHistoryService';
import { NotFoundError } from '../../utils/errors';
import { PrismaClient, AccessType } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    userMaterialAccess: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    learningMaterial: {
      findUnique: jest.fn(),
    },
    learningResource: {
      findUnique: jest.fn(),
    },
  })),
}));

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('LearningHistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccessHistory', () => {
    it('should retrieve access history with pagination', async () => {
      const mockAccessHistory = [
        {
          id: 1,
          userId: 1,
          materialId: 1,
          resourceId: null,
          accessType: 'VIEW' as AccessType,
          sessionDuration: 120,
          accessedAt: new Date(),
          user: { id: 1, username: 'testuser', email: 'test@example.com' },
          material: { id: 1, title: 'Test Material' },
          resource: null,
        },
      ];

      (mockPrisma.userMaterialAccess.findMany as jest.Mock).mockResolvedValue(mockAccessHistory);
      (mockPrisma.userMaterialAccess.count as jest.Mock).mockResolvedValue(1);

      const query: AccessHistoryQuery = { page: 1, limit: 20 };
      const result = await LearningHistoryService.getAccessHistory(1, query);

      expect(result.data).toEqual(mockAccessHistory);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(mockPrisma.userMaterialAccess.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          user: true,
          material: true,
          resource: true,
        },
        orderBy: { accessedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by materialId', async () => {
      (mockPrisma.userMaterialAccess.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.userMaterialAccess.count as jest.Mock).mockResolvedValue(0);

      const query: AccessHistoryQuery = { materialId: 1 };
      await LearningHistoryService.getAccessHistory(1, query);

      expect(mockPrisma.userMaterialAccess.findMany).toHaveBeenCalledWith({
        where: { userId: 1, materialId: 1 },
        include: {
          user: true,
          material: true,
          resource: true,
        },
        orderBy: { accessedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by date range', async () => {
      (mockPrisma.userMaterialAccess.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.userMaterialAccess.count as jest.Mock).mockResolvedValue(0);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const query: AccessHistoryQuery = { startDate, endDate };
      
      await LearningHistoryService.getAccessHistory(1, query);

      expect(mockPrisma.userMaterialAccess.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          accessedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          user: true,
          material: true,
          resource: true,
        },
        orderBy: { accessedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('getDetailedLearningHistory', () => {
    it('should calculate detailed learning history stats', async () => {
      const mockAccessRecords = [
        {
          id: 1,
          userId: 1,
          materialId: 1,
          accessedAt: new Date('2024-01-01T09:00:00Z'),
          sessionDuration: 120,
          user: { id: 1, username: 'testuser' },
          material: { id: 1, title: 'Test Material 1' },
          resource: null,
        },
        {
          id: 2,
          userId: 1,
          materialId: 2,
          accessedAt: new Date('2024-01-01T14:00:00Z'),
          sessionDuration: 180,
          user: { id: 1, username: 'testuser' },
          material: { id: 2, title: 'Test Material 2' },
          resource: null,
        },
      ];

      (mockPrisma.userMaterialAccess.findMany as jest.Mock).mockResolvedValue(mockAccessRecords);

      const result = await LearningHistoryService.getDetailedLearningHistory(1);

      expect(result.totalAccesses).toBe(2);
      expect(result.totalSessionTime).toBe(300); // 120 + 180
      expect(result.averageSessionTime).toBe(150); // 300 / 2
      expect(result.materialBreakdown).toHaveLength(2);
      expect(result.materialBreakdown[0]).toEqual({
        materialId: 1,
        materialTitle: 'Test Material 1',
        accessCount: 1,
        totalTime: 120,
      });
    });

    it('should handle empty access history', async () => {
      (mockPrisma.userMaterialAccess.findMany as jest.Mock).mockResolvedValue([]);

      const result = await LearningHistoryService.getDetailedLearningHistory(1);

      expect(result.totalAccesses).toBe(0);
      expect(result.totalSessionTime).toBe(0);
      expect(result.averageSessionTime).toBe(0);
      expect(result.materialBreakdown).toHaveLength(0);
      expect(result.recentAccesses).toHaveLength(0);
    });
  });

  describe('generateLearningStatsReport', () => {
    it('should generate comprehensive statistics report', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      const mockAccessRecords = [
        {
          id: 1,
          userId: 1,
          materialId: 1,
          accessedAt: new Date('2024-01-01T09:00:00Z'),
          sessionDuration: 120,
          accessType: 'VIEW' as AccessType,
          material: { id: 1, title: 'Test Material' },
          resource: null,
        },
        {
          id: 2,
          userId: 1,
          materialId: 2,
          accessedAt: new Date('2024-01-02T14:00:00Z'),
          sessionDuration: 180,
          accessType: 'DOWNLOAD' as AccessType,
          material: { id: 2, title: 'Test Material 2' },
          resource: null,
        },
      ];

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.userMaterialAccess.findMany as jest.Mock).mockResolvedValue(mockAccessRecords);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-03');
      
      const result = await LearningHistoryService.generateLearningStatsReport(1, startDate, endDate);

      expect(result.userId).toBe(1);
      expect(result.totalStudyTime).toBe(300);
      expect(result.totalMaterialsAccessed).toBe(2);
      expect(result.uniqueMaterialsAccessed).toBe(2);
      expect(result.longestStudySession).toBe(180);
      expect(result.shortestStudySession).toBe(120);
      expect(result.mostUsedAccessType).toBe('VIEW'); // First one in case of tie
      expect(result.dailyBreakdown).toHaveLength(2);
      expect(result.hourlyBreakdown.length).toBeGreaterThan(0);
      expect(result.weeklyBreakdown.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-03');

      await expect(
        LearningHistoryService.generateLearningStatsReport(999, startDate, endDate)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('recordMaterialAccess', () => {
    it('should record material access successfully', async () => {
      const mockMaterial = { id: 1, title: 'Test Material' };
      const mockAccess = {
        id: 1,
        userId: 1,
        materialId: 1,
        accessType: 'VIEW' as AccessType,
        sessionDuration: 120,
        accessedAt: new Date(),
      };

      (mockPrisma.learningMaterial.findUnique as jest.Mock).mockResolvedValue(mockMaterial);
      (mockPrisma.userMaterialAccess.create as jest.Mock).mockResolvedValue(mockAccess);

      const result = await LearningHistoryService.recordMaterialAccess(
        1, // userId
        1, // materialId
        'VIEW' as AccessType,
        120, // sessionDuration
        '192.168.1.1', // ipAddress
        'Mozilla/5.0' // userAgent
      );

      expect(result).toEqual(mockAccess);
      expect(mockPrisma.learningMaterial.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.userMaterialAccess.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          materialId: 1,
          accessType: 'VIEW',
          sessionDuration: 120,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          accessedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundError if material does not exist', async () => {
      (mockPrisma.learningMaterial.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        LearningHistoryService.recordMaterialAccess(1, 999, 'VIEW' as AccessType)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('recordResourceAccess', () => {
    it('should record resource access successfully', async () => {
      const mockResource = { id: 1, title: 'Test Resource' };
      const mockAccess = {
        id: 1,
        userId: 1,
        resourceId: 1,
        accessType: 'VIEW' as AccessType,
        sessionDuration: 60,
        accessedAt: new Date(),
      };

      (mockPrisma.learningResource.findUnique as jest.Mock).mockResolvedValue(mockResource);
      (mockPrisma.userMaterialAccess.create as jest.Mock).mockResolvedValue(mockAccess);

      const result = await LearningHistoryService.recordResourceAccess(
        1, // userId
        1, // resourceId
        'VIEW' as AccessType,
        60 // sessionDuration
      );

      expect(result).toEqual(mockAccess);
      expect(mockPrisma.learningResource.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.userMaterialAccess.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          resourceId: 1,
          accessType: 'VIEW',
          sessionDuration: 60,
          ipAddress: undefined,
          userAgent: undefined,
          accessedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundError if resource does not exist', async () => {
      (mockPrisma.learningResource.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        LearningHistoryService.recordResourceAccess(1, 999, 'VIEW' as AccessType)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
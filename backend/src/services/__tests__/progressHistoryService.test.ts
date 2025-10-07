import { ProgressHistoryService } from '../progressHistoryService';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    progressHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
  })),
  Decimal: jest.requireActual('@prisma/client/runtime/library').Decimal,
}));

// Prismaクライアントの型定義を拡張
interface MockPrismaClient {
  progressHistory: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    deleteMany: jest.Mock;
  };
}

const mockPrisma = new PrismaClient() as unknown as MockPrismaClient;

describe('ProgressHistoryService', () => {
  let service: ProgressHistoryService;

  beforeEach(() => {
    service = new ProgressHistoryService(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createHistory', () => {
    it('進捗履歴を正常に作成できること', async () => {
      const mockHistory = {
        id: 1,
        progressId: 100,
        progressRate: new Decimal(50.5),
        spentMinutes: 30,
        changedBy: 1,
        notes: 'Test note',
        createdAt: new Date(),
      };

      mockPrisma.progressHistory.create.mockResolvedValue(mockHistory);

      const result = await service.createHistory({
        progressId: 100,
        progressRate: 50.5,
        spentMinutes: 30,
        changedBy: 1,
        notes: 'Test note',
      });

      expect(result).toEqual(mockHistory);
      expect(mockPrisma.progressHistory.create).toHaveBeenCalledWith({
        data: {
          progressId: 100,
          progressRate: new Decimal(50.5),
          spentMinutes: 30,
          changedBy: 1,
          notes: 'Test note',
        },
      });
    });

    it('notesが未指定でも進捗履歴を作成できること', async () => {
      const mockHistory = {
        id: 2,
        progressId: 101,
        progressRate: new Decimal(75.0),
        spentMinutes: 45,
        changedBy: 2,
        notes: null,
        createdAt: new Date(),
      };

      mockPrisma.progressHistory.create.mockResolvedValue(mockHistory);

      const result = await service.createHistory({
        progressId: 101,
        progressRate: 75.0,
        spentMinutes: 45,
        changedBy: 2,
      });

      expect(result).toEqual(mockHistory);
      expect(mockPrisma.progressHistory.create).toHaveBeenCalledWith({
        data: {
          progressId: 101,
          progressRate: new Decimal(75.0),
          spentMinutes: 45,
          changedBy: 2,
        },
      });
    });

    it('進捗率が0%の履歴を作成できること', async () => {
      const mockHistory = {
        id: 3,
        progressId: 102,
        progressRate: new Decimal(0),
        spentMinutes: 0,
        changedBy: 1,
        notes: null,
        createdAt: new Date(),
      };

      mockPrisma.progressHistory.create.mockResolvedValue(mockHistory);

      const result = await service.createHistory({
        progressId: 102,
        progressRate: 0,
        spentMinutes: 0,
        changedBy: 1,
      });

      expect(result).toEqual(mockHistory);
    });

    it('進捗率が100%の履歴を作成できること', async () => {
      const mockHistory = {
        id: 4,
        progressId: 103,
        progressRate: new Decimal(100),
        spentMinutes: 120,
        changedBy: 1,
        notes: 'Completed',
        createdAt: new Date(),
      };

      mockPrisma.progressHistory.create.mockResolvedValue(mockHistory);

      const result = await service.createHistory({
        progressId: 103,
        progressRate: 100,
        spentMinutes: 120,
        changedBy: 1,
        notes: 'Completed',
      });

      expect(result).toEqual(mockHistory);
    });
  });

  describe('getHistoryByProgressId', () => {
    it('指定されたprogressIdの履歴を作成日時降順で取得できること', async () => {
      const now = new Date();
      const mockHistories = [
        {
          id: 3,
          progressId: 100,
          progressRate: new Decimal(75.0),
          spentMinutes: 60,
          changedBy: 1,
          notes: 'Latest update',
          createdAt: new Date(now.getTime() + 2000),
        },
        {
          id: 2,
          progressId: 100,
          progressRate: new Decimal(50.0),
          spentMinutes: 30,
          changedBy: 1,
          notes: 'Middle update',
          createdAt: new Date(now.getTime() + 1000),
        },
        {
          id: 1,
          progressId: 100,
          progressRate: new Decimal(25.0),
          spentMinutes: 15,
          changedBy: 1,
          notes: 'First update',
          createdAt: now,
        },
      ];

      mockPrisma.progressHistory.findMany.mockResolvedValue(mockHistories);

      const result = await service.getHistoryByProgressId(100);

      expect(result).toEqual(mockHistories);
      expect(mockPrisma.progressHistory.findMany).toHaveBeenCalledWith({
        where: { progressId: 100 },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('履歴が存在しない場合は空配列を返すこと', async () => {
      mockPrisma.progressHistory.findMany.mockResolvedValue([]);

      const result = await service.getHistoryByProgressId(999);

      expect(result).toEqual([]);
    });
  });

  describe('getHistoryByUserId', () => {
    it('指定されたユーザーの全履歴を取得できること', async () => {
      const mockHistories = [
        {
          id: 1,
          progressId: 100,
          progressRate: new Decimal(50.0),
          spentMinutes: 30,
          changedBy: 1,
          notes: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          progressId: 101,
          progressRate: new Decimal(75.0),
          spentMinutes: 45,
          changedBy: 1,
          notes: 'Good progress',
          createdAt: new Date(),
        },
      ];

      mockPrisma.progressHistory.findMany.mockResolvedValue(mockHistories);

      const result = await service.getHistoryByUserId(1);

      expect(result).toEqual(mockHistories);
      expect(mockPrisma.progressHistory.findMany).toHaveBeenCalledWith({
        where: { changedBy: 1 },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getLatestHistory', () => {
    it('指定されたprogressIdの最新履歴を取得できること', async () => {
      const mockHistory = {
        id: 5,
        progressId: 100,
        progressRate: new Decimal(90.0),
        spentMinutes: 90,
        changedBy: 1,
        notes: 'Almost done',
        createdAt: new Date(),
      };

      mockPrisma.progressHistory.findFirst.mockResolvedValue(mockHistory);

      const result = await service.getLatestHistory(100);

      expect(result).toEqual(mockHistory);
      expect(mockPrisma.progressHistory.findFirst).toHaveBeenCalledWith({
        where: { progressId: 100 },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('履歴が存在しない場合はnullを返すこと', async () => {
      mockPrisma.progressHistory.findFirst.mockResolvedValue(null);

      const result = await service.getLatestHistory(999);

      expect(result).toBeNull();
    });
  });

  describe('deleteHistoryByProgressId', () => {
    it('指定されたprogressIdの全履歴を削除できること', async () => {
      mockPrisma.progressHistory.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.deleteHistoryByProgressId(100);

      expect(result).toBe(3);
      expect(mockPrisma.progressHistory.deleteMany).toHaveBeenCalledWith({
        where: { progressId: 100 },
      });
    });

    it('削除対象が存在しない場合は0を返すこと', async () => {
      mockPrisma.progressHistory.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.deleteHistoryByProgressId(999);

      expect(result).toBe(0);
    });
  });

  describe('getHistoryByMaterialId', () => {
    it('教材IDとユーザーIDから進捗履歴を取得できること', async () => {
      const now = new Date();
      const mockHistories = [
        {
          id: 3,
          progressId: 100,
          progressRate: new Decimal(75.0),
          spentMinutes: 60,
          changedBy: 1,
          notes: 'Latest update',
          createdAt: new Date(now.getTime() + 2000),
          progress: {
            id: 100,
            userId: 1,
            materialId: 50,
          },
        },
        {
          id: 2,
          progressId: 100,
          progressRate: new Decimal(50.0),
          spentMinutes: 30,
          changedBy: 1,
          notes: 'Middle update',
          createdAt: new Date(now.getTime() + 1000),
          progress: {
            id: 100,
            userId: 1,
            materialId: 50,
          },
        },
      ];

      mockPrisma.progressHistory.findMany.mockResolvedValue(mockHistories as any);

      const result = await service.getHistoryByMaterialId(50, 1);

      expect(result).toEqual(mockHistories);
      expect(mockPrisma.progressHistory.findMany).toHaveBeenCalledWith({
        where: {
          progress: {
            materialId: 50,
            userId: 1,
          },
        },
        include: {
          progress: {
            select: {
              id: true,
              userId: true,
              materialId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('教材IDの履歴が存在しない場合は空配列を返すこと', async () => {
      mockPrisma.progressHistory.findMany.mockResolvedValue([]);

      const result = await service.getHistoryByMaterialId(999, 1);

      expect(result).toEqual([]);
    });
  });
});

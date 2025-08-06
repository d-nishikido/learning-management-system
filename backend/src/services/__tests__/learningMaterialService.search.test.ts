import { PrismaClient } from '@prisma/client';
import { LearningMaterialService } from '../learningMaterialService';

// Mock Prisma Client
const mockPrisma = {
  learningMaterial: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock the prisma import
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

describe('LearningMaterialService.searchLearningMaterials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should search materials with text query', async () => {
    const mockMaterials = [
      {
        id: 1,
        title: 'JavaScript Basics',
        description: 'Learn JavaScript fundamentals',
        materialType: 'FILE',
        fileSize: BigInt(1024),
        lesson: {
          id: 1,
          title: 'Intro to Programming',
          course: {
            id: 1,
            title: 'Web Development Course',
          },
        },
        _count: { userProgress: 5 },
        userProgress: [],
      },
    ];

    (mockPrisma.learningMaterial.count as jest.Mock).mockResolvedValue(1);
    (mockPrisma.learningMaterial.findMany as jest.Mock).mockResolvedValue(mockMaterials);

    const result = await LearningMaterialService.searchLearningMaterials({
      search: 'JavaScript',
      page: 1,
      limit: 10,
    });

    expect(result.materials).toHaveLength(1);
    expect(result.materials[0].title).toBe('JavaScript Basics');
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);

    expect(mockPrisma.learningMaterial.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          expect.objectContaining({
            title: {
              contains: 'JavaScript',
              mode: 'insensitive',
            },
          }),
        ]),
      }),
    });
  });

  it('should filter by material type', async () => {
    (mockPrisma.learningMaterial.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.learningMaterial.findMany as jest.Mock).mockResolvedValue([]);

    await LearningMaterialService.searchLearningMaterials({
      materialType: 'FILE',
      page: 1,
      limit: 10,
    });

    expect(mockPrisma.learningMaterial.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        materialType: 'FILE',
      }),
    });
  });

  it('should filter by material category', async () => {
    (mockPrisma.learningMaterial.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.learningMaterial.findMany as jest.Mock).mockResolvedValue([]);

    await LearningMaterialService.searchLearningMaterials({
      materialCategory: 'MAIN',
      page: 1,
      limit: 10,
    });

    expect(mockPrisma.learningMaterial.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        materialCategory: 'MAIN',
      }),
    });
  });

  it('should filter by published status', async () => {
    (mockPrisma.learningMaterial.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.learningMaterial.findMany as jest.Mock).mockResolvedValue([]);

    await LearningMaterialService.searchLearningMaterials({
      isPublished: true,
      page: 1,
      limit: 10,
    });

    expect(mockPrisma.learningMaterial.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        isPublished: true,
      }),
    });
  });

  it('should include unpublished materials for admin users', async () => {
    (mockPrisma.learningMaterial.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.learningMaterial.findMany as jest.Mock).mockResolvedValue([]);

    await LearningMaterialService.searchLearningMaterials(
      { page: 1, limit: 10 },
      true // includeUnpublished
    );

    expect(mockPrisma.learningMaterial.count).toHaveBeenCalledWith({
      where: {},
    });
  });

  it('should filter unpublished materials for regular users', async () => {
    (mockPrisma.learningMaterial.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.learningMaterial.findMany as jest.Mock).mockResolvedValue([]);

    await LearningMaterialService.searchLearningMaterials(
      { page: 1, limit: 10 },
      false // includeUnpublished
    );

    expect(mockPrisma.learningMaterial.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        isPublished: true,
        lesson: {
          isPublished: true,
          course: {
            isPublished: true,
          },
        },
      }),
    });
  });

  it('should handle pagination correctly', async () => {
    (mockPrisma.learningMaterial.count as jest.Mock).mockResolvedValue(25);
    (mockPrisma.learningMaterial.findMany as jest.Mock).mockResolvedValue([]);

    const result = await LearningMaterialService.searchLearningMaterials({
      page: 3,
      limit: 10,
    });

    expect(result.page).toBe(3);
    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(25);

    expect(mockPrisma.learningMaterial.findMany).toHaveBeenCalledWith({
      where: expect.any(Object),
      include: expect.any(Object),
      orderBy: expect.any(Array),
      skip: 20, // (page 3 - 1) * limit 10
      take: 10,
    });
  });

  it('should convert BigInt fileSize to number', async () => {
    const mockMaterials = [
      {
        id: 1,
        title: 'Test Material',
        fileSize: BigInt(2048),
        lesson: {
          id: 1,
          title: 'Test Lesson',
          course: { id: 1, title: 'Test Course' },
        },
        _count: { userProgress: 0 },
        userProgress: [],
      },
    ];

    (mockPrisma.learningMaterial.count as jest.Mock).mockResolvedValue(1);
    (mockPrisma.learningMaterial.findMany as jest.Mock).mockResolvedValue(mockMaterials);

    const result = await LearningMaterialService.searchLearningMaterials({
      page: 1,
      limit: 10,
    });

    expect(result.materials[0].fileSize).toBe(2048);
    expect(typeof result.materials[0].fileSize).toBe('number');
  });

  it('should include user progress when userId is provided', async () => {
    (mockPrisma.learningMaterial.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.learningMaterial.findMany as jest.Mock).mockResolvedValue([]);

    await LearningMaterialService.searchLearningMaterials(
      { page: 1, limit: 10 },
      false,
      123 // userId
    );

    expect(mockPrisma.learningMaterial.findMany).toHaveBeenCalledWith({
      where: expect.any(Object),
      include: expect.objectContaining({
        userProgress: {
          where: { userId: 123 },
          select: expect.objectContaining({
            id: true,
            progressRate: true,
            isCompleted: true,
          }),
        },
      }),
      orderBy: expect.any(Array),
      skip: expect.any(Number),
      take: expect.any(Number),
    });
  });

  it('should handle empty results', async () => {
    (mockPrisma.learningMaterial.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.learningMaterial.findMany as jest.Mock).mockResolvedValue([]);

    const result = await LearningMaterialService.searchLearningMaterials({
      search: 'nonexistent',
      page: 1,
      limit: 10,
    });

    expect(result.materials).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('should handle database errors', async () => {
    (mockPrisma.learningMaterial.count as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    await expect(
      LearningMaterialService.searchLearningMaterials({
        page: 1,
        limit: 10,
      })
    ).rejects.toThrow('Failed to search learning materials');
  });
});
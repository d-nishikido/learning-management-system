import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';
import { MaterialType } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  lesson: {
    findUnique: jest.fn(),
  },
  learningMaterial: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  MaterialType: {
    FILE: 'FILE',
    URL: 'URL',
    MANUAL_PROGRESS: 'MANUAL_PROGRESS',
  },
}));

// Mock fs module
jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
}));

import { LearningMaterialService, CreateLearningMaterialData } from '../learningMaterialService';

describe('LearningMaterialService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLearningMaterial', () => {
    const mockLesson = {
      id: 1,
      title: 'Test Lesson',
      courseId: 1,
      course: { id: 1, title: 'Test Course' },
    };

    const mockMaterialData: CreateLearningMaterialData = {
      lessonId: 1,
      title: 'Test Material',
      description: 'Test Description',
      materialType: 'URL' as MaterialType,
      externalUrl: 'https://example.com',
    };

    it('should create a URL learning material successfully', async () => {
      const expectedMaterial = {
        id: 1,
        ...mockMaterialData,
        lesson: mockLesson,
        _count: { userProgress: 0 },
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrisma.learningMaterial.findFirst
        .mockResolvedValueOnce(null) // No existing material with same title
        .mockResolvedValueOnce(null); // No last material for sort order
      mockPrisma.learningMaterial.create.mockResolvedValue(expectedMaterial);

      const result = await LearningMaterialService.createLearningMaterial(mockMaterialData);

      expect(result).toEqual(expectedMaterial);
      expect(mockPrisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { course: { select: { id: true, title: true } } },
      });
      expect(mockPrisma.learningMaterial.create).toHaveBeenCalled();
    });

    it('should create a FILE learning material successfully', async () => {
      const fileMaterialData: CreateLearningMaterialData = {
        lessonId: 1,
        title: 'Test File Material',
        materialType: 'FILE' as MaterialType,
        filePath: '/path/to/file.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
      };

      const expectedMaterial = {
        id: 1,
        ...fileMaterialData,
        lesson: mockLesson,
        _count: { userProgress: 0 },
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrisma.learningMaterial.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.learningMaterial.create.mockResolvedValue(expectedMaterial);

      const result = await LearningMaterialService.createLearningMaterial(fileMaterialData);

      expect(result).toEqual(expectedMaterial);
    });

    it('should create a MANUAL_PROGRESS learning material successfully', async () => {
      const manualMaterialData: CreateLearningMaterialData = {
        lessonId: 1,
        title: 'Test Manual Material',
        materialType: 'MANUAL_PROGRESS' as MaterialType,
        allowManualProgress: true,
      };

      const expectedMaterial = {
        id: 1,
        ...manualMaterialData,
        lesson: mockLesson,
        _count: { userProgress: 0 },
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrisma.learningMaterial.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.learningMaterial.create.mockResolvedValue(expectedMaterial);

      const result = await LearningMaterialService.createLearningMaterial(manualMaterialData);

      expect(result).toEqual(expectedMaterial);
    });

    it('should throw NotFoundError when lesson does not exist', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(null);

      await expect(
        LearningMaterialService.createLearningMaterial(mockMaterialData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when material with same title exists', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrisma.learningMaterial.findFirst.mockResolvedValue({
        id: 2,
        title: 'Test Material',
      });

      await expect(
        LearningMaterialService.createLearningMaterial(mockMaterialData)
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError for FILE type without required fields', async () => {
      const invalidFileData: CreateLearningMaterialData = {
        lessonId: 1,
        title: 'Test File Material',
        materialType: 'FILE' as MaterialType,
        // Missing filePath, fileSize, fileType
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);

      await expect(
        LearningMaterialService.createLearningMaterial(invalidFileData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for URL type without externalUrl', async () => {
      const invalidUrlData: CreateLearningMaterialData = {
        lessonId: 1,
        title: 'Test URL Material',
        materialType: 'URL' as MaterialType,
        // Missing externalUrl
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);

      await expect(
        LearningMaterialService.createLearningMaterial(invalidUrlData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid URL format', async () => {
      const invalidUrlData: CreateLearningMaterialData = {
        lessonId: 1,
        title: 'Test URL Material',
        materialType: 'URL' as MaterialType,
        externalUrl: 'invalid-url',
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);

      await expect(
        LearningMaterialService.createLearningMaterial(invalidUrlData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for MANUAL_PROGRESS type without allowManualProgress', async () => {
      const invalidManualData: CreateLearningMaterialData = {
        lessonId: 1,
        title: 'Test Manual Material',
        materialType: 'MANUAL_PROGRESS' as MaterialType,
        allowManualProgress: false,
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);

      await expect(
        LearningMaterialService.createLearningMaterial(invalidManualData)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getLearningMaterialById', () => {
    const mockMaterial = {
      id: 1,
      title: 'Test Material',
      materialType: 'URL',
      lesson: {
        id: 1,
        title: 'Test Lesson',
        course: { id: 1, title: 'Test Course' },
      },
      _count: { userProgress: 0 },
    };

    it('should get learning material by ID successfully', async () => {
      mockPrisma.learningMaterial.findFirst.mockResolvedValue(mockMaterial);

      const result = await LearningMaterialService.getLearningMaterialById(1, 1);

      expect(result).toEqual(mockMaterial);
      expect(mockPrisma.learningMaterial.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          lessonId: 1,
          isPublished: true,
          lesson: {
            isPublished: true,
            course: { isPublished: true },
          },
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundError when material does not exist', async () => {
      mockPrisma.learningMaterial.findFirst.mockResolvedValue(null);

      await expect(
        LearningMaterialService.getLearningMaterialById(1, 1)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getLearningMaterialsByLesson', () => {
    const mockMaterials = [
      {
        id: 1,
        title: 'Material 1',
        materialType: 'URL',
        lesson: {
          id: 1,
          title: 'Test Lesson',
          course: { id: 1, title: 'Test Course' },
        },
        _count: { userProgress: 0 },
      },
    ];

    it('should get learning materials by lesson successfully', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({
        id: 1,
        course: { id: 1, title: 'Test Course' },
      });
      mockPrisma.learningMaterial.count.mockResolvedValue(1);
      mockPrisma.learningMaterial.findMany.mockResolvedValue(mockMaterials);

      const result = await LearningMaterialService.getLearningMaterialsByLesson(1);

      expect(result).toEqual({
        materials: mockMaterials,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should throw NotFoundError when lesson does not exist', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(null);

      await expect(
        LearningMaterialService.getLearningMaterialsByLesson(1)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteLearningMaterial', () => {
    const mockMaterial = {
      id: 1,
      title: 'Test Material',
      filePath: '/path/to/file.pdf',
      sortOrder: 1,
      _count: { userProgress: 0 },
    };

    it('should delete learning material successfully', async () => {
      mockPrisma.learningMaterial.findFirst.mockResolvedValue(mockMaterial);
      mockPrisma.learningMaterial.delete.mockResolvedValue(mockMaterial);
      mockPrisma.learningMaterial.updateMany.mockResolvedValue({ count: 0 });

      await LearningMaterialService.deleteLearningMaterial(1, 1);

      expect(mockPrisma.learningMaterial.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundError when material does not exist', async () => {
      mockPrisma.learningMaterial.findFirst.mockResolvedValue(null);

      await expect(
        LearningMaterialService.deleteLearningMaterial(1, 1)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when material has user progress', async () => {
      const materialWithProgress = {
        ...mockMaterial,
        _count: { userProgress: 1 },
      };
      mockPrisma.learningMaterial.findFirst.mockResolvedValue(materialWithProgress);

      await expect(
        LearningMaterialService.deleteLearningMaterial(1, 1)
      ).rejects.toThrow(ConflictError);
    });
  });
});
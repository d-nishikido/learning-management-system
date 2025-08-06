import { PrismaClient, LearningMaterial, MaterialType } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import fs from 'fs/promises';

const prisma = new PrismaClient();

export interface CreateLearningMaterialData {
  lessonId: number;
  title: string;
  description?: string;
  materialType: MaterialType;
  materialCategory?: 'MAIN' | 'SUPPLEMENTARY';
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  externalUrl?: string;
  durationMinutes?: number;
  allowManualProgress?: boolean;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface UpdateLearningMaterialData {
  title?: string;
  description?: string;
  externalUrl?: string;
  durationMinutes?: number;
  allowManualProgress?: boolean;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface LearningMaterialQuery {
  materialType?: MaterialType;
  materialCategory?: 'MAIN' | 'SUPPLEMENTARY';
  isPublished?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LearningMaterialWithDetails extends Omit<LearningMaterial, 'fileSize'> {
  fileSize: number | null;
  lesson: {
    id: number;
    title: string;
    courseId: number;
    course: {
      id: number;
      title: string;
    };
  };
  _count?: {
    userProgress: number;
  };
}

export class LearningMaterialService {
  /**
   * Search learning materials across the system
   */
  static async searchLearningMaterials(query: LearningMaterialQuery = {}, includeUnpublished = false, userId?: number): Promise<{
    materials: LearningMaterialWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        materialType,
        materialCategory,
        isPublished,
        search,
        page = 1,
        limit = 10,
      } = query;

      const whereClause: any = {};

      // Apply filters
      if (materialType) {
        whereClause.materialType = materialType;
      }

      if (materialCategory) {
        whereClause.materialCategory = materialCategory;
      }

      if (isPublished !== undefined) {
        whereClause.isPublished = isPublished;
      } else if (!includeUnpublished) {
        // Default to only published materials if not explicitly including unpublished
        whereClause.isPublished = true;
        whereClause.lesson = {
          isPublished: true,
          course: {
            isPublished: true,
          }
        };
      }

      if (search) {
        whereClause.OR = [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            lesson: {
              title: {
                contains: search,
                mode: 'insensitive',
              }
            }
          },
          {
            lesson: {
              course: {
                title: {
                  contains: search,
                  mode: 'insensitive',
                }
              }
            }
          }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const total = await prisma.learningMaterial.count({
        where: whereClause,
      });

      // Get materials
      const includeClause: any = {
        lesson: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        },
        _count: {
          select: {
            userProgress: true,
          },
        },
      };

      // Include user progress if userId is provided
      if (userId) {
        includeClause.userProgress = {
          where: { userId },
          select: {
            id: true,
            progressRate: true,
            isCompleted: true,
            spentMinutes: true,
            lastAccessed: true,
          },
        };
      }

      const materials = await prisma.learningMaterial.findMany({
        where: whereClause,
        include: includeClause,
        orderBy: [
          { lesson: { course: { title: 'asc' } } },
          { lesson: { title: 'asc' } },
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      // Convert BigInt fileSize to number for JSON serialization and format user progress
      const materialsWithConvertedFileSize = materials.map(material => ({
        ...material,
        fileSize: material.fileSize ? Number(material.fileSize) : null,
        userProgress: material.userProgress && Array.isArray(material.userProgress) && material.userProgress.length > 0 
          ? material.userProgress[0] 
          : null,
      }));

      return {
        materials: materialsWithConvertedFileSize,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      throw new Error(`Failed to search learning materials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new learning material
   */
  static async createLearningMaterial(materialData: CreateLearningMaterialData): Promise<LearningMaterialWithDetails> {
    try {
      // Check if lesson exists
      const lesson = await prisma.lesson.findUnique({
        where: { id: materialData.lessonId },
        include: {
          course: {
            select: { id: true, title: true }
          }
        }
      });

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      // Validate material type specific fields
      this.validateMaterialTypeData(materialData);

      // Check if a material with the same title already exists in this lesson
      const existingMaterial = await prisma.learningMaterial.findFirst({
        where: {
          lessonId: materialData.lessonId,
          title: materialData.title,
        },
      });

      if (existingMaterial) {
        throw new ConflictError('A learning material with this title already exists in this lesson');
      }

      // If sortOrder not provided, set it to the next available order
      let sortOrder = materialData.sortOrder;
      if (sortOrder === undefined) {
        const lastMaterial = await prisma.learningMaterial.findFirst({
          where: { lessonId: materialData.lessonId },
          orderBy: { sortOrder: 'desc' },
        });
        sortOrder = lastMaterial ? lastMaterial.sortOrder + 1 : 1;
      } else {
        // If sortOrder is provided, adjust other materials if needed
        await this.adjustSortOrderForInsertion(materialData.lessonId, sortOrder);
      }

      const material = await prisma.learningMaterial.create({
        data: {
          lessonId: materialData.lessonId,
          title: materialData.title,
          description: materialData.description || null,
          materialType: materialData.materialType,
          materialCategory: materialData.materialCategory || 'MAIN',
          filePath: materialData.filePath || null,
          fileSize: materialData.fileSize ? BigInt(materialData.fileSize) : null,
          fileType: materialData.fileType || null,
          externalUrl: materialData.externalUrl || null,
          durationMinutes: materialData.durationMinutes || null,
          allowManualProgress: materialData.allowManualProgress || false,
          sortOrder,
          isPublished: materialData.isPublished || false,
        },
        include: {
          lesson: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                }
              }
            }
          },
          _count: {
            select: {
              userProgress: true,
            },
          },
        },
      });

      // Convert BigInt fileSize to number for JSON serialization
      return {
        ...material,
        fileSize: material.fileSize ? Number(material.fileSize) : null,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to create learning material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get learning material by ID
   */
  static async getLearningMaterialById(lessonId: number, materialId: number, includeUnpublished = false): Promise<LearningMaterialWithDetails> {
    try {
      const whereClause: any = { 
        id: materialId,
        lessonId,
      };
      
      // If not including unpublished, filter them out
      if (!includeUnpublished) {
        whereClause.isPublished = true;
        whereClause.lesson = {
          isPublished: true,
          course: {
            isPublished: true,
          }
        };
      }

      const material = await prisma.learningMaterial.findFirst({
        where: whereClause,
        include: {
          lesson: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                }
              }
            }
          },
          _count: {
            select: {
              userProgress: true,
            },
          },
        },
      });

      if (!material) {
        throw new NotFoundError('Learning material not found');
      }

      // Convert BigInt fileSize to number for JSON serialization
      return {
        ...material,
        fileSize: material.fileSize ? Number(material.fileSize) : null,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get learning material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all learning materials for a lesson with filtering and pagination
   */
  static async getLearningMaterialsByLesson(lessonId: number, query: LearningMaterialQuery = {}, includeUnpublished = false, userId?: number): Promise<{
    materials: LearningMaterialWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Check if lesson exists
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          course: {
            select: { id: true, title: true }
          }
        }
      });

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      const {
        materialType,
        materialCategory,
        isPublished,
        search,
        page = 1,
        limit = 10,
      } = query;

      const whereClause: any = {
        lessonId,
      };

      // Apply filters
      if (materialType) {
        whereClause.materialType = materialType;
      }

      if (materialCategory) {
        whereClause.materialCategory = materialCategory;
      }

      if (isPublished !== undefined) {
        whereClause.isPublished = isPublished;
      } else if (!includeUnpublished) {
        // Default to only published materials if not explicitly including unpublished
        whereClause.isPublished = true;
      }

      if (search) {
        whereClause.OR = [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const total = await prisma.learningMaterial.count({
        where: whereClause,
      });

      // Get materials
      const includeClause: any = {
        lesson: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        },
        _count: {
          select: {
            userProgress: true,
          },
        },
      };

      // Include user progress if userId is provided
      if (userId) {
        includeClause.userProgress = {
          where: { userId },
          select: {
            id: true,
            progressRate: true,
            isCompleted: true,
            timeSpentMinutes: true,
            lastAccessedAt: true,
          },
        };
      }

      const materials = await prisma.learningMaterial.findMany({
        where: whereClause,
        include: includeClause,
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      // Convert BigInt fileSize to number for JSON serialization and format user progress
      const materialsWithConvertedFileSize = materials.map(material => ({
        ...material,
        fileSize: material.fileSize ? Number(material.fileSize) : null,
        userProgress: material.userProgress && Array.isArray(material.userProgress) && material.userProgress.length > 0 
          ? material.userProgress[0] 
          : null,
      }));

      return {
        materials: materialsWithConvertedFileSize,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get learning materials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update learning material
   */
  static async updateLearningMaterial(lessonId: number, materialId: number, updateData: UpdateLearningMaterialData): Promise<LearningMaterialWithDetails> {
    try {
      // Check if material exists in the specified lesson
      const existingMaterial = await prisma.learningMaterial.findFirst({
        where: { 
          id: materialId,
          lessonId,
        },
      });

      if (!existingMaterial) {
        throw new NotFoundError('Learning material not found');
      }

      // If title is being updated, check for conflicts
      if (updateData.title && updateData.title !== existingMaterial.title) {
        const titleConflict = await prisma.learningMaterial.findFirst({
          where: {
            lessonId,
            title: updateData.title,
            id: { not: materialId },
          },
        });

        if (titleConflict) {
          throw new ConflictError('A learning material with this title already exists in this lesson');
        }
      }

      // If sortOrder is being updated, adjust other materials
      if (updateData.sortOrder !== undefined && updateData.sortOrder !== existingMaterial.sortOrder) {
        await this.adjustSortOrderForUpdate(lessonId, materialId, existingMaterial.sortOrder, updateData.sortOrder);
      }

      const material = await prisma.learningMaterial.update({
        where: { id: materialId },
        data: updateData,
        include: {
          lesson: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                }
              }
            }
          },
          _count: {
            select: {
              userProgress: true,
            },
          },
        },
      });

      // Convert BigInt fileSize to number for JSON serialization
      return {
        ...material,
        fileSize: material.fileSize ? Number(material.fileSize) : null,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to update learning material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete learning material
   */
  static async deleteLearningMaterial(lessonId: number, materialId: number): Promise<void> {
    try {
      const material = await prisma.learningMaterial.findFirst({
        where: { 
          id: materialId,
          lessonId,
        },
        include: {
          _count: {
            select: {
              userProgress: true,
            },
          },
        },
      });

      if (!material) {
        throw new NotFoundError('Learning material not found');
      }

      // Check if material has user progress
      if (material._count.userProgress > 0) {
        throw new ConflictError('Cannot delete learning material with user progress');
      }

      // Delete associated file if it exists
      if (material.filePath) {
        try {
          await fs.unlink(material.filePath);
        } catch (fileError) {
          // Log error but don't fail the deletion if file doesn't exist
          // TODO: Replace with proper logging service
          // console.warn(`Failed to delete file ${material.filePath}:`, fileError);
        }
      }

      await prisma.learningMaterial.delete({
        where: { id: materialId },
      });

      // Adjust sort orders of remaining materials
      await this.adjustSortOrderAfterDeletion(lessonId, material.sortOrder);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to delete learning material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update material order
   */
  static async updateMaterialOrder(lessonId: number, materialId: number, newSortOrder: number): Promise<LearningMaterialWithDetails> {
    try {
      const material = await prisma.learningMaterial.findFirst({
        where: { 
          id: materialId,
          lessonId,
        },
      });

      if (!material) {
        throw new NotFoundError('Learning material not found');
      }

      if (material.sortOrder === newSortOrder) {
        // No change needed, return the material as is
        return this.getLearningMaterialById(lessonId, materialId, true);
      }

      await this.adjustSortOrderForUpdate(lessonId, materialId, material.sortOrder, newSortOrder);

      const updatedMaterial = await prisma.learningMaterial.update({
        where: { id: materialId },
        data: { sortOrder: newSortOrder },
        include: {
          lesson: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                }
              }
            }
          },
          _count: {
            select: {
              userProgress: true,
            },
          },
        },
      });

      // Convert BigInt fileSize to number for JSON serialization
      return {
        ...updatedMaterial,
        fileSize: updatedMaterial.fileSize ? Number(updatedMaterial.fileSize) : null,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to update material order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate material type specific data
   */
  private static validateMaterialTypeData(materialData: CreateLearningMaterialData): void {
    switch (materialData.materialType) {
      case 'FILE':
        if (!materialData.filePath) {
          throw new ValidationError('File path is required for FILE type materials');
        }
        if (!materialData.fileType) {
          throw new ValidationError('File type is required for FILE type materials');
        }
        if (!materialData.fileSize) {
          throw new ValidationError('File size is required for FILE type materials');
        }
        break;
      
      case 'URL':
        if (!materialData.externalUrl) {
          throw new ValidationError('External URL is required for URL type materials');
        }
        // Basic URL validation
        try {
          new URL(materialData.externalUrl);
        } catch {
          throw new ValidationError('Invalid URL format');
        }
        break;
      
      case 'MANUAL_PROGRESS':
        // Manual progress materials must allow manual progress
        if (!materialData.allowManualProgress) {
          throw new ValidationError('Manual progress must be allowed for MANUAL_PROGRESS type materials');
        }
        break;
      
      default:
        throw new ValidationError('Invalid material type');
    }
  }

  /**
   * Adjust sort orders when inserting a new material at a specific position
   */
  private static async adjustSortOrderForInsertion(lessonId: number, insertAt: number): Promise<void> {
    await prisma.learningMaterial.updateMany({
      where: {
        lessonId,
        sortOrder: { gte: insertAt },
      },
      data: {
        sortOrder: { increment: 1 },
      },
    });
  }

  /**
   * Adjust sort orders when updating a material's position
   */
  private static async adjustSortOrderForUpdate(lessonId: number, materialId: number, oldOrder: number, newOrder: number): Promise<void> {
    if (newOrder < oldOrder) {
      // Moving up: increment sort orders between newOrder and oldOrder (exclusive)
      await prisma.learningMaterial.updateMany({
        where: {
          lessonId,
          id: { not: materialId },
          sortOrder: { gte: newOrder, lt: oldOrder },
        },
        data: {
          sortOrder: { increment: 1 },
        },
      });
    } else {
      // Moving down: decrement sort orders between oldOrder (exclusive) and newOrder (inclusive)
      await prisma.learningMaterial.updateMany({
        where: {
          lessonId,
          id: { not: materialId },
          sortOrder: { gt: oldOrder, lte: newOrder },
        },
        data: {
          sortOrder: { decrement: 1 },
        },
      });
    }
  }

  /**
   * Adjust sort orders after deleting a material
   */
  private static async adjustSortOrderAfterDeletion(lessonId: number, deletedOrder: number): Promise<void> {
    await prisma.learningMaterial.updateMany({
      where: {
        lessonId,
        sortOrder: { gt: deletedOrder },
      },
      data: {
        sortOrder: { decrement: 1 },
      },
    });
  }
}
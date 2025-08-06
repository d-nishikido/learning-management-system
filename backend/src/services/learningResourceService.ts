import { PrismaClient, LearningResource, ResourceType, ImportanceLevel, DifficultyLevel } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

const prisma = new PrismaClient();

export interface CreateLearningResourceData {
  lessonId?: number;
  courseId?: number;
  title: string;
  description?: string;
  resourceType: ResourceType;
  resourceUrl: string;
  difficultyLevel?: DifficultyLevel;
  importance?: ImportanceLevel;
  tags?: string[];
  thumbnailUrl?: string;
  isPublished?: boolean;
}

export interface UpdateLearningResourceData {
  title?: string;
  description?: string;
  resourceUrl?: string;
  difficultyLevel?: DifficultyLevel;
  importance?: ImportanceLevel;
  tags?: string[];
  thumbnailUrl?: string;
  isPublished?: boolean;
}

export interface LearningResourceQuery {
  resourceType?: ResourceType;
  importance?: ImportanceLevel;
  difficultyLevel?: DifficultyLevel;
  tags?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LearningResourceWithDetails extends LearningResource {
  lesson?: {
    id: number;
    title: string;
    courseId: number;
    course: {
      id: number;
      title: string;
    };
  };
  course?: {
    id: number;
    title: string;
  };
  _count?: {
    userMaterialAccess: number;
  };
  parsedTags?: string[];
}

export class LearningResourceService {
  /**
   * Create a new learning resource
   */
  static async createLearningResource(resourceData: CreateLearningResourceData): Promise<LearningResourceWithDetails> {
    try {
      // Validate that either lessonId or courseId is provided
      if (!resourceData.lessonId && !resourceData.courseId) {
        throw new ValidationError('Either lessonId or courseId must be provided');
      }

      if (resourceData.lessonId && resourceData.courseId) {
        throw new ValidationError('Cannot provide both lessonId and courseId');
      }

      // If lessonId is provided, check if lesson exists and get course info
      let lesson = null;
      if (resourceData.lessonId) {
        lesson = await prisma.lesson.findUnique({
          where: { id: resourceData.lessonId },
          include: {
            course: {
              select: { id: true, title: true }
            }
          }
        });

        if (!lesson) {
          throw new NotFoundError('Lesson not found');
        }
      }

      // If courseId is provided, check if course exists
      let course = null;
      if (resourceData.courseId) {
        course = await prisma.course.findUnique({
          where: { id: resourceData.courseId },
          select: { id: true, title: true }
        });

        if (!course) {
          throw new NotFoundError('Course not found');
        }
      }

      // Validate resource URL
      this.validateResourceUrl(resourceData.resourceUrl, resourceData.resourceType);

      // Check if a resource with the same title already exists in this context
      const whereClause: any = {
        title: resourceData.title,
      };
      
      if (resourceData.lessonId) {
        whereClause.lessonId = resourceData.lessonId;
      } else {
        whereClause.courseId = resourceData.courseId;
        whereClause.lessonId = null;
      }

      const existingResource = await prisma.learningResource.findFirst({
        where: whereClause,
      });

      if (existingResource) {
        throw new ConflictError('A learning resource with this title already exists in this context');
      }

      // Prepare tags as JSON string
      const tagsJson = resourceData.tags && resourceData.tags.length > 0 
        ? JSON.stringify(resourceData.tags) 
        : null;

      const resource = await prisma.learningResource.create({
        data: {
          lessonId: resourceData.lessonId || null,
          courseId: resourceData.courseId || null,
          title: resourceData.title,
          description: resourceData.description || null,
          resourceType: resourceData.resourceType,
          resourceUrl: resourceData.resourceUrl,
          difficultyLevel: resourceData.difficultyLevel || 'BEGINNER',
          importance: resourceData.importance || 'REFERENCE',
          tags: tagsJson,
          thumbnailUrl: resourceData.thumbnailUrl || null,
          isPublished: resourceData.isPublished || true,
        },
        include: {
          lesson: lesson ? {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                }
              }
            }
          } : undefined,
          course: course ? {
            select: {
              id: true,
              title: true,
            }
          } : undefined,
          _count: {
            select: {
              userMaterialAccess: true,
            },
          },
        },
      });

      return this.enrichResourceWithParsedTags(resource);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to create learning resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get learning resource by ID
   */
  static async getLearningResourceById(resourceId: number, includeUnpublished = false): Promise<LearningResourceWithDetails> {
    try {
      const whereClause: any = { 
        id: resourceId,
      };
      
      // If not including unpublished, filter them out
      if (!includeUnpublished) {
        whereClause.isPublished = true;
      }

      const resource = await prisma.learningResource.findFirst({
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
          course: {
            select: {
              id: true,
              title: true,
            }
          },
          _count: {
            select: {
              userMaterialAccess: true,
            },
          },
        },
      });

      if (!resource) {
        throw new NotFoundError('Learning resource not found');
      }

      return this.enrichResourceWithParsedTags(resource);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get learning resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all learning resources for a lesson with filtering and pagination
   */
  static async getLearningResourcesByLesson(lessonId: number, query: LearningResourceQuery = {}, includeUnpublished = false): Promise<{
    resources: LearningResourceWithDetails[];
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

      return this.getResourcesWithFilters({ lessonId }, query, includeUnpublished);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get learning resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all learning resources for a course with filtering and pagination
   */
  static async getLearningResourcesByCourse(courseId: number, query: LearningResourceQuery = {}, includeUnpublished = false): Promise<{
    resources: LearningResourceWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true }
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      return this.getResourcesWithFilters({ courseId, lessonId: null }, query, includeUnpublished);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get learning resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search learning resources across the system
   */
  static async searchLearningResources(query: LearningResourceQuery = {}, includeUnpublished = false): Promise<{
    resources: LearningResourceWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      return this.getResourcesWithFilters({}, query, includeUnpublished);
    } catch (error) {
      throw new Error(`Failed to search learning resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update learning resource
   */
  static async updateLearningResource(resourceId: number, updateData: UpdateLearningResourceData): Promise<LearningResourceWithDetails> {
    try {
      // Check if resource exists
      const existingResource = await prisma.learningResource.findUnique({
        where: { id: resourceId },
      });

      if (!existingResource) {
        throw new NotFoundError('Learning resource not found');
      }

      // If title is being updated, check for conflicts
      if (updateData.title && updateData.title !== existingResource.title) {
        const whereClause: any = {
          title: updateData.title,
          id: { not: resourceId },
        };
        
        if (existingResource.lessonId) {
          whereClause.lessonId = existingResource.lessonId;
        } else {
          whereClause.courseId = existingResource.courseId;
          whereClause.lessonId = null;
        }

        const titleConflict = await prisma.learningResource.findFirst({
          where: whereClause,
        });

        if (titleConflict) {
          throw new ConflictError('A learning resource with this title already exists in this context');
        }
      }

      // Validate resource URL if being updated
      if (updateData.resourceUrl) {
        this.validateResourceUrl(updateData.resourceUrl, existingResource.resourceType);
      }

      // Prepare tags as JSON string if provided
      const updateDataWithTags: any = { ...updateData };
      if (updateData.tags !== undefined) {
        updateDataWithTags.tags = updateData.tags && updateData.tags.length > 0 
          ? JSON.stringify(updateData.tags) 
          : null;
        delete updateDataWithTags.tags;
      }

      const resource = await prisma.learningResource.update({
        where: { id: resourceId },
        data: updateDataWithTags,
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
          course: {
            select: {
              id: true,
              title: true,
            }
          },
          _count: {
            select: {
              userMaterialAccess: true,
            },
          },
        },
      });

      return this.enrichResourceWithParsedTags(resource);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to update learning resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete learning resource
   */
  static async deleteLearningResource(resourceId: number): Promise<void> {
    try {
      const resource = await prisma.learningResource.findUnique({
        where: { id: resourceId },
        include: {
          _count: {
            select: {
              userMaterialAccess: true,
            },
          },
        },
      });

      if (!resource) {
        throw new NotFoundError('Learning resource not found');
      }

      // Check if resource has user access records
      if (resource._count.userMaterialAccess > 0) {
        throw new ConflictError('Cannot delete learning resource with user access records');
      }

      await prisma.learningResource.delete({
        where: { id: resourceId },
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to delete learning resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all unique tags across all resources
   */
  static async getAllTags(): Promise<string[]> {
    try {
      const resources = await prisma.learningResource.findMany({
        where: {
          tags: { not: null },
          isPublished: true,
        },
        select: {
          tags: true,
        },
      });

      const allTags = new Set<string>();
      
      resources.forEach(resource => {
        if (resource.tags) {
          try {
            const tags = JSON.parse(resource.tags);
            if (Array.isArray(tags)) {
              tags.forEach(tag => allTags.add(tag));
            }
          } catch {
            // Ignore invalid JSON
          }
        }
      });

      return Array.from(allTags).sort();
    } catch (error) {
      throw new Error(`Failed to get tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Increment view count for a resource
   */
  static async incrementViewCount(resourceId: number): Promise<void> {
    try {
      await prisma.learningResource.update({
        where: { id: resourceId },
        data: {
          viewCount: { increment: 1 },
        },
      });
    } catch (error) {
      // Silently fail view count updates to not affect user experience
    }
  }

  /**
   * Get resources with filters (private helper method)
   */
  private static async getResourcesWithFilters(
    baseWhere: any,
    query: LearningResourceQuery,
    includeUnpublished: boolean
  ): Promise<{
    resources: LearningResourceWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      resourceType,
      importance,
      difficultyLevel,
      tags,
      search,
      page = 1,
      limit = 10,
    } = query;

    const whereClause: any = { ...baseWhere };

    // Apply filters
    if (resourceType) {
      whereClause.resourceType = resourceType;
    }

    if (importance) {
      whereClause.importance = importance;
    }

    if (difficultyLevel) {
      whereClause.difficultyLevel = difficultyLevel;
    }

    if (!includeUnpublished) {
      whereClause.isPublished = true;
    }

    if (tags) {
      whereClause.tags = {
        contains: tags,
        mode: 'insensitive',
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
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await prisma.learningResource.count({
      where: whereClause,
    });

    // Get resources
    const resources = await prisma.learningResource.findMany({
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
        course: {
          select: {
            id: true,
            title: true,
          }
        },
        _count: {
          select: {
            userMaterialAccess: true,
          },
        },
      },
      orderBy: [
        { importance: 'asc' }, // Required first, then recommended, then reference
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    const resourcesWithParsedTags = resources.map(resource => 
      this.enrichResourceWithParsedTags(resource)
    );

    return {
      resources: resourcesWithParsedTags,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Validate resource URL based on resource type
   */
  private static validateResourceUrl(url: string, resourceType: ResourceType): void {
    try {
      const urlObj = new URL(url);
      
      switch (resourceType) {
        case 'YOUTUBE':
          if (!urlObj.hostname.includes('youtube.com') && !urlObj.hostname.includes('youtu.be')) {
            throw new ValidationError('Invalid YouTube URL');
          }
          break;
        
        case 'WEBSITE':
          if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            throw new ValidationError('Website URL must use HTTP or HTTPS protocol');
          }
          break;
        
        case 'FILE':
        case 'DOCUMENT':
        case 'TOOL':
          // Generic URL validation for other types
          if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            throw new ValidationError('URL must use HTTP or HTTPS protocol');
          }
          break;
        
        default:
          throw new ValidationError('Invalid resource type');
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid URL format');
    }
  }

  /**
   * Parse tags from JSON string and add to resource object
   */
  private static enrichResourceWithParsedTags(resource: any): LearningResourceWithDetails {
    let parsedTags: string[] = [];
    
    if (resource.tags) {
      try {
        const tags = JSON.parse(resource.tags);
        if (Array.isArray(tags)) {
          parsedTags = tags;
        }
      } catch {
        // Ignore invalid JSON
      }
    }

    return {
      ...resource,
      parsedTags,
    };
  }
}
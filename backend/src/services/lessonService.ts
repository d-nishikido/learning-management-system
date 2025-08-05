import { PrismaClient, Lesson } from '@prisma/client';
import { NotFoundError, ConflictError } from '../utils/errors';

const prisma = new PrismaClient();

export interface CreateLessonData {
  courseId: number;
  title: string;
  description?: string;
  content?: string;
  estimatedMinutes?: number;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  content?: string;
  estimatedMinutes?: number;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface LessonQuery {
  isPublished?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LessonWithDetails extends Lesson {
  course: {
    id: number;
    title: string;
    isPublished: boolean;
  };
  learningMaterials?: Array<{
    id: number;
    title: string;
    materialType: string;
    sortOrder: number;
    isPublished: boolean;
  }>;
  _count?: {
    learningMaterials: number;
    userProgress: number;
  };
}

export class LessonService {
  /**
   * Check if a user is enrolled in a course
   */
  private static async isUserEnrolledInCourse(userId: number, courseId: number): Promise<boolean> {
    try {
      const enrollment = await prisma.userProgress.findFirst({
        where: {
          userId,
          courseId,
        },
      });
      return !!enrollment;
    } catch (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
  }

  /**
   * Create a new lesson
   */
  static async createLesson(lessonData: CreateLessonData): Promise<LessonWithDetails> {
    try {
      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: lessonData.courseId },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      // Check if a lesson with the same title already exists in this course
      const existingLesson = await prisma.lesson.findFirst({
        where: {
          courseId: lessonData.courseId,
          title: lessonData.title,
        },
      });

      if (existingLesson) {
        throw new ConflictError('A lesson with this title already exists in this course');
      }

      // If sortOrder not provided, set it to the next available order
      let sortOrder = lessonData.sortOrder;
      if (sortOrder === undefined) {
        const lastLesson = await prisma.lesson.findFirst({
          where: { courseId: lessonData.courseId },
          orderBy: { sortOrder: 'desc' },
        });
        sortOrder = lastLesson ? lastLesson.sortOrder + 1 : 1;
      } else {
        // If sortOrder is provided, adjust other lessons if needed
        await this.adjustSortOrderForInsertion(lessonData.courseId, sortOrder);
      }

      const lesson = await prisma.lesson.create({
        data: {
          courseId: lessonData.courseId,
          title: lessonData.title,
          description: lessonData.description || null,
          content: lessonData.content || null,
          estimatedMinutes: lessonData.estimatedMinutes || null,
          sortOrder,
          isPublished: lessonData.isPublished || false,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              isPublished: true,
            },
          },
          _count: {
            select: {
              learningMaterials: true,
              userProgress: true,
            },
          },
        },
      });

      return lesson;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to create lesson: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get lesson by ID
   */
  static async getLessonById(courseId: number, lessonId: number, includeUnpublished = false, userId?: number): Promise<LessonWithDetails> {
    try {
      const whereClause: any = { 
        id: lessonId,
        courseId,
      };
      
      // If not including unpublished, filter them out
      if (!includeUnpublished) {
        // For non-admin users, check if they are enrolled before showing the lesson
        if (userId) {
          const isEnrolled = await this.isUserEnrolledInCourse(userId, courseId);
          if (!isEnrolled) {
            throw new NotFoundError('Lesson not found');
          }
        }
        
        whereClause.isPublished = true;
        whereClause.course = {
          isPublished: true,
        };
      }

      const lesson = await prisma.lesson.findFirst({
        where: whereClause,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              isPublished: true,
            },
          },
          learningMaterials: {
            select: {
              id: true,
              title: true,
              materialType: true,
              sortOrder: true,
              isPublished: true,
            },
            where: includeUnpublished ? {} : { isPublished: true },
            orderBy: {
              sortOrder: 'asc',
            },
          },
          _count: {
            select: {
              learningMaterials: true,
              userProgress: true,
            },
          },
        },
      });

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      return lesson;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get lesson: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all lessons for a course with filtering and pagination
   */
  static async getLessonsByCourse(courseId: number, query: LessonQuery = {}, userId?: number, userRole?: string): Promise<{
    lessons: LessonWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      const {
        isPublished,
        search,
        page = 1,
        limit = 10,
      } = query;

      const whereClause: any = {
        courseId,
      };

      // Determine lesson visibility based on user role and enrollment
      let showUnpublished = false;
      
      if (userRole === 'ADMIN') {
        // Admins can see all lessons (published and unpublished)
        showUnpublished = true;
      } else if (userId) {
        // Check if user is enrolled in the course
        const isEnrolled = await this.isUserEnrolledInCourse(userId, courseId);
        if (isEnrolled) {
          // Enrolled users can see published lessons
          showUnpublished = false;
        } else {
          // Non-enrolled users can't see any lessons - use impossible condition
          whereClause.id = -1; // This will return no results
        }
      } else {
        // No user context - no lessons visible - use impossible condition
        whereClause.id = -1; // This will return no results
      }

      // Apply isPublished filter unless user is admin
      if (isPublished !== undefined) {
        whereClause.isPublished = isPublished;
      } else if (!showUnpublished) {
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
          {
            content: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const total = await prisma.lesson.count({
        where: whereClause,
      });

      // Get lessons
      const lessons = await prisma.lesson.findMany({
        where: whereClause,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              isPublished: true,
            },
          },
          _count: {
            select: {
              learningMaterials: true,
              userProgress: true,
            },
          },
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        lessons,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get lessons: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update lesson
   */
  static async updateLesson(courseId: number, lessonId: number, updateData: UpdateLessonData): Promise<LessonWithDetails> {
    try {
      // Check if lesson exists in the specified course
      const existingLesson = await prisma.lesson.findFirst({
        where: { 
          id: lessonId,
          courseId,
        },
      });

      if (!existingLesson) {
        throw new NotFoundError('Lesson not found');
      }

      // If title is being updated, check for conflicts
      if (updateData.title && updateData.title !== existingLesson.title) {
        const titleConflict = await prisma.lesson.findFirst({
          where: {
            courseId,
            title: updateData.title,
            id: { not: lessonId },
          },
        });

        if (titleConflict) {
          throw new ConflictError('A lesson with this title already exists in this course');
        }
      }

      // If sortOrder is being updated, adjust other lessons
      if (updateData.sortOrder !== undefined && updateData.sortOrder !== existingLesson.sortOrder) {
        await this.adjustSortOrderForUpdate(courseId, lessonId, existingLesson.sortOrder, updateData.sortOrder);
      }

      const lesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: updateData,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              isPublished: true,
            },
          },
          learningMaterials: {
            select: {
              id: true,
              title: true,
              materialType: true,
              sortOrder: true,
              isPublished: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
          _count: {
            select: {
              learningMaterials: true,
              userProgress: true,
            },
          },
        },
      });

      return lesson;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to update lesson: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete lesson
   */
  static async deleteLesson(courseId: number, lessonId: number): Promise<void> {
    try {
      const lesson = await prisma.lesson.findFirst({
        where: { 
          id: lessonId,
          courseId,
        },
        include: {
          _count: {
            select: {
              userProgress: true,
              learningMaterials: true,
            },
          },
        },
      });

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      // Check if lesson has user progress
      if (lesson._count.userProgress > 0) {
        throw new ConflictError('Cannot delete lesson with user progress');
      }

      // Check if lesson has learning materials
      if (lesson._count.learningMaterials > 0) {
        throw new ConflictError('Cannot delete lesson with learning materials');
      }

      await prisma.lesson.delete({
        where: { id: lessonId },
      });

      // Adjust sort orders of remaining lessons
      await this.adjustSortOrderAfterDeletion(courseId, lesson.sortOrder);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to delete lesson: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update lesson order
   */
  static async updateLessonOrder(courseId: number, lessonId: number, newSortOrder: number): Promise<LessonWithDetails> {
    try {
      const lesson = await prisma.lesson.findFirst({
        where: { 
          id: lessonId,
          courseId,
        },
      });

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      if (lesson.sortOrder === newSortOrder) {
        // No change needed, return the lesson as is
        return this.getLessonById(courseId, lessonId, true);
      }

      await this.adjustSortOrderForUpdate(courseId, lessonId, lesson.sortOrder, newSortOrder);

      const updatedLesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: { sortOrder: newSortOrder },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              isPublished: true,
            },
          },
          learningMaterials: {
            select: {
              id: true,
              title: true,
              materialType: true,
              sortOrder: true,
              isPublished: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
          _count: {
            select: {
              learningMaterials: true,
              userProgress: true,
            },
          },
        },
      });

      return updatedLesson;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to update lesson order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Adjust sort orders when inserting a new lesson at a specific position
   */
  private static async adjustSortOrderForInsertion(courseId: number, insertAt: number): Promise<void> {
    await prisma.lesson.updateMany({
      where: {
        courseId,
        sortOrder: { gte: insertAt },
      },
      data: {
        sortOrder: { increment: 1 },
      },
    });
  }

  /**
   * Adjust sort orders when updating a lesson's position
   */
  private static async adjustSortOrderForUpdate(courseId: number, lessonId: number, oldOrder: number, newOrder: number): Promise<void> {
    if (newOrder < oldOrder) {
      // Moving up: increment sort orders between newOrder and oldOrder (exclusive)
      await prisma.lesson.updateMany({
        where: {
          courseId,
          id: { not: lessonId },
          sortOrder: { gte: newOrder, lt: oldOrder },
        },
        data: {
          sortOrder: { increment: 1 },
        },
      });
    } else {
      // Moving down: decrement sort orders between oldOrder (exclusive) and newOrder (inclusive)
      await prisma.lesson.updateMany({
        where: {
          courseId,
          id: { not: lessonId },
          sortOrder: { gt: oldOrder, lte: newOrder },
        },
        data: {
          sortOrder: { decrement: 1 },
        },
      });
    }
  }

  /**
   * Adjust sort orders after deleting a lesson
   */
  private static async adjustSortOrderAfterDeletion(courseId: number, deletedOrder: number): Promise<void> {
    await prisma.lesson.updateMany({
      where: {
        courseId,
        sortOrder: { gt: deletedOrder },
      },
      data: {
        sortOrder: { decrement: 1 },
      },
    });
  }
}
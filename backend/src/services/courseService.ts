import { PrismaClient, Course, DifficultyLevel, UserProgress } from '@prisma/client';
import { NotFoundError, ConflictError } from '../utils/errors';

const prisma = new PrismaClient();

export interface CreateCourseData {
  title: string;
  description?: string;
  category: string;
  difficultyLevel?: DifficultyLevel;
  estimatedHours?: number;
  thumbnailUrl?: string;
  isPublished?: boolean;
  sortOrder?: number;
  createdBy: number;
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  category?: string;
  difficultyLevel?: DifficultyLevel;
  estimatedHours?: number;
  thumbnailUrl?: string;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface CourseQuery {
  category?: string;
  difficultyLevel?: DifficultyLevel;
  isPublished?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CourseWithDetails extends Course {
  creator: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  lessons?: Array<{
    id: number;
    title: string;
    sortOrder: number;
    isPublished: boolean;
  }>;
  _count?: {
    lessons: number;
    userProgress: number;
  };
}

export class CourseService {
  /**
   * Create a new course
   */
  static async createCourse(courseData: CreateCourseData): Promise<CourseWithDetails> {
    try {
      // Check if a course with the same title already exists
      const existingCourse = await prisma.course.findFirst({
        where: {
          title: courseData.title,
        },
      });

      if (existingCourse) {
        throw new ConflictError('A course with this title already exists');
      }

      // Verify creator exists
      const creator = await prisma.user.findUnique({
        where: { id: courseData.createdBy },
      });

      if (!creator) {
        throw new NotFoundError('Creator not found');
      }

      const course = await prisma.course.create({
        data: {
          title: courseData.title,
          description: courseData.description || null,
          category: courseData.category,
          difficultyLevel: courseData.difficultyLevel || 'BEGINNER',
          estimatedHours: courseData.estimatedHours || null,
          thumbnailUrl: courseData.thumbnailUrl || null,
          isPublished: courseData.isPublished || false,
          sortOrder: courseData.sortOrder || 0,
          createdBy: courseData.createdBy,
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              lessons: true,
              userProgress: true,
            },
          },
        },
      });

      return course;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get course by ID
   */
  static async getCourseById(id: number, includeUnpublished = false): Promise<CourseWithDetails> {
    try {
      const whereClause: any = { id };
      
      // If not including unpublished, filter them out
      if (!includeUnpublished) {
        whereClause.isPublished = true;
      }

      const course = await prisma.course.findFirst({
        where: whereClause,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          lessons: {
            select: {
              id: true,
              title: true,
              sortOrder: true,
              isPublished: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
          _count: {
            select: {
              lessons: true,
              userProgress: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      return course;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all courses with filtering and pagination
   */
  static async getAllCourses(query: CourseQuery = {}, includeUnpublished = false): Promise<{
    courses: CourseWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        category,
        difficultyLevel,
        isPublished,
        search,
        page = 1,
        limit = 10,
      } = query;

      const whereClause: any = {};

      // Apply filters
      if (category) {
        whereClause.category = category;
      }

      if (difficultyLevel) {
        whereClause.difficultyLevel = difficultyLevel;
      }

      if (isPublished !== undefined) {
        whereClause.isPublished = isPublished;
      } else if (!includeUnpublished) {
        // Default to only published courses if not explicitly including unpublished
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
      const total = await prisma.course.count({
        where: whereClause,
      });

      // Get courses
      const courses = await prisma.course.findMany({
        where: whereClause,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              lessons: true,
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
        courses,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      throw new Error(`Failed to get courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update course
   */
  static async updateCourse(id: number, updateData: UpdateCourseData): Promise<CourseWithDetails> {
    try {
      // Check if course exists
      const existingCourse = await prisma.course.findUnique({
        where: { id },
      });

      if (!existingCourse) {
        throw new NotFoundError('Course not found');
      }

      // If title is being updated, check for conflicts
      if (updateData.title && updateData.title !== existingCourse.title) {
        const titleConflict = await prisma.course.findFirst({
          where: {
            title: updateData.title,
            id: { not: id },
          },
        });

        if (titleConflict) {
          throw new ConflictError('A course with this title already exists');
        }
      }

      const course = await prisma.course.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          lessons: {
            select: {
              id: true,
              title: true,
              sortOrder: true,
              isPublished: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
          _count: {
            select: {
              lessons: true,
              userProgress: true,
            },
          },
        },
      });

      return course;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to update course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete course
   */
  static async deleteCourse(id: number): Promise<void> {
    try {
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              userProgress: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      // Check if course has enrolled users
      if (course._count.userProgress > 0) {
        throw new ConflictError('Cannot delete course with enrolled users');
      }

      await prisma.course.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to delete course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enroll user in course
   */
  static async enrollInCourse(userId: number, courseId: number): Promise<UserProgress> {
    try {
      // Check if course exists and is published
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          isPublished: true,
        },
      });

      if (!course) {
        throw new NotFoundError('Course not found or not published');
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if already enrolled
      const existingProgress = await prisma.userProgress.findFirst({
        where: {
          userId,
          courseId,
        },
      });

      if (existingProgress) {
        throw new ConflictError('User is already enrolled in this course');
      }

      // Create enrollment record
      const progress = await prisma.userProgress.create({
        data: {
          userId,
          courseId,
          progressRate: 0,
          spentMinutes: 0,
          isCompleted: false,
        },
      });

      return progress;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to enroll in course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Unenroll user from course
   */
  static async unenrollFromCourse(userId: number, courseId: number): Promise<void> {
    try {
      const progress = await prisma.userProgress.findFirst({
        where: {
          userId,
          courseId,
        },
      });

      if (!progress) {
        throw new NotFoundError('User is not enrolled in this course');
      }

      await prisma.userProgress.delete({
        where: { id: progress.id },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to unenroll from course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
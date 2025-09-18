import { PrismaClient, ProgressType, UserProgress, Course, Lesson, LearningMaterial } from '@prisma/client';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { PaginatedResponse } from '../types';

const prisma = new PrismaClient();

export interface CreateProgressData {
  userId: number;
  courseId: number;
  lessonId?: number;
  materialId?: number;
  progressType?: ProgressType;
  progressRate?: number;
  spentMinutes?: number;
  notes?: string;
}

export interface UpdateProgressData {
  progressRate?: number;
  spentMinutes?: number;
  isCompleted?: boolean;
  notes?: string;
}

export interface ProgressQuery {
  courseId?: number;
  lessonId?: number;
  materialId?: number;
  isCompleted?: boolean;
  progressType?: ProgressType;
  page?: number;
  limit?: number;
}

export interface SessionData {
  userId: number;
  materialId?: number;
  courseId?: number;
  lessonId?: number;
}

export interface ProgressWithDetails extends UserProgress {
  course: Course;
  lesson?: Lesson | null;
  material?: LearningMaterial | null;
}

export interface ProgressSummary {
  totalCourses: number;
  enrolledCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  totalMaterials: number;
  completedMaterials: number;
  totalSpentMinutes: number;
  averageProgress: number;
  streakDays: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  spentMinutes: number;
  completedMaterials: number;
  progressRate: number;
}

export class ProgressService {
  /**
   * Get all progress for a user with filtering and pagination
   */
  static async getAllUserProgress(
    userId: number,
    query: ProgressQuery
  ): Promise<PaginatedResponse<ProgressWithDetails>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = {
      userId,
      ...(query.courseId && { courseId: query.courseId }),
      ...(query.lessonId && { lessonId: query.lessonId }),
      ...(query.materialId && { materialId: query.materialId }),
      ...(query.isCompleted !== undefined && { isCompleted: query.isCompleted }),
      ...(query.progressType && { progressType: query.progressType })
    };

    const [progress, total] = await Promise.all([
      prisma.userProgress.findMany({
        where,
        include: {
          course: true,
          lesson: true,
          material: true
        },
        orderBy: { lastAccessed: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.userProgress.count({ where })
    ]);

    return {
      data: progress,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get progress for a specific course
   */
  static async getCourseProgress(
    userId: number,
    courseId: number
  ): Promise<ProgressWithDetails[]> {
    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const progress = await prisma.userProgress.findMany({
      where: {
        userId,
        courseId
      },
      include: {
        course: true,
        lesson: true,
        material: true
      },
      orderBy: [
        { lesson: { sortOrder: 'asc' } },
        { material: { sortOrder: 'asc' } }
      ]
    });

    return progress as ProgressWithDetails;
  }

  /**
   * Get progress for a specific lesson
   */
  static async getLessonProgress(
    userId: number,
    lessonId: number
  ): Promise<ProgressWithDetails[]> {
    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const progress = await prisma.userProgress.findMany({
      where: {
        userId,
        lessonId
      },
      include: {
        course: true,
        lesson: true,
        material: true
      },
      orderBy: { material: { sortOrder: 'asc' } }
    });

    return progress as ProgressWithDetails;
  }

  /**
   * Get progress for a specific material
   */
  static async getMaterialProgress(
    userId: number,
    materialId: number
  ): Promise<ProgressWithDetails | null> {
    // Verify material exists
    const material = await prisma.learningMaterial.findUnique({
      where: { id: materialId }
    });

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    const progress = await prisma.userProgress.findFirst({
      where: {
        userId,
        materialId
      },
      include: {
        course: true,
        lesson: true,
        material: true
      }
    });

    return progress as ProgressWithDetails;
  }

  /**
   * Create new progress record
   */
  static async createProgress(data: CreateProgressData): Promise<ProgressWithDetails> {
    // Validate required references exist
    const course = await prisma.course.findUnique({
      where: { id: data.courseId }
    });

    if (!course) {
      throw new ValidationError('Course not found');
    }

    if (data.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: data.lessonId }
      });

      if (!lesson || lesson.courseId !== data.courseId) {
        throw new ValidationError('Lesson not found or does not belong to the specified course');
      }
    }

    if (data.materialId) {
      const material = await prisma.learningMaterial.findUnique({
        where: { id: data.materialId },
        include: { lesson: true }
      });

      if (!material) {
        throw new ValidationError('Material not found');
      }

      if (data.lessonId && material.lessonId !== data.lessonId) {
        throw new ValidationError('Material does not belong to the specified lesson');
      }
    }

    // Check for existing progress record to avoid duplicates
    const existingProgress = await prisma.userProgress.findFirst({
      where: {
        userId: data.userId,
        courseId: data.courseId,
        lessonId: data.lessonId || null,
        materialId: data.materialId || null
      }
    });

    if (existingProgress) {
      throw new ConflictError('Progress record already exists for this combination');
    }

    // Create progress record
    const progress = await prisma.userProgress.create({
      data: {
        userId: data.userId,
        courseId: data.courseId,
        lessonId: data.lessonId,
        materialId: data.materialId,
        progressType: data.progressType || 'AUTO',
        progressRate: data.progressRate || 0,
        spentMinutes: data.spentMinutes || 0,
        notes: data.notes,
        isCompleted: (data.progressRate || 0) >= 100
      },
      include: {
        course: true,
        lesson: true,
        material: true
      }
    });

    // Update learning streak if material is completed
    if (progress.isCompleted && progress.materialId) {
      await this.updateLearningStreak(data.userId);
    }

    return progress as ProgressWithDetails;
  }

  /**
   * Update progress record
   */
  static async updateProgress(
    progressId: number,
    userId: number,
    data: UpdateProgressData
  ): Promise<ProgressWithDetails> {
    // Find existing progress record
    const existingProgress = await prisma.userProgress.findFirst({
      where: {
        id: progressId,
        userId
      }
    });

    if (!existingProgress) {
      throw new NotFoundError('Progress record not found');
    }

    // Calculate completion status
    const newProgressRate = data.progressRate !== undefined ? data.progressRate : existingProgress.progressRate;
    const isCompleted = data.isCompleted !== undefined ? data.isCompleted : Number(newProgressRate) >= 100;

    // Update progress record
    const progress = await prisma.userProgress.update({
      where: { id: progressId },
      data: {
        ...data,
        isCompleted,
        completionDate: isCompleted && !existingProgress.isCompleted ? new Date() : existingProgress.completionDate,
        lastAccessed: new Date()
      },
      include: {
        course: true,
        lesson: true,
        material: true
      }
    });

    // Update learning streak if newly completed
    if (isCompleted && !existingProgress.isCompleted && progress.materialId) {
      await this.updateLearningStreak(userId);
    }

    return progress as ProgressWithDetails;
  }

  /**
   * Delete progress record
   */
  static async deleteProgress(progressId: number): Promise<void> {
    const progress = await prisma.userProgress.findUnique({
      where: { id: progressId }
    });

    if (!progress) {
      throw new NotFoundError('Progress record not found');
    }

    await prisma.userProgress.delete({
      where: { id: progressId }
    });
  }

  /**
   * Update manual progress for a material
   */
  static async updateManualProgress(
    userId: number,
    materialId: number,
    progressRate: number,
    spentMinutes?: number,
    notes?: string
  ): Promise<ProgressWithDetails> {
    // Get material and its lesson/course info
    const material = await prisma.learningMaterial.findUnique({
      where: { id: materialId },
      include: { lesson: true }
    });

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    if (!material.allowManualProgress) {
      throw new ValidationError('Manual progress is not allowed for this material');
    }

    // Find or create progress record
    let progress = await prisma.userProgress.findFirst({
      where: {
        userId,
        materialId,
        courseId: material.lesson!.courseId,
        lessonId: material.lessonId
      }
    });

    const isCompleted = progressRate >= 100;

    if (progress) {
      // Update existing progress
      progress = await prisma.userProgress.update({
        where: { id: progress.id },
        data: {
          progressType: 'MANUAL',
          manualProgressRate: progressRate,
          progressRate: progressRate,
          spentMinutes: spentMinutes !== undefined ? progress.spentMinutes + spentMinutes : progress.spentMinutes,
          isCompleted,
          completionDate: isCompleted && !progress.isCompleted ? new Date() : progress.completionDate,
          notes: notes || progress.notes,
          lastAccessed: new Date()
        },
        include: {
          course: true,
          lesson: true,
          material: true
        }
      });
    } else {
      // Create new progress record
      progress = await prisma.userProgress.create({
        data: {
          userId,
          courseId: material.lesson!.courseId,
          lessonId: material.lessonId,
          materialId,
          progressType: 'MANUAL',
          manualProgressRate: progressRate,
          progressRate: progressRate,
          spentMinutes: spentMinutes || 0,
          isCompleted,
          completionDate: isCompleted ? new Date() : null,
          notes
        },
        include: {
          course: true,
          lesson: true,
          material: true
        }
      });
    }

    // Update learning streak if newly completed
    if (isCompleted && !progress.isCompleted) {
      await this.updateLearningStreak(userId);
    }

    return progress as ProgressWithDetails;
  }

  /**
   * Mark material as completed
   */
  static async markMaterialComplete(
    userId: number,
    materialId: number
  ): Promise<ProgressWithDetails> {
    // Get material and its lesson/course info
    const material = await prisma.learningMaterial.findUnique({
      where: { id: materialId },
      include: { lesson: true }
    });

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    // Find or create progress record
    let progress = await prisma.userProgress.findFirst({
      where: {
        userId,
        materialId,
        courseId: material.lesson!.courseId,
        lessonId: material.lessonId
      }
    });

    if (progress) {
      if (progress.isCompleted) {
        return await prisma.userProgress.findUnique({
          where: { id: progress.id },
          include: {
            course: true,
            lesson: true,
            material: true
          }
        }) as ProgressWithDetails;
      }

      // Update existing progress
      progress = await prisma.userProgress.update({
        where: { id: progress.id },
        data: {
          progressRate: 100,
          isCompleted: true,
          completionDate: new Date(),
          lastAccessed: new Date()
        },
        include: {
          course: true,
          lesson: true,
          material: true
        }
      });
    } else {
      // Create new progress record
      progress = await prisma.userProgress.create({
        data: {
          userId,
          courseId: material.lesson!.courseId,
          lessonId: material.lessonId,
          materialId,
          progressRate: 100,
          isCompleted: true,
          completionDate: new Date()
        },
        include: {
          course: true,
          lesson: true,
          material: true
        }
      });
    }

    // Update learning streak
    await this.updateLearningStreak(userId);

    return progress as ProgressWithDetails;
  }

  /**
   * Mark a lesson as completed
   */
  static async markLessonComplete(
    userId: number,
    lessonId: number
  ): Promise<ProgressWithDetails> {
    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true }
    });

    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    // Check if progress record exists for this lesson
    let progress = await prisma.userProgress.findFirst({
      where: {
        userId,
        courseId: lesson.courseId,
        lessonId,
        materialId: null // Lesson-level progress
      }
    });

    if (progress) {
      // Update existing progress record
      progress = await prisma.userProgress.update({
        where: { id: progress.id },
        data: {
          progressRate: 100,
          isCompleted: true,
          completionDate: new Date()
        },
        include: {
          course: true,
          lesson: true,
          material: true
        }
      });
    } else {
      // Create new progress record for the lesson
      progress = await prisma.userProgress.create({
        data: {
          userId,
          courseId: lesson.courseId,
          lessonId,
          materialId: null, // This is lesson-level progress
          progressRate: 100,
          isCompleted: true,
          completionDate: new Date()
        },
        include: {
          course: true,
          lesson: true,
          material: true
        }
      });
    }

    // Mark all materials in the lesson as completed
    const materials = await prisma.learningMaterial.findMany({
      where: { lessonId }
    });

    for (const material of materials) {
      const materialProgress = await prisma.userProgress.findFirst({
        where: {
          userId,
          materialId: material.id
        }
      });

      if (!materialProgress) {
        await prisma.userProgress.create({
          data: {
            userId,
            courseId: lesson.courseId,
            lessonId,
            materialId: material.id,
            progressRate: 100,
            isCompleted: true,
            completionDate: new Date()
          }
        });
      } else if (!materialProgress.isCompleted) {
        await prisma.userProgress.update({
          where: { id: materialProgress.id },
          data: {
            progressRate: 100,
            isCompleted: true,
            completionDate: new Date()
          }
        });
      }
    }

    // Update course progress
    await this.updateCourseProgress(userId, lesson.courseId);

    // Update learning streak
    await this.updateLearningStreak(userId);

    return progress as ProgressWithDetails;
  }

  /**
   * Update course progress based on lesson completions
   */
  static async updateCourseProgress(userId: number, courseId: number): Promise<void> {
    // Get all lessons in the course
    const lessons = await prisma.lesson.findMany({
      where: { 
        courseId,
        isPublished: true
      }
    });

    // Get completed lessons
    const completedLessons = await prisma.userProgress.findMany({
      where: {
        userId,
        courseId,
        lessonId: { not: null },
        materialId: null, // Lesson-level progress only
        isCompleted: true
      }
    });

    // Calculate course progress percentage considering lesson duration
    let totalDuration = 0;
    let completedDuration = 0;

    for (const lesson of lessons) {
      const duration = lesson.estimatedMinutes || 60; // Default 60 minutes if not specified
      totalDuration += duration;
      
      if (completedLessons.some(cl => cl.lessonId === lesson.id)) {
        completedDuration += duration;
      }
    }

    const courseProgressRate = totalDuration > 0 
      ? Math.round((completedDuration / totalDuration) * 100)
      : 0;

    // Update or create course progress
    const courseProgress = await prisma.userProgress.findFirst({
      where: {
        userId,
        courseId,
        lessonId: null,
        materialId: null
      }
    });

    if (courseProgress) {
      await prisma.userProgress.update({
        where: { id: courseProgress.id },
        data: {
          progressRate: courseProgressRate,
          isCompleted: courseProgressRate === 100,
          completionDate: courseProgressRate === 100 ? new Date() : null
        }
      });
    } else {
      await prisma.userProgress.create({
        data: {
          userId,
          courseId,
          lessonId: null,
          materialId: null,
          progressRate: courseProgressRate,
          isCompleted: courseProgressRate === 100,
          completionDate: courseProgressRate === 100 ? new Date() : null
        }
      });
    }
  }

  /**
   * Get progress summary for a user
   */
  static async getProgressSummary(
    userId: number,
    courseId?: number
  ): Promise<ProgressSummary> {
    const courseFilter = courseId ? { courseId } : {};

    const [
      totalCourses,
      enrolledCourses,
      completedCourses,
      totalLessons,
      completedLessons,
      totalMaterials,
      completedMaterials,
      totalSpentMinutes,
      averageProgress,
      currentStreak
    ] = await Promise.all([
      // Total courses (available)
      prisma.course.count({
        where: {
          isPublished: true,
          ...courseFilter
        }
      }),
      // Enrolled courses
      prisma.userProgress.groupBy({
        by: ['courseId'],
        where: {
          userId,
          ...courseFilter
        }
      }).then(groups => groups.length),
      // Completed courses (all lessons completed)
      prisma.userProgress.groupBy({
        by: ['courseId'],
        where: {
          userId,
          isCompleted: true,
          ...courseFilter
        },
        having: {
          id: {
            _count: {
              gt: 0
            }
          }
        }
      }).then(groups => groups.length),
      // Total lessons
      prisma.lesson.count({
        where: {
          isPublished: true,
          ...courseFilter
        }
      }),
      // Completed lessons
      prisma.userProgress.count({
        where: {
          userId,
          isCompleted: true,
          lessonId: { not: null },
          ...courseFilter
        }
      }),
      // Total materials
      prisma.learningMaterial.count({
        where: {
          isPublished: true,
          lesson: courseId ? { courseId } : undefined
        }
      }),
      // Completed materials
      prisma.userProgress.count({
        where: {
          userId,
          isCompleted: true,
          materialId: { not: null },
          ...courseFilter
        }
      }),
      // Total spent minutes
      prisma.userProgress.aggregate({
        where: {
          userId,
          ...courseFilter
        },
        _sum: {
          spentMinutes: true
        }
      }).then(result => result._sum.spentMinutes || 0),
      // Average progress rate
      prisma.userProgress.aggregate({
        where: {
          userId,
          ...courseFilter
        },
        _avg: {
          progressRate: true
        }
      }).then(result => Number(result._avg.progressRate) || 0),
      // Current streak
      this.getCurrentStreak(userId)
    ]);

    return {
      totalCourses,
      enrolledCourses,
      completedCourses,
      totalLessons,
      completedLessons,
      totalMaterials,
      completedMaterials,
      totalSpentMinutes,
      averageProgress: Math.round(averageProgress * 100) / 100,
      streakDays: currentStreak
    };
  }

  /**
   * Get time series data for progress visualization
   */
  static async getTimeSeriesData(
    userId: number,
    startDate?: Date,
    endDate?: Date,
    interval: 'day' | 'week' | 'month' = 'day',
    courseId?: number
  ): Promise<TimeSeriesDataPoint[]> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days ago
    const end = endDate || new Date();

    const courseFilter = courseId ? { courseId } : {};

    // Get learning streaks data for the time series
    const streaks = await prisma.learningStreak.findMany({
      where: {
        userId,
        streakDate: {
          gte: start,
          lte: end
        }
      },
      orderBy: { streakDate: 'asc' }
    });

    // Get progress data for the time period
    const progressData = await prisma.userProgress.findMany({
      where: {
        userId,
        lastAccessed: {
          gte: start,
          lte: end
        },
        ...courseFilter
      }
    });

    // Group data by the specified interval
    const dataMap = new Map<string, TimeSeriesDataPoint>();

    // Initialize with streak data
    streaks.forEach(streak => {
      const dateKey = this.formatDateForInterval(streak.streakDate, interval);
      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, {
          date: dateKey,
          spentMinutes: streak.minutesStudied,
          completedMaterials: streak.materialsAccessed,
          progressRate: 0
        });
      } else {
        const existing = dataMap.get(dateKey)!;
        existing.spentMinutes += streak.minutesStudied;
        existing.completedMaterials += streak.materialsAccessed;
      }
    });

    // Calculate average progress rate for each interval
    const progressByDate = new Map<string, number[]>();
    progressData.forEach(progress => {
      const dateKey = this.formatDateForInterval(progress.lastAccessed, interval);
      if (!progressByDate.has(dateKey)) {
        progressByDate.set(dateKey, []);
      }
      progressByDate.get(dateKey)!.push(Number(progress.progressRate));
    });

    progressByDate.forEach((rates, dateKey) => {
      const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      if (dataMap.has(dateKey)) {
        dataMap.get(dateKey)!.progressRate = Math.round(avgRate * 100) / 100;
      } else {
        dataMap.set(dateKey, {
          date: dateKey,
          spentMinutes: 0,
          completedMaterials: 0,
          progressRate: Math.round(avgRate * 100) / 100
        });
      }
    });

    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Update learning streak for user
   */
  private static async updateLearningStreak(userId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's streak record
    const existingStreak = await prisma.learningStreak.findFirst({
      where: {
        userId,
        streakDate: today
      }
    });

    if (existingStreak) {
      await prisma.learningStreak.update({
        where: { id: existingStreak.id },
        data: {
          materialsAccessed: {
            increment: 1
          },
          pointsEarned: {
            increment: 10 // Base points for completing a material
          }
        }
      });
    } else {
      await prisma.learningStreak.create({
        data: {
          userId,
          streakDate: today,
          minutesStudied: 0,
          materialsAccessed: 1,
          lessonsCompleted: 0,
          pointsEarned: 10
        }
      });
    }
  }

  /**
   * Get current streak for user
   */
  private static async getCurrentStreak(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streakDays = 0;
    const currentDate = new Date(today);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const streak = await prisma.learningStreak.findFirst({
        where: {
          userId,
          streakDate: currentDate
        }
      });

      if (!streak || streak.materialsAccessed === 0) {
        break;
      }

      streakDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streakDays;
  }

  /**
   * Format date for time series intervals
   */
  private static formatDateForInterval(date: Date, interval: 'day' | 'week' | 'month'): string {
    switch (interval) {
      case 'day': {
        return date.toISOString().split('T')[0] || date.toISOString();
      }
      case 'week': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0] || weekStart.toISOString();
      }
      case 'month': {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      default: {
        return date.toISOString().split('T')[0];
      }
    }
  }
}
import { PrismaClient, AccessType } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { SessionData } from './progressService';

const prisma = new PrismaClient();

export interface LearningSession {
  id: number;
  userId: number;
  materialId?: number | null;
  courseId?: number;
  lessonId?: number;
  startTime: Date;
  endTime?: Date | null;
  duration: number;
  isActive: boolean;
}

export interface TimeStats {
  totalMinutes: number;
  dailyAverage: number;
  weeklyTotal: number;
  monthlyTotal: number;
  longestSession: number;
  sessionsCount: number;
  currentStreak: number;
  bestStreak: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  averageMinutesPerDay: number;
  streakHistory: {
    date: string;
    minutesStudied: number;
    materialsAccessed: number;
    lessonsCompleted: number;
  }[];
}

export class TimeTrackingService {
  /**
   * Start a new learning session
   */
  static async startSession(sessionData: SessionData): Promise<LearningSession> {
    // Validate that the referenced entities exist
    if (sessionData.materialId) {
      const material = await prisma.learningMaterial.findUnique({
        where: { id: sessionData.materialId }
      });
      if (!material) {
        throw new ValidationError('Material not found');
      }
    }

    if (sessionData.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: sessionData.courseId }
      });
      if (!course) {
        throw new ValidationError('Course not found');
      }
    }

    if (sessionData.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: sessionData.lessonId }
      });
      if (!lesson) {
        throw new ValidationError('Lesson not found');
      }
    }

    // End any existing active sessions for this user
    await this.endActiveUserSessions(sessionData.userId);

    // Create a new material access record to track the session
    const access = await prisma.userMaterialAccess.create({
      data: {
        userId: sessionData.userId,
        materialId: sessionData.materialId,
        // For course/lesson tracking without specific material, we can use resourceId
        // but since the schema has separate material/resource, we'll handle this differently
        accessType: 'VIEW' as AccessType,
        sessionDuration: null, // Will be updated when session ends
        accessedAt: new Date()
      }
    });

    // Return session info
    return {
      id: access.id,
      userId: sessionData.userId,
      materialId: sessionData.materialId,
      courseId: sessionData.courseId,
      lessonId: sessionData.lessonId,
      startTime: access.accessedAt,
      endTime: null,
      duration: 0,
      isActive: true
    };
  }

  /**
   * Update session with time spent
   */
  static async updateSession(
    sessionId: number,
    userId: number,
    spentMinutes: number
  ): Promise<LearningSession> {
    // Find the session
    const access = await prisma.userMaterialAccess.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!access) {
      throw new NotFoundError('Session not found');
    }

    // Update session duration
    const updatedAccess = await prisma.userMaterialAccess.update({
      where: { id: sessionId },
      data: {
        sessionDuration: spentMinutes
      }
    });

    return {
      id: updatedAccess.id,
      userId: updatedAccess.userId,
      materialId: updatedAccess.materialId,
      courseId: undefined, // Not stored in access record
      lessonId: undefined, // Not stored in access record
      startTime: updatedAccess.accessedAt,
      endTime: null,
      duration: spentMinutes,
      isActive: true
    };
  }

  /**
   * End a learning session
   */
  static async endSession(
    sessionId: number,
    userId: number
  ): Promise<{ session: LearningSession; progressUpdated: boolean }> {
    // Find the session
    const access = await prisma.userMaterialAccess.findFirst({
      where: {
        id: sessionId,
        userId
      },
      include: {
        material: {
          include: {
            lesson: true
          }
        }
      }
    });

    if (!access) {
      throw new NotFoundError('Session not found');
    }

    const endTime = new Date();
    const totalMinutes = access.sessionDuration || Math.floor((endTime.getTime() - access.accessedAt.getTime()) / (1000 * 60));

    // Update the access record with final duration
    const updatedAccess = await prisma.userMaterialAccess.update({
      where: { id: sessionId },
      data: {
        sessionDuration: totalMinutes
      }
    });

    let progressUpdated = false;

    // Update progress if material is tracked
    if (access.materialId && access.material) {
      const courseId = access.material.lesson?.courseId;
      const lessonId = access.material.lessonId;

      if (courseId && lessonId) {
        // Find or create progress record
        const progress = await prisma.userProgress.findFirst({
          where: {
            userId,
            courseId,
            lessonId,
            materialId: access.materialId
          }
        });

        if (progress) {
          // Update existing progress
          await prisma.userProgress.update({
            where: { id: progress.id },
            data: {
              spentMinutes: {
                increment: totalMinutes
              },
              lastAccessed: endTime
            }
          });
          progressUpdated = true;
        } else {
          // Create new progress record
          await prisma.userProgress.create({
            data: {
              userId,
              courseId,
              lessonId,
              materialId: access.materialId,
              progressType: 'AUTO',
              progressRate: 0,
              spentMinutes: totalMinutes,
              lastAccessed: endTime
            }
          });
          progressUpdated = true;
        }
      }
    }

    // Update learning streak
    await this.updateDailyStreak(userId, totalMinutes);

    return {
      session: {
        id: updatedAccess.id,
        userId: updatedAccess.userId,
        materialId: updatedAccess.materialId,
        courseId: access.material?.lesson?.courseId,
        lessonId: access.material?.lessonId,
        startTime: updatedAccess.accessedAt,
        endTime,
        duration: totalMinutes,
        isActive: false
      },
      progressUpdated
    };
  }

  /**
   * Get time statistics for a user
   */
  static async getTimeStats(
    userId: number,
    startDate?: Date,
    endDate?: Date,
    courseId?: number
  ): Promise<TimeStats> {
    const end = endDate || new Date();
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days

    // Build where clause for progress records
    const whereClause: any = {
      userId,
      lastAccessed: {
        gte: start,
        lte: end
      }
    };

    if (courseId) {
      whereClause.courseId = courseId;
    }

    // Get progress stats
    const [
      totalMinutesResult,
      sessionsCount,
      longestSessionResult,
      streakStats
    ] = await Promise.all([
      prisma.userProgress.aggregate({
        where: whereClause,
        _sum: {
          spentMinutes: true
        }
      }),
      prisma.userProgress.count({
        where: {
          ...whereClause,
          spentMinutes: {
            gt: 0
          }
        }
      }),
      prisma.userProgress.aggregate({
        where: whereClause,
        _max: {
          spentMinutes: true
        }
      }),
      this.getStreakStats(userId)
    ]);

    const totalMinutes = totalMinutesResult._sum.spentMinutes || 0;
    const longestSession = longestSessionResult._max.spentMinutes || 0;

    // Calculate averages
    const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyAverage = Math.round((totalMinutes / daysDiff) * 100) / 100;

    // Get weekly and monthly totals
    const weekStart = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [weeklyResult, monthlyResult] = await Promise.all([
      prisma.userProgress.aggregate({
        where: {
          ...whereClause,
          lastAccessed: {
            gte: weekStart,
            lte: end
          }
        },
        _sum: {
          spentMinutes: true
        }
      }),
      prisma.userProgress.aggregate({
        where: {
          ...whereClause,
          lastAccessed: {
            gte: monthStart,
            lte: end
          }
        },
        _sum: {
          spentMinutes: true
        }
      })
    ]);

    return {
      totalMinutes,
      dailyAverage,
      weeklyTotal: weeklyResult._sum.spentMinutes || 0,
      monthlyTotal: monthlyResult._sum.spentMinutes || 0,
      longestSession,
      sessionsCount,
      currentStreak: streakStats.currentStreak,
      bestStreak: streakStats.longestStreak
    };
  }

  /**
   * Get streak statistics for a user
   */
  static async getStreakStats(userId: number): Promise<StreakStats> {
    // Get all streak records for the user
    const streaks = await prisma.learningStreak.findMany({
      where: {
        userId,
        minutesStudied: {
          gt: 0
        }
      },
      orderBy: {
        streakDate: 'desc'
      }
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate current streak
    const checkDate = new Date(today);
    for (const streak of streaks) {
      const streakDate = new Date(streak.streakDate);
      streakDate.setHours(0, 0, 0, 0);

      if (streakDate.getTime() === checkDate.getTime()) {
        currentStreak++;
        tempStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    tempStreak = 0;
    let previousDate: Date | null = null;

    for (const streak of streaks.reverse()) {
      const streakDate = new Date(streak.streakDate);
      streakDate.setHours(0, 0, 0, 0);

      if (!previousDate) {
        tempStreak = 1;
      } else {
        const dayDiff = (streakDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      previousDate = streakDate;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate total study days and average
    const totalStudyDays = streaks.length;
    const totalMinutes = streaks.reduce((sum, streak) => sum + streak.minutesStudied, 0);
    const averageMinutesPerDay = totalStudyDays > 0 ? Math.round((totalMinutes / totalStudyDays) * 100) / 100 : 0;

    // Get recent streak history (last 30 days)
    const recentStreaks = streaks.slice(0, 30).map(streak => ({
      date: streak.streakDate.toISOString().split('T')[0],
      minutesStudied: streak.minutesStudied,
      materialsAccessed: streak.materialsAccessed,
      lessonsCompleted: streak.lessonsCompleted
    }));

    return {
      currentStreak,
      longestStreak,
      totalStudyDays,
      averageMinutesPerDay,
      streakHistory: recentStreaks
    };
  }

  /**
   * End all active sessions for a user
   */
  private static async endActiveUserSessions(userId: number): Promise<void> {
    // Find any access records that might represent active sessions (no duration set)
    const activeSessions = await prisma.userMaterialAccess.findMany({
      where: {
        userId,
        sessionDuration: null,
        accessedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
        }
      }
    });

    // Update them with calculated duration
    for (const session of activeSessions) {
      const duration = Math.floor((Date.now() - session.accessedAt.getTime()) / (1000 * 60));
      await prisma.userMaterialAccess.update({
        where: { id: session.id },
        data: { sessionDuration: Math.max(1, duration) }
      });
    }
  }

  /**
   * Update daily learning streak
   */
  private static async updateDailyStreak(userId: number, minutesStudied: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update or create today's streak record
    await prisma.learningStreak.upsert({
      where: {
        userId_streakDate: {
          userId,
          streakDate: today
        }
      },
      update: {
        minutesStudied: {
          increment: minutesStudied
        }
      },
      create: {
        userId,
        streakDate: today,
        minutesStudied,
        lessonsCompleted: 0,
        materialsAccessed: 0,
        pointsEarned: 0
      }
    });
  }
}
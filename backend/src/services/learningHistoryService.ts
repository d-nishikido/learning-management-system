import { PrismaClient, UserMaterialAccess, AccessType, LearningMaterial, LearningResource, User } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import { PaginatedResponse } from '../types';

const prisma = new PrismaClient();

export interface AccessHistoryQuery {
  materialId?: number;
  resourceId?: number;
  accessType?: AccessType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface AccessHistoryWithDetails extends UserMaterialAccess {
  material?: LearningMaterial | null;
  resource?: LearningResource | null;
  user: User;
}

export interface LearningPattern {
  hourOfDay: number;
  dayOfWeek: number;
  accessCount: number;
  averageSessionDuration: number;
}

export interface DetailedLearningHistory {
  totalAccesses: number;
  totalSessionTime: number;
  averageSessionTime: number;
  mostActiveHour: number;
  mostActiveDay: string;
  recentAccesses: AccessHistoryWithDetails[];
  learningPatterns: LearningPattern[];
  materialBreakdown: {
    materialId: number;
    materialTitle: string;
    accessCount: number;
    totalTime: number;
  }[];
}

export interface LearningStatsReport {
  userId: number;
  periodStart: Date;
  periodEnd: Date;
  totalStudyTime: number;
  totalMaterialsAccessed: number;
  uniqueMaterialsAccessed: number;
  averageDailyStudyTime: number;
  longestStudySession: number;
  shortestStudySession: number;
  mostUsedAccessType: AccessType;
  dailyBreakdown: {
    date: string;
    studyTime: number;
    materialsAccessed: number;
    sessionsCount: number;
  }[];
  hourlyBreakdown: {
    hour: number;
    accessCount: number;
    totalTime: number;
  }[];
  weeklyBreakdown: {
    dayOfWeek: string;
    accessCount: number;
    totalTime: number;
  }[];
}

export class LearningHistoryService {
  /**
   * Get access history for a user with filtering and pagination
   */
  static async getAccessHistory(
    userId: number,
    query: AccessHistoryQuery
  ): Promise<PaginatedResponse<AccessHistoryWithDetails>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = {
      userId,
      ...(query.materialId && { materialId: query.materialId }),
      ...(query.resourceId && { resourceId: query.resourceId }),
      ...(query.accessType && { accessType: query.accessType }),
      ...(query.startDate && query.endDate && {
        accessedAt: {
          gte: query.startDate,
          lte: query.endDate
        }
      })
    };

    const [accessHistory, total] = await Promise.all([
      prisma.userMaterialAccess.findMany({
        where,
        include: {
          user: true,
          material: true,
          resource: true
        },
        orderBy: { accessedAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.userMaterialAccess.count({ where })
    ]);

    return {
      data: accessHistory,
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
   * Get detailed learning history for a user
   */
  static async getDetailedLearningHistory(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<DetailedLearningHistory> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days ago
    const end = endDate || new Date();

    // Get all access records for the period
    const accessRecords = await prisma.userMaterialAccess.findMany({
      where: {
        userId,
        accessedAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        user: true,
        material: true,
        resource: true
      },
      orderBy: { accessedAt: 'desc' }
    });

    // Calculate basic stats
    const totalAccesses = accessRecords.length;
    const totalSessionTime = accessRecords.reduce((sum, record) => 
      sum + (record.sessionDuration || 0), 0
    );
    const averageSessionTime = totalAccesses > 0 ? totalSessionTime / totalAccesses : 0;

    // Find most active patterns
    const hourlyAccess = new Map<number, number>();
    const dailyAccess = new Map<number, number>();
    
    accessRecords.forEach(record => {
      const hour = record.accessedAt.getHours();
      const day = record.accessedAt.getDay();
      
      hourlyAccess.set(hour, (hourlyAccess.get(hour) || 0) + 1);
      dailyAccess.set(day, (dailyAccess.get(day) || 0) + 1);
    });

    const mostActiveHour = Array.from(hourlyAccess.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDay = dayNames[Array.from(dailyAccess.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 0] || 'Sunday';

    // Generate learning patterns
    const learningPatterns: LearningPattern[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let day = 0; day < 7; day++) {
        const records = accessRecords.filter(r => 
          r.accessedAt.getHours() === hour && r.accessedAt.getDay() === day
        );
        
        if (records.length > 0) {
          learningPatterns.push({
            hourOfDay: hour,
            dayOfWeek: day,
            accessCount: records.length,
            averageSessionDuration: records.reduce((sum, r) => 
              sum + (r.sessionDuration || 0), 0
            ) / records.length
          });
        }
      }
    }

    // Material breakdown
    const materialMap = new Map<number, {
      materialId: number;
      materialTitle: string;
      accessCount: number;
      totalTime: number;
    }>();

    accessRecords.forEach(record => {
      if (record.materialId && record.material) {
        const existing = materialMap.get(record.materialId) || {
          materialId: record.materialId,
          materialTitle: record.material.title,
          accessCount: 0,
          totalTime: 0
        };
        
        existing.accessCount++;
        existing.totalTime += record.sessionDuration || 0;
        materialMap.set(record.materialId, existing);
      }
    });

    const materialBreakdown = Array.from(materialMap.values())
      .sort((a, b) => b.accessCount - a.accessCount);

    return {
      totalAccesses,
      totalSessionTime,
      averageSessionTime,
      mostActiveHour,
      mostActiveDay,
      recentAccesses: accessRecords.slice(0, 10), // Latest 10 accesses
      learningPatterns: learningPatterns.sort((a, b) => b.accessCount - a.accessCount),
      materialBreakdown
    };
  }

  /**
   * Generate comprehensive learning statistics report
   */
  static async generateLearningStatsReport(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<LearningStatsReport> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get all access records for the period
    const accessRecords = await prisma.userMaterialAccess.findMany({
      where: {
        userId,
        accessedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        material: true,
        resource: true
      },
      orderBy: { accessedAt: 'desc' }
    });

    // Calculate basic statistics
    const totalStudyTime = accessRecords.reduce((sum, record) => 
      sum + (record.sessionDuration || 0), 0
    );
    
    const totalMaterialsAccessed = accessRecords.length;
    const uniqueMaterialIds = new Set(accessRecords
      .filter(r => r.materialId)
      .map(r => r.materialId)
    );
    const uniqueMaterialsAccessed = uniqueMaterialIds.size;

    // Calculate period duration in days
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const averageDailyStudyTime = totalStudyTime / periodDays;

    // Find longest and shortest sessions
    const sessionDurations = accessRecords
      .map(r => r.sessionDuration || 0)
      .filter(duration => duration > 0);
    
    const longestStudySession = sessionDurations.length > 0 ? Math.max(...sessionDurations) : 0;
    const shortestStudySession = sessionDurations.length > 0 ? Math.min(...sessionDurations) : 0;

    // Find most used access type
    const accessTypeCounts = new Map<AccessType, number>();
    accessRecords.forEach(record => {
      accessTypeCounts.set(
        record.accessType, 
        (accessTypeCounts.get(record.accessType) || 0) + 1
      );
    });
    
    const mostUsedAccessType = Array.from(accessTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'VIEW';

    // Daily breakdown
    const dailyMap = new Map<string, {
      studyTime: number;
      materialsAccessed: number;
      sessionsCount: number;
    }>();

    accessRecords.forEach(record => {
      const dateKey = record.accessedAt.toISOString().split('T')[0];
      if (dateKey) {
        const existing = dailyMap.get(dateKey) || {
          studyTime: 0,
          materialsAccessed: 0,
          sessionsCount: 0
        };
        
        existing.studyTime += record.sessionDuration || 0;
        existing.materialsAccessed++;
        existing.sessionsCount++;
        dailyMap.set(dateKey, existing);
      }
    });

    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Hourly breakdown
    const hourlyMap = new Map<number, { accessCount: number; totalTime: number }>();
    accessRecords.forEach(record => {
      const hour = record.accessedAt.getHours();
      const existing = hourlyMap.get(hour) || { accessCount: 0, totalTime: 0 };
      
      existing.accessCount++;
      existing.totalTime += record.sessionDuration || 0;
      hourlyMap.set(hour, existing);
    });

    const hourlyBreakdown = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      ...data
    })).sort((a, b) => a.hour - b.hour);

    // Weekly breakdown
    const weeklyMap = new Map<number, { accessCount: number; totalTime: number }>();
    accessRecords.forEach(record => {
      const dayOfWeek = record.accessedAt.getDay();
      const existing = weeklyMap.get(dayOfWeek) || { accessCount: 0, totalTime: 0 };
      
      existing.accessCount++;
      existing.totalTime += record.sessionDuration || 0;
      weeklyMap.set(dayOfWeek, existing);
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyBreakdown = Array.from(weeklyMap.entries()).map(([day, data]) => ({
      dayOfWeek: dayNames[day] || 'Sunday',
      ...data
    })).sort((a, b) => dayNames.indexOf(a.dayOfWeek) - dayNames.indexOf(b.dayOfWeek));

    return {
      userId,
      periodStart: startDate,
      periodEnd: endDate,
      totalStudyTime,
      totalMaterialsAccessed,
      uniqueMaterialsAccessed,
      averageDailyStudyTime,
      longestStudySession,
      shortestStudySession,
      mostUsedAccessType,
      dailyBreakdown,
      hourlyBreakdown,
      weeklyBreakdown
    };
  }

  /**
   * Record material access for learning history tracking
   */
  static async recordMaterialAccess(
    userId: number,
    materialId: number,
    accessType: AccessType,
    sessionDuration?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserMaterialAccess> {
    // Verify material exists
    const material = await prisma.learningMaterial.findUnique({
      where: { id: materialId }
    });

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    // Record access
    const access = await prisma.userMaterialAccess.create({
      data: {
        userId,
        materialId,
        accessType,
        sessionDuration: sessionDuration || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        accessedAt: new Date()
      }
    });

    return access;
  }

  /**
   * Record resource access for learning history tracking
   */
  static async recordResourceAccess(
    userId: number,
    resourceId: number,
    accessType: AccessType,
    sessionDuration?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserMaterialAccess> {
    // Verify resource exists
    const resource = await prisma.learningResource.findUnique({
      where: { id: resourceId }
    });

    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    // Record access
    const access = await prisma.userMaterialAccess.create({
      data: {
        userId,
        resourceId,
        accessType,
        sessionDuration: sessionDuration || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        accessedAt: new Date()
      }
    });

    return access;
  }
}
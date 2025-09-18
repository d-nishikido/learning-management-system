import { Response } from 'express';
import { ProgressService, CreateProgressData, UpdateProgressData, ProgressQuery, SessionData } from '../services/progressService';
import { TimeTrackingService } from '../services/timeTrackingService';
import { ApiResponse, RequestWithUser } from '../types';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { ProgressType } from '@prisma/client';

export interface ProgressCreateRequest {
  courseId: number;
  lessonId?: number;
  materialId?: number;
  progressType?: ProgressType;
  progressRate?: number;
  spentMinutes?: number;
  notes?: string;
}

export interface ProgressUpdateRequest {
  progressRate?: number;
  spentMinutes?: number;
  isCompleted?: boolean;
  notes?: string;
}

export interface ManualProgressRequest {
  progressRate: number;
  spentMinutes?: number;
  notes?: string;
}

export interface SessionStartRequest {
  materialId?: number;
  courseId?: number;
  lessonId?: number;
}

export interface SessionUpdateRequest {
  spentMinutes: number;
}

export interface ProgressQueryRequest {
  courseId?: string;
  lessonId?: string;
  materialId?: string;
  isCompleted?: string;
  progressType?: string;
  page?: string;
  limit?: string;
}

export interface TimeStatsQueryRequest {
  startDate?: string;
  endDate?: string;
  courseId?: string;
}

export interface TimeSeriesQueryRequest {
  startDate?: string;
  endDate?: string;
  interval?: string;
  courseId?: string;
}

export class ProgressController {
  /**
   * GET /progress/me
   * Get current user's all progress
   */
  static async getUserProgress(
    req: RequestWithUser<{}, ApiResponse, {}, ProgressQueryRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: ProgressQuery = {
        ...(req.query.courseId && { courseId: parseInt(req.query.courseId) }),
        ...(req.query.lessonId && { lessonId: parseInt(req.query.lessonId) }),
        ...(req.query.materialId && { materialId: parseInt(req.query.materialId) }),
        ...(req.query.isCompleted && { isCompleted: req.query.isCompleted === 'true' }),
        ...(req.query.progressType && { progressType: req.query.progressType as ProgressType }),
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 20
      };

      const progress = await ProgressService.getAllUserProgress(userId, query);
      
      res.status(200).json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Error getting user progress:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /progress/courses/:courseId
   * Get progress for specific course
   */
  static async getCourseProgress(
    req: RequestWithUser<{ courseId: string }, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const courseId = parseInt(req.params.courseId);

      const progress = await ProgressService.getCourseProgress(userId, courseId);
      
      res.status(200).json({
        success: true,
        data: progress
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      console.error('Error getting course progress:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get course progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /progress/lessons/:lessonId
   * Get progress for specific lesson
   */
  static async getLessonProgress(
    req: RequestWithUser<{ lessonId: string }, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const lessonId = parseInt(req.params.lessonId);

      const progress = await ProgressService.getLessonProgress(userId, lessonId);
      
      res.status(200).json({
        success: true,
        data: progress
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      console.error('Error getting lesson progress:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get lesson progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /progress/materials/:materialId
   * Get progress for specific material
   */
  static async getMaterialProgress(
    req: RequestWithUser<{ materialId: string }, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const materialId = parseInt(req.params.materialId);

      const progress = await ProgressService.getMaterialProgress(userId, materialId);
      
      res.status(200).json({
        success: true,
        data: progress
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      console.error('Error getting material progress:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get material progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /progress
   * Create new progress record
   */
  static async createProgress(
    req: RequestWithUser<{}, ApiResponse, ProgressCreateRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const progressData: CreateProgressData = {
        userId,
        courseId: req.body.courseId,
        ...(req.body.lessonId && { lessonId: req.body.lessonId }),
        ...(req.body.materialId && { materialId: req.body.materialId }),
        progressType: req.body.progressType || 'AUTO',
        progressRate: req.body.progressRate || 0,
        spentMinutes: req.body.spentMinutes || 0,
        ...(req.body.notes && { notes: req.body.notes })
      };

      const progress = await ProgressService.createProgress(progressData);
      
      res.status(201).json({
        success: true,
        data: progress,
        message: 'Progress record created successfully'
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        res.status(409).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      console.error('Error creating progress:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create progress record',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PUT /progress/:id
   * Update progress record
   */
  static async updateProgress(
    req: RequestWithUser<{ id: string }, ApiResponse, ProgressUpdateRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const progressId = parseInt(req.params.id);
      const updateData: UpdateProgressData = {
        ...(req.body.progressRate !== undefined && { progressRate: req.body.progressRate }),
        ...(req.body.spentMinutes !== undefined && { spentMinutes: req.body.spentMinutes }),
        ...(req.body.isCompleted !== undefined && { isCompleted: req.body.isCompleted }),
        ...(req.body.notes && { notes: req.body.notes })
      };

      const progress = await ProgressService.updateProgress(progressId, userId, updateData);
      
      res.status(200).json({
        success: true,
        data: progress,
        message: 'Progress updated successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      console.error('Error updating progress:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * DELETE /progress/:id
   * Delete progress record (Admin only)
   */
  static async deleteProgress(
    req: RequestWithUser<{ id: string }, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const progressId = parseInt(req.params.id);

      await ProgressService.deleteProgress(progressId);
      
      res.status(200).json({
        success: true,
        message: 'Progress record deleted successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      console.error('Error deleting progress:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete progress record',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PUT /progress/materials/:materialId/manual
   * Update manual progress for material
   */
  static async updateManualProgress(
    req: RequestWithUser<{ materialId: string }, ApiResponse, ManualProgressRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const materialId = parseInt(req.params.materialId);
      const { progressRate, spentMinutes, notes } = req.body;

      const progress = await ProgressService.updateManualProgress(
        userId,
        materialId,
        progressRate,
        spentMinutes,
        notes
      );
      
      res.status(200).json({
        success: true,
        data: progress,
        message: 'Manual progress updated successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      console.error('Error updating manual progress:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update manual progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /progress/materials/:materialId/complete
   * Mark material as completed
   */
  static async markMaterialComplete(
    req: RequestWithUser<{ materialId: string }, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const materialId = parseInt(req.params.materialId);

      const progress = await ProgressService.markMaterialComplete(userId, materialId);
      
      res.status(200).json({
        success: true,
        data: progress,
        message: 'Material marked as completed'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      console.error('Error marking material complete:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark material as completed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /progress/lessons/:lessonId/complete
   * Mark lesson as completed
   */
  static async markLessonComplete(
    req: RequestWithUser<{ lessonId: string }, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const lessonId = parseInt(req.params.lessonId);

      const progress = await ProgressService.markLessonComplete(userId, lessonId);
      
      res.status(200).json({
        success: true,
        data: progress,
        message: 'Lesson marked as completed'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      console.error('Error marking lesson complete:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark lesson as completed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /progress/sessions/start
   * Start learning session
   */
  static async startLearningSession(
    req: RequestWithUser<{}, ApiResponse, SessionStartRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionData: SessionData = {
        userId,
        ...(req.body.materialId && { materialId: req.body.materialId }),
        ...(req.body.courseId && { courseId: req.body.courseId }),
        ...(req.body.lessonId && { lessonId: req.body.lessonId })
      };

      const session = await TimeTrackingService.startSession(sessionData);
      
      res.status(201).json({
        success: true,
        data: session,
        message: 'Learning session started'
      });
    } catch (error) {
      console.error('Error starting learning session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start learning session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PUT /progress/sessions/:sessionId/update
   * Update learning session time
   */
  static async updateLearningSession(
    req: RequestWithUser<{ sessionId: string }, ApiResponse, SessionUpdateRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = parseInt(req.params.sessionId);
      const { spentMinutes } = req.body;

      const session = await TimeTrackingService.updateSession(sessionId, userId, spentMinutes);
      
      res.status(200).json({
        success: true,
        data: session,
        message: 'Learning session updated'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      console.error('Error updating learning session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update learning session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /progress/sessions/:sessionId/end
   * End learning session
   */
  static async endLearningSession(
    req: RequestWithUser<{ sessionId: string }, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = parseInt(req.params.sessionId);

      const result = await TimeTrackingService.endSession(sessionId, userId);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Learning session ended'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      console.error('Error ending learning session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to end learning session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /progress/time-stats
   * Get learning time statistics
   */
  static async getTimeStats(
    req: RequestWithUser<{}, ApiResponse, {}, TimeStatsQueryRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
      const courseId = req.query.courseId ? parseInt(req.query.courseId) : undefined;

      const stats = await TimeTrackingService.getTimeStats(userId, startDate, endDate, courseId);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting time stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get time statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /progress/stats/summary
   * Get progress summary statistics
   */
  static async getProgressSummary(
    req: RequestWithUser<{}, ApiResponse, {}, { courseId?: string }>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const courseId = req.query.courseId ? parseInt(req.query.courseId) : undefined;

      const summary = await ProgressService.getProgressSummary(userId, courseId);
      
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting progress summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get progress summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /progress/stats/streaks
   * Get learning streak information
   */
  static async getStreakStats(
    req: RequestWithUser<{}, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;

      const streaks = await TimeTrackingService.getStreakStats(userId);
      
      res.status(200).json({
        success: true,
        data: streaks
      });
    } catch (error) {
      console.error('Error getting streak stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get streak statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /progress/stats/time-series
   * Get time-series progress data
   */
  static async getTimeSeriesData(
    req: RequestWithUser<{}, ApiResponse, {}, TimeSeriesQueryRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
      const interval = req.query.interval as 'day' | 'week' | 'month' || 'day';
      const courseId = req.query.courseId ? parseInt(req.query.courseId) : undefined;

      const data = await ProgressService.getTimeSeriesData(userId, startDate, endDate, interval, courseId);
      
      res.status(200).json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Error getting time series data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get time series data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
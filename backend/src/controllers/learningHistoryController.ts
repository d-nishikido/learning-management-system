import { Response } from 'express';
import { 
  LearningHistoryService, 
  AccessHistoryQuery, 
  DetailedLearningHistory,
  LearningStatsReport 
} from '../services/learningHistoryService';
import { ApiResponse, RequestWithUser } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';
import { AccessType } from '@prisma/client';

export interface AccessHistoryQueryRequest {
  materialId?: string;
  resourceId?: string;
  accessType?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}

export interface DetailedHistoryQueryRequest {
  startDate?: string;
  endDate?: string;
}

export interface StatsReportQueryRequest {
  startDate: string;
  endDate: string;
}

export interface RecordAccessRequest {
  materialId?: number;
  resourceId?: number;
  accessType: AccessType;
  sessionDuration?: number;
}

export class LearningHistoryController {
  /**
   * GET /api/progress/history/access
   * Get access history for current user
   */
  static async getAccessHistory(
    req: RequestWithUser<{}, ApiResponse, {}, AccessHistoryQueryRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const query: AccessHistoryQuery = {
        ...(req.query.materialId && { materialId: parseInt(req.query.materialId) }),
        ...(req.query.resourceId && { resourceId: parseInt(req.query.resourceId) }),
        ...(req.query.accessType && { accessType: req.query.accessType as AccessType }),
        ...(req.query.startDate && { startDate: new Date(req.query.startDate) }),
        ...(req.query.endDate && { endDate: new Date(req.query.endDate) }),
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 20
      };

      const accessHistory = await LearningHistoryService.getAccessHistory(userId, query);
      
      res.status(200).json({
        success: true,
        data: accessHistory
      });
    } catch (error) {
      console.error('Error getting access history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get access history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/progress/history/detailed
   * Get detailed learning history for current user
   */
  static async getDetailedHistory(
    req: RequestWithUser<{}, ApiResponse, {}, DetailedHistoryQueryRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;

      const detailedHistory = await LearningHistoryService.getDetailedLearningHistory(
        userId, 
        startDate, 
        endDate
      );
      
      res.status(200).json({
        success: true,
        data: detailedHistory
      });
    } catch (error) {
      console.error('Error getting detailed history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get detailed learning history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/progress/stats/reports
   * Generate learning statistics report
   */
  static async generateStatsReport(
    req: RequestWithUser<{}, ApiResponse, {}, StatsReportQueryRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      
      if (!req.query.startDate || !req.query.endDate) {
        res.status(400).json({
          success: false,
          error: 'Start date and end date are required'
        });
        return;
      }

      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format'
        });
        return;
      }

      if (startDate >= endDate) {
        res.status(400).json({
          success: false,
          error: 'Start date must be before end date'
        });
        return;
      }

      const report = await LearningHistoryService.generateLearningStatsReport(
        userId,
        startDate,
        endDate
      );
      
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      console.error('Error generating stats report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate learning statistics report',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/progress/stats/patterns
   * Get learning patterns analysis
   */
  static async getLearningPatterns(
    req: RequestWithUser<{}, ApiResponse, {}, DetailedHistoryQueryRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;

      const detailedHistory = await LearningHistoryService.getDetailedLearningHistory(
        userId, 
        startDate, 
        endDate
      );
      
      // Extract only the patterns data
      const patterns = {
        mostActiveHour: detailedHistory.mostActiveHour,
        mostActiveDay: detailedHistory.mostActiveDay,
        learningPatterns: detailedHistory.learningPatterns,
        materialBreakdown: detailedHistory.materialBreakdown
      };
      
      res.status(200).json({
        success: true,
        data: patterns
      });
    } catch (error) {
      console.error('Error getting learning patterns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get learning patterns',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/progress/history/record-access
   * Record material or resource access
   */
  static async recordAccess(
    req: RequestWithUser<{}, ApiResponse, RecordAccessRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { materialId, resourceId, accessType, sessionDuration } = req.body;

      // Validate that either materialId or resourceId is provided
      if (!materialId && !resourceId) {
        res.status(400).json({
          success: false,
          error: 'Either materialId or resourceId must be provided'
        });
        return;
      }

      // Validate that only one is provided
      if (materialId && resourceId) {
        res.status(400).json({
          success: false,
          error: 'Cannot specify both materialId and resourceId'
        });
        return;
      }

      // Get client IP and user agent from request
      const ipAddress = req.ip || req.connection.remoteAddress || undefined;
      const userAgent = req.get('User-Agent') || undefined;

      let access;
      if (materialId) {
        access = await LearningHistoryService.recordMaterialAccess(
          userId,
          materialId,
          accessType,
          sessionDuration,
          ipAddress,
          userAgent
        );
      } else if (resourceId) {
        access = await LearningHistoryService.recordResourceAccess(
          userId,
          resourceId,
          accessType,
          sessionDuration,
          ipAddress,
          userAgent
        );
      }
      
      res.status(201).json({
        success: true,
        data: access,
        message: 'Access recorded successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      console.error('Error recording access:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record access',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
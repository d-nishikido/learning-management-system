import { Request, Response } from 'express';
import { LessonService, CreateLessonData, UpdateLessonData, LessonQuery } from '../services/lessonService';
import { ApiResponse, RequestWithUser } from '../types';
import { NotFoundError, ConflictError } from '../utils/errors';

export interface LessonCreateRequest {
  title: string;
  description?: string;
  content?: string;
  estimatedMinutes?: number;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface LessonUpdateRequest {
  title?: string;
  description?: string;
  content?: string;
  estimatedMinutes?: number;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface LessonQueryRequest {
  isPublished?: boolean;
  search?: string;
  page?: string;
  limit?: string;
}

export interface LessonOrderUpdateRequest {
  sortOrder: number;
}

export class LessonController {
  /**
   * POST /courses/:courseId/lessons
   * Create a new lesson (Admin only)
   */
  static async createLesson(
    req: RequestWithUser<{ courseId: string }, ApiResponse, LessonCreateRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const courseId = parseInt(req.params.courseId, 10);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
        });
        return;
      }

      const lessonData: CreateLessonData = {
        courseId,
        title: req.body.title,
        ...(req.body.description !== undefined && { description: req.body.description }),
        ...(req.body.content !== undefined && { content: req.body.content }),
        ...(req.body.estimatedMinutes !== undefined && { estimatedMinutes: req.body.estimatedMinutes }),
        ...(req.body.sortOrder !== undefined && { sortOrder: req.body.sortOrder }),
        ...(req.body.isPublished !== undefined && { isPublished: req.body.isPublished }),
      };

      const lesson = await LessonService.createLesson(lessonData);

      res.status(201).json({
        success: true,
        data: lesson,
        message: 'Lesson created successfully',
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  /**
   * GET /courses/:courseId/lessons
   * Get all lessons for a course with filtering and pagination
   */
  static async getLessonsByCourse(
    req: Request<{ courseId: string }, ApiResponse, {}, LessonQueryRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const courseId = parseInt(req.params.courseId, 10);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
        });
        return;
      }

      const query: LessonQuery = {};
      
      if (req.query.isPublished !== undefined) query.isPublished = req.query.isPublished;
      if (req.query.search) query.search = req.query.search;
      if (req.query.page) query.page = parseInt(req.query.page, 10);
      if (req.query.limit) query.limit = parseInt(req.query.limit, 10);

      // Get user information from authenticated request
      const user = (req as RequestWithUser).user;
      const userId = user?.id;
      const userRole = user?.role;

      const result = await LessonService.getLessonsByCourse(courseId, query, userId, userRole);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Lessons retrieved successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  /**
   * GET /courses/:courseId/lessons/:id
   * Get lesson by ID
   */
  static async getLessonById(
    req: Request<{ courseId: string; id: string }, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const lessonId = parseInt(req.params.id, 10);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
        });
        return;
      }

      if (isNaN(lessonId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid lesson ID',
        });
        return;
      }

      // Check if user is admin to include unpublished lessons
      const user = (req as RequestWithUser).user;
      const includeUnpublished = user?.role === 'ADMIN';
      const userId = user?.id;

      const lesson = await LessonService.getLessonById(courseId, lessonId, includeUnpublished, userId);

      res.status(200).json({
        success: true,
        data: lesson,
        message: 'Lesson retrieved successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  /**
   * PUT /courses/:courseId/lessons/:id
   * Update lesson (Admin only)
   */
  static async updateLesson(
    req: RequestWithUser<{ courseId: string; id: string }, ApiResponse, LessonUpdateRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const lessonId = parseInt(req.params.id, 10);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
        });
        return;
      }

      if (isNaN(lessonId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid lesson ID',
        });
        return;
      }

      const updateData: UpdateLessonData = {};
      
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.content !== undefined) updateData.content = req.body.content;
      if (req.body.estimatedMinutes !== undefined) updateData.estimatedMinutes = req.body.estimatedMinutes;
      if (req.body.sortOrder !== undefined) updateData.sortOrder = req.body.sortOrder;
      if (req.body.isPublished !== undefined) updateData.isPublished = req.body.isPublished;

      const lesson = await LessonService.updateLesson(courseId, lessonId, updateData);

      res.status(200).json({
        success: true,
        data: lesson,
        message: 'Lesson updated successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error instanceof ConflictError) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  /**
   * DELETE /courses/:courseId/lessons/:id
   * Delete lesson (Admin only)
   */
  static async deleteLesson(
    req: RequestWithUser<{ courseId: string; id: string }, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const lessonId = parseInt(req.params.id, 10);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
        });
        return;
      }

      if (isNaN(lessonId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid lesson ID',
        });
        return;
      }

      await LessonService.deleteLesson(courseId, lessonId);

      res.status(200).json({
        success: true,
        message: 'Lesson deleted successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error instanceof ConflictError) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  /**
   * PATCH /courses/:courseId/lessons/:id/order
   * Update lesson order (Admin only)
   */
  static async updateLessonOrder(
    req: RequestWithUser<{ courseId: string; id: string }, ApiResponse, LessonOrderUpdateRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const lessonId = parseInt(req.params.id, 10);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
        });
        return;
      }

      if (isNaN(lessonId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid lesson ID',
        });
        return;
      }

      if (typeof req.body.sortOrder !== 'number' || req.body.sortOrder < 1) {
        res.status(400).json({
          success: false,
          error: 'Sort order must be a positive number',
        });
        return;
      }

      const lesson = await LessonService.updateLessonOrder(courseId, lessonId, req.body.sortOrder);

      res.status(200).json({
        success: true,
        data: lesson,
        message: 'Lesson order updated successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
}
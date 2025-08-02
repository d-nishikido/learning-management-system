import { Request, Response } from 'express';
import { CourseService, CreateCourseData, UpdateCourseData, CourseQuery } from '../services/courseService';
import { ApiResponse, RequestWithUser } from '../types';
import { NotFoundError, ConflictError } from '../utils/errors';
import { DifficultyLevel } from '@prisma/client';

export interface CourseCreateRequest {
  title: string;
  description?: string;
  category: string;
  difficultyLevel?: DifficultyLevel;
  estimatedHours?: number;
  thumbnailUrl?: string;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface CourseUpdateRequest {
  title?: string;
  description?: string;
  category?: string;
  difficultyLevel?: DifficultyLevel;
  estimatedHours?: number;
  thumbnailUrl?: string;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface CourseQueryRequest {
  category?: string;
  difficultyLevel?: DifficultyLevel;
  isPublished?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export class CourseController {
  /**
   * POST /courses
   * Create a new course (Admin only)
   */
  static async createCourse(
    req: RequestWithUser<{}, ApiResponse, CourseCreateRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const courseData: CreateCourseData = {
        title: req.body.title,
        category: req.body.category,
        createdBy: req.user!.id,
        ...(req.body.description !== undefined && { description: req.body.description }),
        ...(req.body.difficultyLevel !== undefined && { difficultyLevel: req.body.difficultyLevel }),
        ...(req.body.estimatedHours !== undefined && { estimatedHours: req.body.estimatedHours }),
        ...(req.body.thumbnailUrl !== undefined && { thumbnailUrl: req.body.thumbnailUrl }),
        ...(req.body.isPublished !== undefined && { isPublished: req.body.isPublished }),
        ...(req.body.sortOrder !== undefined && { sortOrder: req.body.sortOrder }),
      };

      const course = await CourseService.createCourse(courseData);

      res.status(201).json({
        success: true,
        data: course,
        message: 'Course created successfully',
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
   * GET /courses
   * Get all courses with filtering and pagination
   */
  static async getAllCourses(
    req: Request<{}, ApiResponse, {}, CourseQueryRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const query: CourseQuery = {};
      
      if (req.query.category) query.category = req.query.category;
      if (req.query.difficultyLevel) query.difficultyLevel = req.query.difficultyLevel;
      if (req.query.isPublished !== undefined) query.isPublished = req.query.isPublished === 'true';
      if (req.query.search) query.search = req.query.search;
      if (req.query.page) query.page = parseInt(req.query.page, 10);
      if (req.query.limit) query.limit = parseInt(req.query.limit, 10);

      // Check if user is admin to include unpublished courses
      const user = (req as RequestWithUser).user;
      const includeUnpublished = user?.role === 'ADMIN';

      const result = await CourseService.getAllCourses(query, includeUnpublished);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Courses retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  /**
   * GET /courses/:id
   * Get course by ID
   */
  static async getCourseById(
    req: Request<{ id: string }, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const courseId = parseInt(req.params.id, 10);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
        });
        return;
      }

      // Check if user is admin to include unpublished courses
      const user = (req as RequestWithUser).user;
      const includeUnpublished = user?.role === 'ADMIN';

      const course = await CourseService.getCourseById(courseId, includeUnpublished);

      res.status(200).json({
        success: true,
        data: course,
        message: 'Course retrieved successfully',
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
   * PUT /courses/:id
   * Update course (Admin only)
   */
  static async updateCourse(
    req: Request<{ id: string }, ApiResponse, CourseUpdateRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const courseId = parseInt(req.params.id, 10);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
        });
        return;
      }

      const updateData: UpdateCourseData = {};
      
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.category !== undefined) updateData.category = req.body.category;
      if (req.body.difficultyLevel !== undefined) updateData.difficultyLevel = req.body.difficultyLevel;
      if (req.body.estimatedHours !== undefined) updateData.estimatedHours = req.body.estimatedHours;
      if (req.body.thumbnailUrl !== undefined) updateData.thumbnailUrl = req.body.thumbnailUrl;
      if (req.body.isPublished !== undefined) updateData.isPublished = req.body.isPublished;
      if (req.body.sortOrder !== undefined) updateData.sortOrder = req.body.sortOrder;

      const course = await CourseService.updateCourse(courseId, updateData);

      res.status(200).json({
        success: true,
        data: course,
        message: 'Course updated successfully',
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
   * DELETE /courses/:id
   * Delete course (Admin only)
   */
  static async deleteCourse(
    req: Request<{ id: string }, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const courseId = parseInt(req.params.id, 10);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
        });
        return;
      }

      await CourseService.deleteCourse(courseId);

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
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
   * POST /courses/:id/enroll
   * Enroll in course (Authenticated users only)
   */
  static async enrollInCourse(
    req: RequestWithUser<{ id: string }, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const courseId = parseInt(req.params.id, 10);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
        });
        return;
      }

      const userId = req.user!.id;
      const progress = await CourseService.enrollInCourse(userId, courseId);

      res.status(201).json({
        success: true,
        data: progress,
        message: 'Successfully enrolled in course',
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
   * DELETE /courses/:id/enroll
   * Unenroll from course (Authenticated users only)
   */
  static async unenrollFromCourse(
    req: RequestWithUser<{ id: string }, ApiResponse>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const courseId = parseInt(req.params.id, 10);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid course ID',
        });
        return;
      }

      const userId = req.user!.id;
      await CourseService.unenrollFromCourse(userId, courseId);

      res.status(200).json({
        success: true,
        message: 'Successfully unenrolled from course',
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
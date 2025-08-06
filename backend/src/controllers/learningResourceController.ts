import { Response, NextFunction } from 'express';
import { LearningResourceService, CreateLearningResourceData, UpdateLearningResourceData, LearningResourceQuery } from '../services/learningResourceService';
import { ApiResponse, RequestWithUser } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';

interface LearningResourceCourseParams {
  courseId: string;
}

interface LearningResourceLessonParams {
  courseId: string;
  lessonId: string;
}

interface LearningResourceParams {
  id: string;
}

export class LearningResourceController {
  /**
   * GET /courses/:courseId/resources
   * Get all learning resources for a course with filtering and pagination
   */
  static async getLearningResourcesByCourse(req: RequestWithUser<LearningResourceCourseParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const courseId = parseInt(req.params.courseId);
      const query: LearningResourceQuery = req.query;
      const includeUnpublished = req.user?.role === 'ADMIN';

      const result = await LearningResourceService.getLearningResourcesByCourse(courseId, query, includeUnpublished);

      res.status(200).json({
        success: true,
        message: 'Learning resources retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /courses/:courseId/lessons/:lessonId/resources
   * Get all learning resources for a lesson with filtering and pagination
   */
  static async getLearningResourcesByLesson(req: RequestWithUser<LearningResourceLessonParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const query: LearningResourceQuery = req.query;
      const includeUnpublished = req.user?.role === 'ADMIN';

      const result = await LearningResourceService.getLearningResourcesByLesson(lessonId, query, includeUnpublished);

      res.status(200).json({
        success: true,
        message: 'Learning resources retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /resources/search
   * Search learning resources across the system
   */
  static async searchLearningResources(req: RequestWithUser, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const query: LearningResourceQuery = req.query;
      const includeUnpublished = req.user?.role === 'ADMIN';

      const result = await LearningResourceService.searchLearningResources(query, includeUnpublished);

      res.status(200).json({
        success: true,
        message: 'Learning resources retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /resources/:id
   * Get learning resource by ID with detailed information
   */
  static async getLearningResourceById(req: RequestWithUser<LearningResourceParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const resourceId = parseInt(req.params.id);
      const includeUnpublished = req.user?.role === 'ADMIN';

      const resource = await LearningResourceService.getLearningResourceById(resourceId, includeUnpublished);

      // Increment view count for non-admin users
      if (req.user?.role !== 'ADMIN') {
        await LearningResourceService.incrementViewCount(resourceId);
      }

      res.status(200).json({
        success: true,
        message: 'Learning resource retrieved successfully',
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /courses/:courseId/resources
   * Create new learning resource for a course
   */
  static async createLearningResourceForCourse(req: RequestWithUser<LearningResourceCourseParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const courseId = parseInt(req.params.courseId);
      const resourceData: CreateLearningResourceData = {
        courseId,
        ...req.body,
      };

      const resource = await LearningResourceService.createLearningResource(resourceData);

      res.status(201).json({
        success: true,
        message: 'Learning resource created successfully',
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /courses/:courseId/lessons/:lessonId/resources
   * Create new learning resource for a lesson
   */
  static async createLearningResourceForLesson(req: RequestWithUser<LearningResourceLessonParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const resourceData: CreateLearningResourceData = {
        lessonId,
        ...req.body,
      };

      const resource = await LearningResourceService.createLearningResource(resourceData);

      res.status(201).json({
        success: true,
        message: 'Learning resource created successfully',
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /resources/:id
   * Update learning resource
   */
  static async updateLearningResource(req: RequestWithUser<LearningResourceParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const resourceId = parseInt(req.params.id);
      const updateData: UpdateLearningResourceData = req.body;

      const resource = await LearningResourceService.updateLearningResource(resourceId, updateData);

      res.status(200).json({
        success: true,
        message: 'Learning resource updated successfully',
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /resources/:id
   * Delete learning resource
   */
  static async deleteLearningResource(req: RequestWithUser<LearningResourceParams>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const resourceId = parseInt(req.params.id);

      await LearningResourceService.deleteLearningResource(resourceId);

      res.status(200).json({
        success: true,
        message: 'Learning resource deleted successfully',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /resources/tags
   * Get all unique tags across all resources
   */
  static async getAllTags(req: RequestWithUser, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const tags = await LearningResourceService.getAllTags();

      res.status(200).json({
        success: true,
        message: 'Tags retrieved successfully',
        data: tags,
      });
    } catch (error) {
      next(error);
    }
  }
}
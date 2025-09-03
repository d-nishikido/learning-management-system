import { Request, Response, NextFunction } from 'express';
import { QuestionType, DifficultyLevel } from '@prisma/client';
import { questionService, CreateQuestionData, UpdateQuestionData, QuestionQueryOptions } from '../services/questionService';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/auth';

export class QuestionController {
  /**
   * GET /questions
   * Get all questions with filtering and pagination
   */
  async getQuestions(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const {
        page,
        limit,
        sortBy,
        sortOrder,
        courseId,
        lessonId,
        questionType,
        difficultyLevel,
        isPublished,
        tags,
        search
      } = req.query as any;

      const options: QuestionQueryOptions = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        courseId: courseId ? parseInt(courseId) : undefined,
        lessonId: lessonId ? parseInt(lessonId) : undefined,
        questionType: questionType as QuestionType,
        difficultyLevel: difficultyLevel as DifficultyLevel,
        isPublished: typeof isPublished === 'string' ? isPublished === 'true' : undefined,
        tags: typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : undefined,
        search: search as string,
      };

      const result = await questionService.getQuestions(options);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'Questions retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /questions/:id
   * Get question by ID
   */
  async getQuestionById(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const question = await questionService.getQuestionById(id);

      res.status(200).json({
        success: true,
        data: question,
        message: 'Question retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /questions
   * Create new question (Admin only)
   */
  async createQuestion(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      
      const data: CreateQuestionData = {
        ...req.body,
        createdBy: user.id,
      };

      const question = await questionService.createQuestion(data);

      res.status(201).json({
        success: true,
        data: question,
        message: 'Question created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /questions/:id
   * Update question (Creator or Admin only)
   */
  async updateQuestion(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;
      const data: UpdateQuestionData = req.body;

      const question = await questionService.updateQuestion(id, data, user.id, user.role);

      res.status(200).json({
        success: true,
        data: question,
        message: 'Question updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /questions/:id
   * Delete question (Creator or Admin only)
   */
  async deleteQuestion(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;

      await questionService.deleteQuestion(id, user.id, user.role);

      res.status(200).json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /questions/categories
   * Get all unique categories
   */
  async getCategories(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const categories = await questionService.getCategories();

      res.status(200).json({
        success: true,
        data: categories,
        message: 'Categories retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /questions/tags
   * Get all unique tags
   */
  async getTags(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const tags = await questionService.getTags();

      res.status(200).json({
        success: true,
        data: tags,
        message: 'Tags retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const questionController = new QuestionController();
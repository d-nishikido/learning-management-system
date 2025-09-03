import { Request, Response, NextFunction } from 'express';
import { testService, CreateTestData, UpdateTestData, TestQueryOptions, StartTestData, SubmitTestData } from '../services/testService';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/auth';

export class TestController {
  /**
   * GET /tests
   * Get all tests with filtering and pagination
   */
  async getTests(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const {
        page,
        limit,
        sortBy,
        sortOrder,
        courseId,
        lessonId,
        isPublished,
        availableOnly,
        search
      } = req.query as any;

      const options: TestQueryOptions = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        courseId: courseId ? parseInt(courseId) : undefined,
        lessonId: lessonId ? parseInt(lessonId) : undefined,
        isPublished: typeof isPublished === 'string' ? isPublished === 'true' : undefined,
        availableOnly: typeof availableOnly === 'string' ? availableOnly === 'true' : false,
        search: search as string,
      };

      const result = await testService.getTests(options);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'Tests retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tests/:id
   * Get test by ID
   */
  async getTestById(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const test = await testService.getTestById(id);

      res.status(200).json({
        success: true,
        data: test,
        message: 'Test retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tests
   * Create new test (Admin only)
   */
  async createTest(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      
      const data: CreateTestData = {
        ...req.body,
        createdBy: user.id,
        // Convert date strings to Date objects if present
        availableFrom: req.body.availableFrom ? new Date(req.body.availableFrom) : undefined,
        availableUntil: req.body.availableUntil ? new Date(req.body.availableUntil) : undefined,
      };

      const test = await testService.createTest(data);

      res.status(201).json({
        success: true,
        data: test,
        message: 'Test created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /tests/:id
   * Update test (Creator or Admin only)
   */
  async updateTest(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;
      
      const data: UpdateTestData = {
        ...req.body,
        // Convert date strings to Date objects if present
        availableFrom: req.body.availableFrom ? new Date(req.body.availableFrom) : undefined,
        availableUntil: req.body.availableUntil ? new Date(req.body.availableUntil) : undefined,
      };

      const test = await testService.updateTest(id, data, user.id, user.role);

      res.status(200).json({
        success: true,
        data: test,
        message: 'Test updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /tests/:id
   * Delete test (Creator or Admin only)
   */
  async deleteTest(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;

      await testService.deleteTest(id, user.id, user.role);

      res.status(200).json({
        success: true,
        message: 'Test deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tests/:id/questions
   * Add question to test
   */
  async addQuestionToTest(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const testId = parseInt(req.params.id);
      const { questionId, sortOrder } = req.body;
      const user = req.user!;

      await testService.addQuestionToTest(testId, questionId, sortOrder, user.id, user.role);

      res.status(200).json({
        success: true,
        message: 'Question added to test successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /tests/:id/questions/:questionId
   * Remove question from test
   */
  async removeQuestionFromTest(req: AuthRequest<{ id: string; questionId: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const testId = parseInt(req.params.id);
      const questionId = parseInt(req.params.questionId);
      const user = req.user!;

      await testService.removeQuestionFromTest(testId, questionId, user.id, user.role);

      res.status(200).json({
        success: true,
        message: 'Question removed from test successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tests/:id/can-take
   * Check if user can take test
   */
  async canUserTakeTest(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const testId = parseInt(req.params.id);
      const user = req.user!;

      const result = await testService.canUserTakeTest(user.id, testId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Test eligibility checked successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tests/:id/start
   * Start test for user
   */
  async startTest(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const testId = parseInt(req.params.id);
      const user = req.user!;

      const data: StartTestData = {
        userId: user.id,
        testId
      };

      const testResult = await testService.startTest(data);

      res.status(201).json({
        success: true,
        data: testResult,
        message: 'Test started successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tests/:id/session
   * Get user's current test session
   */
  async getUserTestSession(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const testId = parseInt(req.params.id);
      const user = req.user!;

      const session = await testService.getUserTestSession(user.id, testId);

      res.status(200).json({
        success: true,
        data: session,
        message: session ? 'Test session retrieved successfully' : 'No active test session'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tests/:id/submit
   * Submit test answers
   */
  async submitTest(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { testResultId, answers } = req.body;

      const data: SubmitTestData = {
        testResultId: parseInt(testResultId),
        answers
      };

      const testResult = await testService.submitTest(data);

      res.status(200).json({
        success: true,
        data: testResult,
        message: 'Test submitted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tests/:id/questions
   * Get shuffled test questions for user
   */
  async getTestQuestions(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const testId = parseInt(req.params.id);
      const user = req.user!;

      const questions = await testService.getTestQuestionsForUser(testId, user.id);

      res.status(200).json({
        success: true,
        data: questions,
        message: 'Test questions retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tests/:id/statistics
   * Get test statistics (Admin/Creator only)
   */
  async getTestStatistics(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const testId = parseInt(req.params.id);
      const user = req.user!;

      // Check if user is admin or test creator
      const test = await testService.getTestById(testId);
      if (user.role !== 'ADMIN' && test.createdBy !== user.id) {
        res.status(403).json({
          success: false,
          message: 'You can only view statistics for tests you created'
        });
        return;
      }

      const statistics = await testService.getTestStatistics(testId);

      res.status(200).json({
        success: true,
        data: statistics,
        message: 'Test statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tests/results/me
   * Get user's test results
   */
  async getUserTestResults(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { testId, page, limit } = req.query as any;
      const user = req.user!;

      const options = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      };

      const results = await testService.getUserTestResults(
        user.id,
        testId ? parseInt(testId) : undefined,
        options
      );

      res.status(200).json({
        success: true,
        data: results.data,
        pagination: results.pagination,
        message: 'Test results retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tests/:id/results
   * Get all results for a test (Admin/Creator only)
   */
  async getTestResults(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const testId = parseInt(req.params.id);
      const { page, limit } = req.query as any;
      const user = req.user!;

      // Check if user is admin or test creator
      const test = await testService.getTestById(testId);
      if (user.role !== 'ADMIN' && test.createdBy !== user.id) {
        res.status(403).json({
          success: false,
          message: 'You can only view results for tests you created'
        });
        return;
      }

      const options = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      };

      const results = await testService.getUserTestResults(
        undefined, // Get results for all users
        testId,
        options
      );

      res.status(200).json({
        success: true,
        data: results.data,
        pagination: results.pagination,
        message: 'Test results retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const testController = new TestController();
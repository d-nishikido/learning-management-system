import { Request, Response, NextFunction } from 'express';
import { LocalizedTestService } from '../services/localizedTestService';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/auth';
import { 
  getLocaleFromRequest, 
  getLocalizedMessage, 
  TEST_SUCCESS_MESSAGES,
  SupportedLocale
} from '../utils/i18n';

export class LocalizedTestController {
  /**
   * GET /tests
   * Get all tests with localized formatting
   */
  async getTests(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);

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

      const options = {
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

      const result = await testService.getLocalizedTests(options);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: getLocalizedMessage(TEST_SUCCESS_MESSAGES.TESTS_RETRIEVED, locale)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tests/:id
   * Get test by ID with localized formatting
   */
  async getTestById(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);
      const id = parseInt(req.params.id);
      
      const test = await testService.getTestById(id);

      res.status(200).json({
        success: true,
        data: test,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: getLocalizedMessage(TEST_SUCCESS_MESSAGES.TESTS_RETRIEVED, locale)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tests
   * Create new test with localized responses
   */
  async createTest(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);
      const user = req.user!;
      
      const data = {
        ...req.body,
        createdBy: user.id,
        availableFrom: req.body.availableFrom ? new Date(req.body.availableFrom) : undefined,
        availableUntil: req.body.availableUntil ? new Date(req.body.availableUntil) : undefined,
      };

      const test = await testService.createTest(data);

      res.status(201).json({
        success: true,
        data: test,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: getLocalizedMessage(TEST_SUCCESS_MESSAGES.TEST_CREATED, locale)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /tests/:id
   * Update test with localized responses
   */
  async updateTest(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);
      const id = parseInt(req.params.id);
      const user = req.user!;
      
      const data = {
        ...req.body,
        availableFrom: req.body.availableFrom ? new Date(req.body.availableFrom) : undefined,
        availableUntil: req.body.availableUntil ? new Date(req.body.availableUntil) : undefined,
      };

      const test = await testService.updateTest(id, data, user.id, user.role);

      res.status(200).json({
        success: true,
        data: test,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: getLocalizedMessage(TEST_SUCCESS_MESSAGES.TEST_UPDATED, locale)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /tests/:id
   * Delete test with localized responses
   */
  async deleteTest(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);
      const id = parseInt(req.params.id);
      const user = req.user!;

      await testService.deleteTest(id, user.id, user.role);

      res.status(200).json({
        success: true,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: getLocalizedMessage(TEST_SUCCESS_MESSAGES.TEST_DELETED, locale)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tests/:id/questions
   * Add question to test with localized responses
   */
  async addQuestionToTest(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);
      const testId = parseInt(req.params.id);
      const { questionId, sortOrder } = req.body;
      const user = req.user!;

      await testService.addQuestionToTest(testId, questionId, sortOrder, user.id, user.role);

      res.status(200).json({
        success: true,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: getLocalizedMessage(TEST_SUCCESS_MESSAGES.QUESTION_ADDED, locale)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /tests/:id/questions/:questionId
   * Remove question from test with localized responses
   */
  async removeQuestionFromTest(req: AuthRequest<{ id: string; questionId: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);
      const testId = parseInt(req.params.id);
      const questionId = parseInt(req.params.questionId);
      const user = req.user!;

      await testService.removeQuestionFromTest(testId, questionId, user.id, user.role);

      res.status(200).json({
        success: true,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: getLocalizedMessage(TEST_SUCCESS_MESSAGES.QUESTION_REMOVED, locale)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tests/:id/can-take
   * Check if user can take test with localized responses
   */
  async canUserTakeTest(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);
      const testId = parseInt(req.params.id);
      const user = req.user!;

      const result = await testService.canUserTakeTest(user.id, testId);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: getLocalizedMessage(TEST_SUCCESS_MESSAGES.ELIGIBILITY_CHECKED, locale)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tests/:id/start
   * Start test with localized responses
   */
  async startTest(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);
      const testId = parseInt(req.params.id);
      const user = req.user!;

      const testResult = await testService.startTest({
        userId: user.id,
        testId
      });

      res.status(201).json({
        success: true,
        data: testResult,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: getLocalizedMessage(TEST_SUCCESS_MESSAGES.TEST_STARTED, locale)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tests/:id/submit
   * Submit test with localized responses
   */
  async submitTest(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);
      const { testResultId, answers } = req.body;

      const testResult = await testService.submitTest({
        testResultId: parseInt(testResultId),
        answers
      });

      res.status(200).json({
        success: true,
        data: testResult,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: getLocalizedMessage(TEST_SUCCESS_MESSAGES.TEST_SUBMITTED, locale)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tests/:id/questions
   * Get test questions with localized formatting
   */
  async getTestQuestions(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);
      const testId = parseInt(req.params.id);
      const user = req.user!;

      const questions = await testService.getTestQuestionsForUser(testId, user.id);

      res.status(200).json({
        success: true,
        data: questions,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: getLocalizedMessage(TEST_SUCCESS_MESSAGES.QUESTIONS_RETRIEVED, locale)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tests/:id/statistics
   * Get test statistics with localized formatting
   */
  async getTestStatistics(req: AuthRequest<{ id: string }>, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);
      const testId = parseInt(req.params.id);
      const user = req.user!;

      // Check permissions
      const test = await testService.getTestById(testId);
      if (user.role !== 'ADMIN' && test.createdBy !== user.id) {
        res.status(403).json({
          success: false,
          meta: {
            ...testService.getLocalizationInfo()
          },
          message: user.role === 'USER' ? 
            'You can only view statistics for tests you created' :
            'テスト作成者のみ統計を表示できます'
        });
        return;
      }

      const statistics = await testService.getLocalizedTestStatistics(testId);

      res.status(200).json({
        success: true,
        data: statistics,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: getLocalizedMessage(TEST_SUCCESS_MESSAGES.STATISTICS_RETRIEVED, locale)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tests/results/me
   * Get user's test results with localized formatting
   */
  async getUserTestResults(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);
      const { testId, page, limit } = req.query as any;
      const user = req.user!;

      const options = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      };

      const results = await testService.getLocalizedUserTestHistory(
        user.id,
        options
      );

      res.status(200).json({
        success: true,
        data: results.data,
        pagination: results.pagination,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: getLocalizedMessage(TEST_SUCCESS_MESSAGES.RESULTS_RETRIEVED, locale)
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
      const locale = getLocaleFromRequest(req);
      const testService = new LocalizedTestService(req);
      const testId = parseInt(req.params.id);
      const user = req.user!;

      const session = await testService.getUserTestSession(user.id, testId);

      res.status(200).json({
        success: true,
        data: session,
        meta: {
          ...testService.getLocalizationInfo()
        },
        message: session ? 
          getLocalizedMessage(TEST_SUCCESS_MESSAGES.RESULTS_RETRIEVED, locale) : 
          (locale === 'ja' ? 'アクティブなテストセッションがありません' : 'No active test session')
      });
    } catch (error) {
      next(error);
    }
  }
}

export const localizedTestController = new LocalizedTestController();
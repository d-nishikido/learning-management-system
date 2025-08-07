import { Request, Response, NextFunction } from 'express';
import { testController, TestController } from '../testController';
import { testService } from '../../services/testService';
import { AuthRequest } from '../../middleware/auth';

// Mock the test service
jest.mock('../../services/testService');
const mockTestService = testService as jest.Mocked<typeof testService>;

describe('TestController', () => {
  let controller: TestController;
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    controller = new TestController();
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 1, username: 'testuser', role: 'USER' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getTests', () => {
    const mockTestsResult = {
      data: [
        {
          id: 1,
          title: 'Test 1',
          creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
          course: { id: 1, title: 'Course 1', category: 'Programming' },
          lesson: null,
          testQuestions: [],
          _count: { userTestResults: 0, testQuestions: 0 }
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };

    beforeEach(() => {
      mockTestService.getTests.mockResolvedValue(mockTestsResult);
    });

    it('should get tests successfully with default options', async () => {
      await controller.getTests(req as Request, res as Response, next);

      expect(mockTestService.getTests).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        sortBy: undefined,
        sortOrder: undefined,
        courseId: undefined,
        lessonId: undefined,
        isPublished: undefined,
        availableOnly: false,
        search: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTestsResult.data,
        pagination: mockTestsResult.pagination,
        message: 'Tests retrieved successfully'
      });
    });

    it('should handle query parameters correctly', async () => {
      req.query = {
        page: '2',
        limit: '5',
        sortBy: 'title',
        sortOrder: 'asc',
        courseId: '1',
        isPublished: 'true',
        availableOnly: 'true',
        search: 'test'
      };

      await controller.getTests(req as Request, res as Response, next);

      expect(mockTestService.getTests).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        sortBy: 'title',
        sortOrder: 'asc',
        courseId: 1,
        lessonId: undefined,
        isPublished: true,
        availableOnly: true,
        search: 'test',
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockTestService.getTests.mockRejectedValue(error);

      await controller.getTests(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTestById', () => {
    const mockTest = {
      id: 1,
      title: 'Test 1',
      creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
      course: { id: 1, title: 'Course 1', category: 'Programming' },
      lesson: null,
      testQuestions: [],
      _count: { userTestResults: 0, testQuestions: 0 }
    };

    beforeEach(() => {
      req.params = { id: '1' };
      mockTestService.getTestById.mockResolvedValue(mockTest as any);
    });

    it('should get test by ID successfully', async () => {
      await controller.getTestById(req as Request, res as Response, next);

      expect(mockTestService.getTestById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTest,
        message: 'Test retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Test not found');
      mockTestService.getTestById.mockRejectedValue(error);

      await controller.getTestById(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createTest', () => {
    const mockTestData = {
      title: 'New Test',
      description: 'Test Description',
      courseId: 1,
      lessonId: 1,
      timeLimitMinutes: 60,
      maxAttempts: 3,
      passingScore: 70,
    };

    const mockCreatedTest = {
      id: 1,
      ...mockTestData,
      creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
      course: { id: 1, title: 'Course 1', category: 'Programming' },
      lesson: { id: 1, title: 'Lesson 1' },
      testQuestions: [],
      _count: { userTestResults: 0, testQuestions: 0 }
    };

    beforeEach(() => {
      req.body = mockTestData;
      mockTestService.createTest.mockResolvedValue(mockCreatedTest as any);
    });

    it('should create test successfully', async () => {
      await controller.createTest(req as AuthRequest, res as Response, next);

      expect(mockTestService.createTest).toHaveBeenCalledWith({
        ...mockTestData,
        createdBy: 1,
        availableFrom: undefined,
        availableUntil: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedTest,
        message: 'Test created successfully'
      });
    });

    it('should handle date conversion', async () => {
      req.body = {
        ...mockTestData,
        availableFrom: '2024-01-01T00:00:00Z',
        availableUntil: '2024-12-31T23:59:59Z',
      };

      await controller.createTest(req as AuthRequest, res as Response, next);

      expect(mockTestService.createTest).toHaveBeenCalledWith({
        ...mockTestData,
        createdBy: 1,
        availableFrom: new Date('2024-01-01T00:00:00Z'),
        availableUntil: new Date('2024-12-31T23:59:59Z'),
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Course not found');
      mockTestService.createTest.mockRejectedValue(error);

      await controller.createTest(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateTest', () => {
    const mockUpdateData = {
      title: 'Updated Test',
      description: 'Updated Description',
    };

    const mockUpdatedTest = {
      id: 1,
      ...mockUpdateData,
      creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
      course: { id: 1, title: 'Course 1', category: 'Programming' },
      lesson: null,
      testQuestions: [],
      _count: { userTestResults: 0, testQuestions: 0 }
    };

    beforeEach(() => {
      req.params = { id: '1' };
      req.body = mockUpdateData;
      mockTestService.updateTest.mockResolvedValue(mockUpdatedTest as any);
    });

    it('should update test successfully', async () => {
      await controller.updateTest(req as AuthRequest, res as Response, next);

      expect(mockTestService.updateTest).toHaveBeenCalledWith(1, {
        ...mockUpdateData,
        availableFrom: undefined,
        availableUntil: undefined,
      }, 1, 'USER');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedTest,
        message: 'Test updated successfully'
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Forbidden');
      mockTestService.updateTest.mockRejectedValue(error);

      await controller.updateTest(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteTest', () => {
    beforeEach(() => {
      req.params = { id: '1' };
      mockTestService.deleteTest.mockResolvedValue();
    });

    it('should delete test successfully', async () => {
      await controller.deleteTest(req as AuthRequest, res as Response, next);

      expect(mockTestService.deleteTest).toHaveBeenCalledWith(1, 1, 'USER');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Test deleted successfully'
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Cannot delete test with completed attempts');
      mockTestService.deleteTest.mockRejectedValue(error);

      await controller.deleteTest(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('addQuestionToTest', () => {
    beforeEach(() => {
      req.params = { id: '1' };
      req.body = { questionId: 5, sortOrder: 3 };
      mockTestService.addQuestionToTest.mockResolvedValue();
    });

    it('should add question to test successfully', async () => {
      await controller.addQuestionToTest(req as AuthRequest, res as Response, next);

      expect(mockTestService.addQuestionToTest).toHaveBeenCalledWith(1, 5, 3, 1, 'USER');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Question added to test successfully'
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Question already in test');
      mockTestService.addQuestionToTest.mockRejectedValue(error);

      await controller.addQuestionToTest(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('canUserTakeTest', () => {
    beforeEach(() => {
      req.params = { id: '1' };
      mockTestService.canUserTakeTest.mockResolvedValue({ canTake: true });
    });

    it('should check test eligibility successfully', async () => {
      await controller.canUserTakeTest(req as AuthRequest, res as Response, next);

      expect(mockTestService.canUserTakeTest).toHaveBeenCalledWith(1, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { canTake: true },
        message: 'Test eligibility checked successfully'
      });
    });

    it('should handle ineligible case', async () => {
      mockTestService.canUserTakeTest.mockResolvedValue({ canTake: false, reason: 'Not available' });

      await controller.canUserTakeTest(req as AuthRequest, res as Response, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { canTake: false, reason: 'Not available' },
        message: 'Test eligibility checked successfully'
      });
    });
  });

  describe('startTest', () => {
    const mockTestResult = {
      id: 1,
      userId: 1,
      testId: 1,
      status: 'IN_PROGRESS',
      test: { id: 1, title: 'Test 1', timeLimitMinutes: 60, passingScore: 70, showResultsImmediately: true },
      user: { id: 1, username: 'user1', firstName: 'Test', lastName: 'User' },
      userAnswers: []
    };

    beforeEach(() => {
      req.params = { id: '1' };
      mockTestService.startTest.mockResolvedValue(mockTestResult as any);
    });

    it('should start test successfully', async () => {
      await controller.startTest(req as AuthRequest, res as Response, next);

      expect(mockTestService.startTest).toHaveBeenCalledWith({ userId: 1, testId: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTestResult,
        message: 'Test started successfully'
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Maximum attempts exceeded');
      mockTestService.startTest.mockRejectedValue(error);

      await controller.startTest(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('submitTest', () => {
    const mockSubmitData = {
      testResultId: 1,
      answers: [
        { questionId: 1, selectedOptionId: 2 },
        { questionId: 2, answerText: 'Essay answer' }
      ]
    };

    const mockTestResult = {
      id: 1,
      score: 85,
      isPassed: true,
      status: 'COMPLETED',
      test: { id: 1, title: 'Test 1', timeLimitMinutes: 60, passingScore: 70, showResultsImmediately: true },
      user: { id: 1, username: 'user1', firstName: 'Test', lastName: 'User' },
      userAnswers: []
    };

    beforeEach(() => {
      req.body = mockSubmitData;
      mockTestService.submitTest.mockResolvedValue(mockTestResult as any);
    });

    it('should submit test successfully', async () => {
      await controller.submitTest(req as AuthRequest, res as Response, next);

      expect(mockTestService.submitTest).toHaveBeenCalledWith({
        testResultId: 1,
        answers: mockSubmitData.answers
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTestResult,
        message: 'Test submitted successfully'
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Test not in progress');
      mockTestService.submitTest.mockRejectedValue(error);

      await controller.submitTest(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTestQuestions', () => {
    const mockQuestions = [
      {
        id: 1,
        title: 'Question 1',
        questionText: 'What is 2+2?',
        questionType: 'MULTIPLE_CHOICE',
        points: 10,
        options: [
          { id: 1, optionText: '3', sortOrder: 1 },
          { id: 2, optionText: '4', sortOrder: 2 }
        ]
      }
    ];

    beforeEach(() => {
      req.params = { id: '1' };
      mockTestService.getTestQuestionsForUser.mockResolvedValue(mockQuestions);
    });

    it('should get test questions successfully', async () => {
      await controller.getTestQuestions(req as AuthRequest, res as Response, next);

      expect(mockTestService.getTestQuestionsForUser).toHaveBeenCalledWith(1, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockQuestions,
        message: 'Test questions retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Cannot access test questions');
      mockTestService.getTestQuestionsForUser.mockRejectedValue(error);

      await controller.getTestQuestions(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTestStatistics', () => {
    const mockStatistics = {
      totalAttempts: 10,
      passedAttempts: 7,
      failedAttempts: 3,
      averageScore: 78.5,
      averageTimeSpent: 45.2,
      highestScore: 95,
      lowestScore: 45,
    };

    const mockTest = {
      id: 1,
      createdBy: 1,
      creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
      course: { id: 1, title: 'Course 1', category: 'Programming' },
      lesson: null,
      testQuestions: [],
      _count: { userTestResults: 0, testQuestions: 0 }
    };

    beforeEach(() => {
      req.params = { id: '1' };
      mockTestService.getTestById.mockResolvedValue(mockTest as any);
      mockTestService.getTestStatistics.mockResolvedValue(mockStatistics);
    });

    it('should get test statistics successfully as creator', async () => {
      await controller.getTestStatistics(req as AuthRequest, res as Response, next);

      expect(mockTestService.getTestById).toHaveBeenCalledWith(1);
      expect(mockTestService.getTestStatistics).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatistics,
        message: 'Test statistics retrieved successfully'
      });
    });

    it('should get test statistics successfully as admin', async () => {
      req.user!.role = 'ADMIN';

      await controller.getTestStatistics(req as AuthRequest, res as Response, next);

      expect(mockTestService.getTestStatistics).toHaveBeenCalledWith(1);
    });

    it('should return 403 for non-creator non-admin', async () => {
      req.user!.id = 2;

      await controller.getTestStatistics(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You can only view statistics for tests you created'
      });
      expect(mockTestService.getTestStatistics).not.toHaveBeenCalled();
    });
  });

  describe('getUserTestResults', () => {
    const mockResults = {
      data: [
        {
          id: 1,
          score: 85,
          isPassed: true,
          test: { id: 1, title: 'Test 1', timeLimitMinutes: 60, passingScore: 70, showResultsImmediately: true },
          user: { id: 1, username: 'user1', firstName: 'Test', lastName: 'User' },
          userAnswers: []
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      }
    };

    beforeEach(() => {
      req.query = {};
      mockTestService.getUserTestResults.mockResolvedValue(mockResults as any);
    });

    it('should get user test results successfully', async () => {
      await controller.getUserTestResults(req as AuthRequest, res as Response, next);

      expect(mockTestService.getUserTestResults).toHaveBeenCalledWith(1, undefined, {
        page: undefined,
        limit: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResults.data,
        pagination: mockResults.pagination,
        message: 'Test results retrieved successfully'
      });
    });

    it('should handle query parameters', async () => {
      req.query = { testId: '1', page: '2', limit: '5' };

      await controller.getUserTestResults(req as AuthRequest, res as Response, next);

      expect(mockTestService.getUserTestResults).toHaveBeenCalledWith(1, 1, {
        page: 2,
        limit: 5,
      });
    });
  });
});
import { Request, Response, NextFunction } from 'express';
import { QuestionController } from '../questionController';
import { questionService } from '../../services/questionService';
import { AuthRequest } from '../../middleware/auth';

// Mock the questionService
jest.mock('../../services/questionService');

const mockQuestionService = questionService as jest.Mocked<typeof questionService>;
const questionController = new QuestionController();

describe('QuestionController', () => {
  let mockRequest: Partial<Request>;
  let mockAuthRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockAuthRequest = {
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'ADMIN',
      },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getQuestions', () => {
    it('should return paginated questions', async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            title: 'Test Question',
            questionText: 'What is the answer?',
            questionType: 'MULTIPLE_CHOICE',
            difficultyLevel: 'BEGINNER',
            points: 10,
            isPublished: true,
            questionOptions: [],
            creator: {
              id: 1,
              username: 'testuser',
              firstName: 'Test',
              lastName: 'User',
            },
            course: null,
            lesson: null,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockRequest.query = {
        page: '1',
        limit: '10',
        questionType: 'MULTIPLE_CHOICE',
      };

      mockQuestionService.getQuestions.mockResolvedValue(mockResult);

      await questionController.getQuestions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockQuestionService.getQuestions).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: undefined,
        sortOrder: undefined,
        courseId: undefined,
        lessonId: undefined,
        questionType: 'MULTIPLE_CHOICE',
        difficultyLevel: undefined,
        isPublished: undefined,
        tags: undefined,
        search: undefined,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.data,
        pagination: mockResult.pagination,
        message: 'Questions retrieved successfully',
      });
    });

    it('should handle query parameters correctly', async () => {
      mockRequest.query = {
        page: '2',
        limit: '5',
        courseId: '1',
        lessonId: '2',
        difficultyLevel: 'INTERMEDIATE',
        isPublished: 'true',
        tags: 'tag1,tag2',
        search: 'test search',
      };

      const mockResult = { data: [], pagination: {} };
      mockQuestionService.getQuestions.mockResolvedValue(mockResult as any);

      await questionController.getQuestions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockQuestionService.getQuestions).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        sortBy: undefined,
        sortOrder: undefined,
        courseId: 1,
        lessonId: 2,
        questionType: undefined,
        difficultyLevel: 'INTERMEDIATE',
        isPublished: true,
        tags: ['tag1', 'tag2'],
        search: 'test search',
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Service error');
      mockQuestionService.getQuestions.mockRejectedValue(error);

      mockRequest.query = {};

      await questionController.getQuestions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getQuestionById', () => {
    it('should return question by id', async () => {
      const mockQuestion = {
        id: 1,
        title: 'Test Question',
        questionText: 'What is the answer?',
        questionType: 'MULTIPLE_CHOICE' as const,
        difficultyLevel: 'BEGINNER' as const,
        points: 10,
        isPublished: true,
        questionOptions: [],
        creator: {
          id: 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
        },
        course: null,
        lesson: null,
      };

      mockRequest.params = { id: '1' };
      mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion as any);

      await questionController.getQuestionById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockQuestion,
        message: 'Question retrieved successfully',
      });
    });
  });

  describe('createQuestion', () => {
    it('should create question successfully', async () => {
      const requestData = {
        title: 'New Question',
        questionText: 'What is the answer?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          { optionText: 'Option A', isCorrect: true },
          { optionText: 'Option B', isCorrect: false },
        ],
      };

      const mockQuestion = {
        id: 1,
        ...requestData,
        createdBy: 1,
        questionOptions: [],
        creator: {
          id: 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
        },
        course: null,
        lesson: null,
      };

      mockAuthRequest.body = requestData;
      mockQuestionService.createQuestion.mockResolvedValue(mockQuestion as any);

      await questionController.createQuestion(
        mockAuthRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockQuestionService.createQuestion).toHaveBeenCalledWith({
        ...requestData,
        createdBy: 1,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockQuestion,
        message: 'Question created successfully',
      });
    });
  });

  describe('updateQuestion', () => {
    it('should update question successfully', async () => {
      const updateData = {
        title: 'Updated Question',
      };

      const mockUpdatedQuestion = {
        id: 1,
        title: 'Updated Question',
        questionText: 'What is the answer?',
        questionType: 'MULTIPLE_CHOICE' as const,
        difficultyLevel: 'BEGINNER' as const,
        points: 10,
        questionOptions: [],
        creator: {
          id: 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
        },
        course: null,
        lesson: null,
      };

      mockAuthRequest.params = { id: '1' };
      mockAuthRequest.body = updateData;
      mockQuestionService.updateQuestion.mockResolvedValue(mockUpdatedQuestion as any);

      await questionController.updateQuestion(
        mockAuthRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockQuestionService.updateQuestion).toHaveBeenCalledWith(1, updateData, 1, 'ADMIN');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedQuestion,
        message: 'Question updated successfully',
      });
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question successfully', async () => {
      mockAuthRequest.params = { id: '1' };
      mockQuestionService.deleteQuestion.mockResolvedValue();

      await questionController.deleteQuestion(
        mockAuthRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockQuestionService.deleteQuestion).toHaveBeenCalledWith(1, 1, 'ADMIN');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Question deleted successfully',
      });
    });
  });

  describe('getCategories', () => {
    it('should return categories', async () => {
      const mockCategories = ['Programming', 'Mathematics'];
      mockQuestionService.getCategories.mockResolvedValue(mockCategories);

      await questionController.getCategories(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockQuestionService.getCategories).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCategories,
        message: 'Categories retrieved successfully',
      });
    });
  });

  describe('getTags', () => {
    it('should return tags', async () => {
      const mockTags = ['tag1', 'tag2', 'tag3'];
      mockQuestionService.getTags.mockResolvedValue(mockTags);

      await questionController.getTags(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockQuestionService.getTags).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockTags,
        message: 'Tags retrieved successfully',
      });
    });
  });
});
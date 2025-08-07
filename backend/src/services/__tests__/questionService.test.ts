import { PrismaClient } from '@prisma/client';
import { QuestionService } from '../questionService';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    question: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
    questionOption: {
      deleteMany: jest.fn(),
    },
  })),
}));

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const questionService = new QuestionService();

// Mock data
const mockUser = {
  id: 1,
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
};

const mockCourse = {
  id: 1,
  title: 'Test Course',
};

const mockLesson = {
  id: 1,
  title: 'Test Lesson',
};

const mockQuestion = {
  id: 1,
  title: 'Test Question',
  questionText: 'What is the correct answer?',
  questionType: 'MULTIPLE_CHOICE' as const,
  difficultyLevel: 'BEGINNER' as const,
  points: 10,
  timeLimitMinutes: 5,
  explanation: 'This is the explanation',
  hints: JSON.stringify(['Hint 1', 'Hint 2']),
  tags: JSON.stringify(['tag1', 'tag2']),
  isPublished: true,
  courseId: 1,
  lessonId: 1,
  createdBy: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  questionOptions: [
    {
      id: 1,
      questionId: 1,
      optionText: 'Option A',
      isCorrect: true,
      sortOrder: 1,
      explanation: 'Correct option',
      createdAt: new Date(),
    },
    {
      id: 2,
      questionId: 1,
      optionText: 'Option B',
      isCorrect: false,
      sortOrder: 2,
      explanation: 'Incorrect option',
      createdAt: new Date(),
    },
  ],
  creator: mockUser,
  course: mockCourse,
  lesson: mockLesson,
};

describe('QuestionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuestion', () => {
    it('should create a multiple choice question successfully', async () => {
      const createData = {
        title: 'Test Question',
        questionText: 'What is the correct answer?',
        questionType: 'MULTIPLE_CHOICE' as const,
        difficultyLevel: 'BEGINNER' as const,
        points: 10,
        createdBy: 1,
        options: [
          { optionText: 'Option A', isCorrect: true },
          { optionText: 'Option B', isCorrect: false },
        ],
      };

      (mockPrisma.question.create as jest.Mock).mockResolvedValue(mockQuestion);

      const result = await questionService.createQuestion(createData);

      expect(mockPrisma.question.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Question',
          questionText: 'What is the correct answer?',
          questionType: 'MULTIPLE_CHOICE',
          difficultyLevel: 'BEGINNER',
          points: 10,
          timeLimitMinutes: undefined,
          explanation: undefined,
          hints: null,
          tags: null,
          isPublished: false,
          courseId: undefined,
          lessonId: undefined,
          createdBy: 1,
          questionOptions: {
            create: [
              {
                optionText: 'Option A',
                isCorrect: true,
                sortOrder: 1,
                explanation: undefined,
              },
              {
                optionText: 'Option B',
                isCorrect: false,
                sortOrder: 2,
                explanation: undefined,
              },
            ],
          },
        },
        include: {
          questionOptions: {
            orderBy: { sortOrder: 'asc' },
          },
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
          lesson: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
      expect(result).toEqual(mockQuestion);
    });

    it('should throw error when multiple choice question has no options', async () => {
      const createData = {
        title: 'Test Question',
        questionText: 'What is the correct answer?',
        questionType: 'MULTIPLE_CHOICE' as const,
        createdBy: 1,
      };

      await expect(questionService.createQuestion(createData)).rejects.toThrow(
        'Multiple choice questions must have at least 2 options'
      );
    });

    it('should throw error when multiple choice question has no correct options', async () => {
      const createData = {
        title: 'Test Question',
        questionText: 'What is the correct answer?',
        questionType: 'MULTIPLE_CHOICE' as const,
        createdBy: 1,
        options: [
          { optionText: 'Option A', isCorrect: false },
          { optionText: 'Option B', isCorrect: false },
        ],
      };

      await expect(questionService.createQuestion(createData)).rejects.toThrow(
        'Multiple choice questions must have at least one correct option'
      );
    });

    it('should throw error when course does not exist', async () => {
      const createData = {
        title: 'Test Question',
        questionText: 'What is the correct answer?',
        questionType: 'ESSAY' as const,
        courseId: 999,
        createdBy: 1,
      };

      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(questionService.createQuestion(createData)).rejects.toThrow(
        new NotFoundError('Course not found')
      );
    });
  });

  describe('getQuestions', () => {
    it('should return paginated questions', async () => {
      const mockQuestions = [mockQuestion];
      const mockCount = 1;

      (mockPrisma.question.findMany as jest.Mock).mockResolvedValue(mockQuestions);
      (mockPrisma.question.count as jest.Mock).mockResolvedValue(mockCount);

      const result = await questionService.getQuestions({
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        data: mockQuestions,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should filter questions by course', async () => {
      const mockQuestions = [mockQuestion];
      const mockCount = 1;

      (mockPrisma.question.findMany as jest.Mock).mockResolvedValue(mockQuestions);
      (mockPrisma.question.count as jest.Mock).mockResolvedValue(mockCount);

      await questionService.getQuestions({
        courseId: 1,
      });

      expect(mockPrisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            courseId: 1,
          }),
        })
      );
    });
  });

  describe('getQuestionById', () => {
    it('should return question by id', async () => {
      (mockPrisma.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);

      const result = await questionService.getQuestionById(1);

      expect(result).toEqual(mockQuestion);
      expect(mockPrisma.question.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          questionOptions: {
            orderBy: { sortOrder: 'asc' },
          },
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
          lesson: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundError when question does not exist', async () => {
      (mockPrisma.question.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(questionService.getQuestionById(999)).rejects.toThrow(
        new NotFoundError('Question not found')
      );
    });
  });

  describe('updateQuestion', () => {
    it('should update question successfully when user is creator', async () => {
      (mockPrisma.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);
      (mockPrisma.question.update as jest.Mock).mockResolvedValue(mockQuestion);

      const updateData = {
        title: 'Updated Question',
      };

      const result = await questionService.updateQuestion(1, updateData, 1, 'USER');

      expect(result).toEqual(mockQuestion);
      expect(mockPrisma.question.update).toHaveBeenCalled();
    });

    it('should update question successfully when user is admin', async () => {
      (mockPrisma.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);
      (mockPrisma.question.update as jest.Mock).mockResolvedValue(mockQuestion);

      const updateData = {
        title: 'Updated Question',
      };

      const result = await questionService.updateQuestion(1, updateData, 2, 'ADMIN');

      expect(result).toEqual(mockQuestion);
      expect(mockPrisma.question.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenError when user is not creator or admin', async () => {
      (mockPrisma.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);

      const updateData = {
        title: 'Updated Question',
      };

      await expect(
        questionService.updateQuestion(1, updateData, 2, 'USER')
      ).rejects.toThrow(new ForbiddenError('You can only update questions you created'));
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question successfully when user is creator', async () => {
      (mockPrisma.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);
      (mockPrisma.question.delete as jest.Mock).mockResolvedValue(mockQuestion);

      await questionService.deleteQuestion(1, 1, 'USER');

      expect(mockPrisma.question.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw ForbiddenError when user is not creator or admin', async () => {
      (mockPrisma.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);

      await expect(questionService.deleteQuestion(1, 2, 'USER')).rejects.toThrow(
        new ForbiddenError('You can only delete questions you created')
      );
    });
  });

  describe('getCategories', () => {
    it('should return unique categories', async () => {
      const mockCourses = [
        { category: 'Programming' },
        { category: 'Mathematics' },
      ];

      (mockPrisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

      const result = await questionService.getCategories();

      expect(result).toEqual(['Programming', 'Mathematics']);
    });
  });

  describe('getTags', () => {
    it('should return unique tags from all questions', async () => {
      const mockQuestions = [
        { tags: JSON.stringify(['tag1', 'tag2']) },
        { tags: JSON.stringify(['tag2', 'tag3']) },
      ];

      (mockPrisma.question.findMany as jest.Mock).mockResolvedValue(mockQuestions);

      const result = await questionService.getTags();

      expect(result).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle invalid JSON tags gracefully', async () => {
      const mockQuestions = [
        { tags: 'invalid json' },
        { tags: JSON.stringify(['valid', 'tag']) },
      ];

      (mockPrisma.question.findMany as jest.Mock).mockResolvedValue(mockQuestions);

      const result = await questionService.getTags();

      expect(result).toEqual(['tag', 'valid']);
    });
  });
});
import { PrismaClient } from '@prisma/client';
import { testService, TestService } from '../testService';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  test: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  course: {
    findUnique: jest.fn(),
  },
  lesson: {
    findUnique: jest.fn(),
  },
  question: {
    findUnique: jest.fn(),
  },
  testQuestion: {
    create: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  userTestResult: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  userAnswer: {
    createMany: jest.fn(),
  },
} as any;

(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

describe('TestService', () => {
  let service: TestService;

  beforeEach(() => {
    service = new TestService();
    jest.clearAllMocks();
  });

  describe('createTest', () => {
    const validTestData = {
      title: 'Test Title',
      description: 'Test Description',
      courseId: 1,
      lessonId: 1,
      timeLimitMinutes: 60,
      maxAttempts: 3,
      passingScore: 70,
      shuffleQuestions: true,
      shuffleOptions: false,
      showResultsImmediately: true,
      isPublished: false,
      createdBy: 1,
    };

    const mockCourse = { id: 1, title: 'Test Course' };
    const mockLesson = { id: 1, title: 'Test Lesson' };
    const mockCreatedTest = {
      id: 1,
      ...validTestData,
      creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
      course: { id: 1, title: 'Test Course', category: 'Programming' },
      lesson: { id: 1, title: 'Test Lesson' },
      testQuestions: [],
      _count: { userTestResults: 0, testQuestions: 0 }
    };

    beforeEach(() => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrisma.test.create.mockResolvedValue(mockCreatedTest);
    });

    it('should create a test successfully', async () => {
      const result = await service.createTest(validTestData);

      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockPrisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockPrisma.test.create).toHaveBeenCalledWith({
        data: {
          title: validTestData.title,
          description: validTestData.description,
          courseId: validTestData.courseId,
          lessonId: validTestData.lessonId,
          timeLimitMinutes: validTestData.timeLimitMinutes,
          maxAttempts: validTestData.maxAttempts,
          passingScore: validTestData.passingScore || 60.00,
          shuffleQuestions: validTestData.shuffleQuestions || false,
          shuffleOptions: validTestData.shuffleOptions || false,
          showResultsImmediately: validTestData.showResultsImmediately ?? true,
          isPublished: validTestData.isPublished || false,
          availableFrom: undefined,
          availableUntil: undefined,
          createdBy: validTestData.createdBy,
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCreatedTest);
    });

    it('should throw NotFoundError when course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(service.createTest(validTestData)).rejects.toThrow(NotFoundError);
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should throw NotFoundError when lesson does not exist', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.createTest(validTestData)).rejects.toThrow(NotFoundError);
      expect(mockPrisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should throw ValidationError for invalid date range', async () => {
      const testDataWithInvalidDates = {
        ...validTestData,
        availableFrom: new Date('2024-12-31'),
        availableUntil: new Date('2024-01-01'),
      };

      await expect(service.createTest(testDataWithInvalidDates)).rejects.toThrow(ValidationError);
    });

    it('should create test without lesson ID', async () => {
      const testDataWithoutLesson = { ...validTestData, lessonId: undefined };
      
      const result = await service.createTest(testDataWithoutLesson);

      expect(mockPrisma.lesson.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(mockCreatedTest);
    });
  });

  describe('getTests', () => {
    const mockTests = [
      {
        id: 1,
        title: 'Test 1',
        creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
        course: { id: 1, title: 'Course 1', category: 'Programming' },
        lesson: null,
        testQuestions: [],
        _count: { userTestResults: 0, testQuestions: 0 }
      }
    ];

    beforeEach(() => {
      mockPrisma.test.findMany.mockResolvedValue(mockTests);
      mockPrisma.test.count.mockResolvedValue(1);
    });

    it('should get tests with default options', async () => {
      const result = await service.getTests();

      expect(mockPrisma.test.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
      expect(result).toEqual({
        data: mockTests,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should filter tests by course ID', async () => {
      await service.getTests({ courseId: 1 });

      expect(mockPrisma.test.findMany).toHaveBeenCalledWith({
        where: { courseId: 1 },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should filter available tests only', async () => {
      const now = new Date();
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      await service.getTests({ availableOnly: true });

      expect(mockPrisma.test.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { isPublished: true },
            {
              OR: [
                { availableFrom: null },
                { availableFrom: { lte: now } }
              ]
            },
            {
              OR: [
                { availableUntil: null },
                { availableUntil: { gte: now } }
              ]
            }
          ]
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should search tests by title and description', async () => {
      await service.getTests({ search: 'test' });

      expect(mockPrisma.test.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ]
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
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

    it('should get test by ID successfully', async () => {
      mockPrisma.test.findUnique.mockResolvedValue(mockTest);

      const result = await service.getTestById(1);

      expect(mockPrisma.test.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockTest);
    });

    it('should throw NotFoundError when test does not exist', async () => {
      mockPrisma.test.findUnique.mockResolvedValue(null);

      await expect(service.getTestById(1)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateTest', () => {
    const mockTest = {
      id: 1,
      title: 'Test 1',
      createdBy: 1,
      creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
      course: { id: 1, title: 'Course 1', category: 'Programming' },
      lesson: null,
      testQuestions: [],
      _count: { userTestResults: 0, testQuestions: 0 },
      availableFrom: null,
      availableUntil: null,
    };

    const updateData = {
      title: 'Updated Test',
      description: 'Updated Description',
    };

    beforeEach(() => {
      jest.spyOn(service, 'getTestById').mockResolvedValue(mockTest as any);
      mockPrisma.test.update.mockResolvedValue({ ...mockTest, ...updateData });
    });

    it('should update test successfully as creator', async () => {
      const result = await service.updateTest(1, updateData, 1, 'USER');

      expect(service.getTestById).toHaveBeenCalledWith(1);
      expect(mockPrisma.test.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining(updateData),
        include: expect.any(Object),
      });
      expect(result).toEqual({ ...mockTest, ...updateData });
    });

    it('should update test successfully as admin', async () => {
      const result = await service.updateTest(1, updateData, 2, 'ADMIN');

      expect(result).toEqual({ ...mockTest, ...updateData });
    });

    it('should throw ForbiddenError when user is not creator or admin', async () => {
      await expect(service.updateTest(1, updateData, 2, 'USER')).rejects.toThrow(ForbiddenError);
    });

    it('should validate course exists when courseId is provided', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({ id: 2, title: 'New Course' });
      
      await service.updateTest(1, { ...updateData, courseId: 2 }, 1, 'USER');

      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 2 }
      });
    });

    it('should throw NotFoundError when course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(service.updateTest(1, { ...updateData, courseId: 999 }, 1, 'USER')).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteTest', () => {
    const mockTest = {
      id: 1,
      title: 'Test 1',
      createdBy: 1,
      creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
      course: { id: 1, title: 'Course 1', category: 'Programming' },
      lesson: null,
      testQuestions: [],
      _count: { userTestResults: 0, testQuestions: 0 }
    };

    beforeEach(() => {
      jest.spyOn(service, 'getTestById').mockResolvedValue(mockTest as any);
      mockPrisma.userTestResult.count.mockResolvedValue(0);
      mockPrisma.test.delete.mockResolvedValue(mockTest);
    });

    it('should delete test successfully as creator', async () => {
      await service.deleteTest(1, 1, 'USER');

      expect(service.getTestById).toHaveBeenCalledWith(1);
      expect(mockPrisma.userTestResult.count).toHaveBeenCalledWith({
        where: { testId: 1, status: 'COMPLETED' }
      });
      expect(mockPrisma.test.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should delete test successfully as admin', async () => {
      await service.deleteTest(1, 2, 'ADMIN');

      expect(mockPrisma.test.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should throw ForbiddenError when user is not creator or admin', async () => {
      await expect(service.deleteTest(1, 2, 'USER')).rejects.toThrow(ForbiddenError);
    });

    it('should throw ValidationError when test has completed attempts', async () => {
      mockPrisma.userTestResult.count.mockResolvedValue(5);

      await expect(service.deleteTest(1, 1, 'USER')).rejects.toThrow(ValidationError);
      expect(mockPrisma.test.delete).not.toHaveBeenCalled();
    });
  });

  describe('addQuestionToTest', () => {
    const mockTest = {
      id: 1,
      createdBy: 1,
      creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
      course: { id: 1, title: 'Course 1', category: 'Programming' },
      lesson: null,
      testQuestions: [],
      _count: { userTestResults: 0, testQuestions: 0 }
    };

    const mockQuestion = { id: 1, title: 'Question 1' };

    beforeEach(() => {
      jest.spyOn(service, 'getTestById').mockResolvedValue(mockTest as any);
      mockPrisma.question.findUnique.mockResolvedValue(mockQuestion);
      mockPrisma.testQuestion.findUnique.mockResolvedValue(null);
      mockPrisma.testQuestion.findFirst.mockResolvedValue({ sortOrder: 5 });
      mockPrisma.testQuestion.create.mockResolvedValue({});
    });

    it('should add question to test successfully', async () => {
      await service.addQuestionToTest(1, 1, 3, 1, 'USER');

      expect(service.getTestById).toHaveBeenCalledWith(1);
      expect(mockPrisma.question.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockPrisma.testQuestion.create).toHaveBeenCalledWith({
        data: { testId: 1, questionId: 1, sortOrder: 3 }
      });
    });

    it('should auto-generate sort order when not provided', async () => {
      await service.addQuestionToTest(1, 1, undefined, 1, 'USER');

      expect(mockPrisma.testQuestion.findFirst).toHaveBeenCalledWith({
        where: { testId: 1 },
        orderBy: { sortOrder: 'desc' }
      });
      expect(mockPrisma.testQuestion.create).toHaveBeenCalledWith({
        data: { testId: 1, questionId: 1, sortOrder: 6 }
      });
    });

    it('should throw ForbiddenError when user is not creator or admin', async () => {
      await expect(service.addQuestionToTest(1, 1, 3, 2, 'USER')).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError when question does not exist', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(null);

      await expect(service.addQuestionToTest(1, 999, 3, 1, 'USER')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when question is already in test', async () => {
      mockPrisma.testQuestion.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.addQuestionToTest(1, 1, 3, 1, 'USER')).rejects.toThrow(ValidationError);
    });
  });

  describe('canUserTakeTest', () => {
    const mockTest = {
      id: 1,
      isPublished: true,
      availableFrom: null,
      availableUntil: null,
      maxAttempts: 3,
      creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
      course: { id: 1, title: 'Course 1', category: 'Programming' },
      lesson: null,
      testQuestions: [],
      _count: { userTestResults: 0, testQuestions: 0 }
    };

    beforeEach(() => {
      jest.spyOn(service, 'getTestById').mockResolvedValue(mockTest as any);
      mockPrisma.userTestResult.count.mockResolvedValue(0);
      mockPrisma.userTestResult.findFirst.mockResolvedValue(null);
    });

    it('should return canTake: true when all conditions are met', async () => {
      const result = await service.canUserTakeTest(1, 1);

      expect(result).toEqual({ canTake: true });
    });

    it('should return canTake: false when test is not published', async () => {
      jest.spyOn(service, 'getTestById').mockResolvedValue({ ...mockTest, isPublished: false } as any);

      const result = await service.canUserTakeTest(1, 1);

      expect(result).toEqual({ canTake: false, reason: 'Test is not published' });
    });

    it('should return canTake: false when test is not yet available', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      jest.spyOn(service, 'getTestById').mockResolvedValue({ ...mockTest, availableFrom: futureDate } as any);

      const result = await service.canUserTakeTest(1, 1);

      expect(result).toEqual({ canTake: false, reason: 'Test is not yet available' });
    });

    it('should return canTake: false when test is no longer available', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      jest.spyOn(service, 'getTestById').mockResolvedValue({ ...mockTest, availableUntil: pastDate } as any);

      const result = await service.canUserTakeTest(1, 1);

      expect(result).toEqual({ canTake: false, reason: 'Test is no longer available' });
    });

    it('should return canTake: false when max attempts exceeded', async () => {
      mockPrisma.userTestResult.count.mockResolvedValue(3);

      const result = await service.canUserTakeTest(1, 1);

      expect(result).toEqual({ canTake: false, reason: 'Maximum attempts (3) exceeded' });
    });

    it('should return canTake: false when test is in progress', async () => {
      mockPrisma.userTestResult.findFirst.mockResolvedValue({ id: 1, status: 'IN_PROGRESS' });

      const result = await service.canUserTakeTest(1, 1);

      expect(result).toEqual({ canTake: false, reason: 'Test is already in progress' });
    });
  });

  describe('startTest', () => {
    const mockTest = {
      id: 1,
      testQuestions: [
        { question: { points: 10 } },
        { question: { points: 15 } }
      ],
      creator: { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User' },
      course: { id: 1, title: 'Course 1', category: 'Programming' },
      lesson: null,
      _count: { userTestResults: 0, testQuestions: 2 }
    };

    const mockTestResult = {
      id: 1,
      userId: 1,
      testId: 1,
      attemptNumber: 1,
      status: 'IN_PROGRESS',
      totalPoints: 25,
      test: { id: 1, title: 'Test 1', timeLimitMinutes: 60, passingScore: 70, showResultsImmediately: true },
      user: { id: 1, username: 'user1', firstName: 'Test', lastName: 'User' },
      userAnswers: []
    };

    beforeEach(() => {
      jest.spyOn(service, 'canUserTakeTest').mockResolvedValue({ canTake: true });
      jest.spyOn(service, 'getTestById').mockResolvedValue(mockTest as any);
      mockPrisma.userTestResult.count.mockResolvedValue(0);
      mockPrisma.userTestResult.create.mockResolvedValue(mockTestResult);
    });

    it('should start test successfully', async () => {
      const result = await service.startTest({ userId: 1, testId: 1 });

      expect(service.canUserTakeTest).toHaveBeenCalledWith(1, 1);
      expect(mockPrisma.userTestResult.count).toHaveBeenCalledWith({
        where: { userId: 1, testId: 1, status: { in: ['COMPLETED', 'ABANDONED'] } }
      });
      expect(mockPrisma.userTestResult.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          testId: 1,
          attemptNumber: 1,
          startedAt: expect.any(Date),
          status: 'IN_PROGRESS',
          totalPoints: 25,
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockTestResult);
    });

    it('should throw ValidationError when user cannot take test', async () => {
      jest.spyOn(service, 'canUserTakeTest').mockResolvedValue({ canTake: false, reason: 'Test not available' });

      await expect(service.startTest({ userId: 1, testId: 1 })).rejects.toThrow(ValidationError);
    });

    it('should set correct attempt number for subsequent attempts', async () => {
      mockPrisma.userTestResult.count.mockResolvedValue(2);

      await service.startTest({ userId: 1, testId: 1 });

      expect(mockPrisma.userTestResult.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ attemptNumber: 3 }),
        include: expect.any(Object),
      });
    });
  });

  describe('getTestQuestionsForUser', () => {
    const mockTest = {
      id: 1,
      shuffleQuestions: false,
      shuffleOptions: false,
      testQuestions: [
        {
          question: {
            id: 1,
            title: 'Question 1',
            questionText: 'What is 2+2?',
            questionType: 'MULTIPLE_CHOICE',
            points: 10,
            timeLimitMinutes: 5,
            hints: null,
            questionOptions: [
              { id: 1, optionText: '3', sortOrder: 1 },
              { id: 2, optionText: '4', sortOrder: 2 },
            ]
          }
        }
      ]
    };

    beforeEach(() => {
      jest.spyOn(service, 'getTestById').mockResolvedValue(mockTest as any);
      jest.spyOn(service, 'canUserTakeTest').mockResolvedValue({ canTake: true });
    });

    it('should get test questions without shuffling', async () => {
      const result = await service.getTestQuestionsForUser(1, 1);

      expect(service.canUserTakeTest).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual([
        {
          id: 1,
          title: 'Question 1',
          questionText: 'What is 2+2?',
          questionType: 'MULTIPLE_CHOICE',
          points: 10,
          timeLimitMinutes: 5,
          hints: null,
          options: [
            { id: 1, optionText: '3', sortOrder: 1 },
            { id: 2, optionText: '4', sortOrder: 2 },
          ]
        }
      ]);
    });

    it('should throw ValidationError when user cannot access test', async () => {
      jest.spyOn(service, 'canUserTakeTest').mockResolvedValue({ canTake: false, reason: 'Not available' });

      await expect(service.getTestQuestionsForUser(1, 1)).rejects.toThrow(ValidationError);
    });

    it('should shuffle questions when enabled', async () => {
      const testWithShuffle = { ...mockTest, shuffleQuestions: true };
      jest.spyOn(service, 'getTestById').mockResolvedValue(testWithShuffle as any);

      // Mock shuffle to return reversed array
      const shuffleSpy = jest.spyOn(service as any, 'shuffleArray').mockImplementation((arr) => [...arr].reverse());

      await service.getTestQuestionsForUser(1, 1);

      expect(shuffleSpy).toHaveBeenCalled();
    });

    it('should shuffle options when enabled', async () => {
      const testWithShuffle = { ...mockTest, shuffleOptions: true };
      jest.spyOn(service, 'getTestById').mockResolvedValue(testWithShuffle as any);

      const shuffleSpy = jest.spyOn(service as any, 'shuffleArray').mockImplementation((arr) => [...arr].reverse());

      await service.getTestQuestionsForUser(1, 1);

      expect(shuffleSpy).toHaveBeenCalled();
    });
  });

  describe('getTestStatistics', () => {
    const mockResults = [
      { score: { toNumber: () => 85 }, timeSpentMinutes: 45, isPassed: true },
      { score: { toNumber: () => 72 }, timeSpentMinutes: 60, isPassed: true },
      { score: { toNumber: () => 55 }, timeSpentMinutes: 30, isPassed: false },
    ];

    beforeEach(() => {
      mockPrisma.userTestResult.findMany.mockResolvedValue(mockResults);
    });

    it('should calculate test statistics correctly', async () => {
      const result = await service.getTestStatistics(1);

      expect(mockPrisma.userTestResult.findMany).toHaveBeenCalledWith({
        where: { testId: 1, status: 'COMPLETED' },
        select: {
          score: true,
          timeSpentMinutes: true,
          isPassed: true,
        }
      });

      expect(result).toEqual({
        totalAttempts: 3,
        passedAttempts: 2,
        failedAttempts: 1,
        averageScore: (85 + 72 + 55) / 3,
        averageTimeSpent: (45 + 60 + 30) / 3,
        highestScore: 85,
        lowestScore: 55,
      });
    });

    it('should handle empty results', async () => {
      mockPrisma.userTestResult.findMany.mockResolvedValue([]);

      const result = await service.getTestStatistics(1);

      expect(result).toEqual({
        totalAttempts: 0,
        passedAttempts: 0,
        failedAttempts: 0,
        averageScore: 0,
        averageTimeSpent: 0,
        highestScore: 0,
        lowestScore: 0,
      });
    });
  });
});
import { PrismaClient, Test, TestQuestion, UserTestResult, UserAnswer, TestStatus, Question, QuestionOption } from '@prisma/client';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';

const prisma = new PrismaClient();

export interface CreateTestData {
  title: string;
  description?: string;
  courseId: number;
  lessonId?: number;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  passingScore?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResultsImmediately?: boolean;
  isPublished?: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
  createdBy: number;
}

export interface UpdateTestData {
  title?: string;
  description?: string;
  courseId?: number;
  lessonId?: number;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  passingScore?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResultsImmediately?: boolean;
  isPublished?: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
}

export interface TestQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  courseId?: number;
  lessonId?: number;
  isPublished?: boolean;
  availableOnly?: boolean;
  search?: string;
}

export interface StartTestData {
  userId: number;
  testId: number;
}

export interface SubmitTestData {
  testResultId: number;
  answers: TestAnswerData[];
}

export interface TestAnswerData {
  questionId: number;
  selectedOptionId?: number;
  answerText?: string;
}

export interface TestStatistics {
  totalAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  averageScore: number;
  averageTimeSpent: number;
  highestScore: number;
  lowestScore: number;
}

// Include types for complex queries
const testInclude = {
  creator: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
    }
  },
  course: {
    select: {
      id: true,
      title: true,
      category: true,
    }
  },
  lesson: {
    select: {
      id: true,
      title: true,
    }
  },
  testQuestions: {
    include: {
      question: {
        include: {
          questionOptions: {
            orderBy: { sortOrder: 'asc' as const }
          }
        }
      }
    },
    orderBy: { sortOrder: 'asc' as const }
  },
  _count: {
    select: {
      userTestResults: true,
      testQuestions: true
    }
  }
} as const;

const testResultInclude = {
  test: {
    select: {
      id: true,
      title: true,
      timeLimitMinutes: true,
      passingScore: true,
      showResultsImmediately: true,
    }
  },
  user: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
    }
  },
  userAnswers: {
    include: {
      question: {
        select: {
          id: true,
          title: true,
          questionText: true,
          questionType: true,
          points: true,
          explanation: true,
        }
      },
      selectedOption: {
        select: {
          id: true,
          optionText: true,
          isCorrect: true,
          explanation: true,
        }
      }
    }
  }
} as const;

type TestWithRelations = Test & {
  creator: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  course: {
    id: number;
    title: string;
    category: string;
  };
  lesson: {
    id: number;
    title: string;
  } | null;
  testQuestions: (TestQuestion & {
    question: Question & {
      questionOptions: QuestionOption[];
    };
  })[];
  _count: {
    userTestResults: number;
    testQuestions: number;
  };
};

type TestResultWithRelations = UserTestResult & {
  test: {
    id: number;
    title: string;
    timeLimitMinutes: number | null;
    passingScore: number;
    showResultsImmediately: boolean;
  };
  user: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  userAnswers: (UserAnswer & {
    question: {
      id: number;
      title: string;
      questionText: string;
      questionType: string;
      points: number;
      explanation: string | null;
    };
    selectedOption: {
      id: number;
      optionText: string;
      isCorrect: boolean;
      explanation: string | null;
    } | null;
  })[];
};

export type TestWithQuestions = TestWithRelations;
export type TestResult = TestResultWithRelations;

export class TestService {
  /**
   * Create a new test
   */
  async createTest(data: CreateTestData): Promise<TestWithQuestions> {
    // Validate course exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId }
    });
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Validate lesson exists if provided
    if (data.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: data.lessonId }
      });
      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }
    }

    // Validate date range
    if (data.availableFrom && data.availableUntil) {
      if (data.availableFrom >= data.availableUntil) {
        throw new ValidationError('Available from date must be before available until date');
      }
    }

    const test = await prisma.test.create({
      data: {
        title: data.title,
        description: data.description,
        courseId: data.courseId,
        lessonId: data.lessonId,
        timeLimitMinutes: data.timeLimitMinutes,
        maxAttempts: data.maxAttempts,
        passingScore: data.passingScore || 60.00,
        shuffleQuestions: data.shuffleQuestions || false,
        shuffleOptions: data.shuffleOptions || false,
        showResultsImmediately: data.showResultsImmediately ?? true,
        isPublished: data.isPublished || false,
        availableFrom: data.availableFrom,
        availableUntil: data.availableUntil,
        createdBy: data.createdBy,
      },
      include: testInclude,
    });

    return test;
  }

  /**
   * Get tests with filtering and pagination
   */
  async getTests(options: TestQueryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      courseId,
      lessonId,
      isPublished,
      availableOnly = false,
      search
    } = options;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (courseId) where.courseId = courseId;
    if (lessonId) where.lessonId = lessonId;
    if (typeof isPublished === 'boolean') where.isPublished = isPublished;

    if (availableOnly) {
      const now = new Date();
      where.AND = [
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
      ];
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: testInclude,
      }),
      prisma.test.count({ where }),
    ]);

    return {
      data: tests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get test by ID
   */
  async getTestById(id: number): Promise<TestWithQuestions> {
    const test = await prisma.test.findUnique({
      where: { id },
      include: testInclude,
    });

    if (!test) {
      throw new NotFoundError('Test not found');
    }

    return test;
  }

  /**
   * Update test
   */
  async updateTest(id: number, data: UpdateTestData, userId: number, userRole: string): Promise<TestWithQuestions> {
    const test = await this.getTestById(id);

    // Check permissions - only creator or admin can update
    if (test.createdBy !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You can only update tests you created');
    }

    // Validate course exists if provided
    if (data.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: data.courseId }
      });
      if (!course) {
        throw new NotFoundError('Course not found');
      }
    }

    // Validate lesson exists if provided
    if (data.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: data.lessonId }
      });
      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }
    }

    // Validate date range
    const availableFrom = data.availableFrom || test.availableFrom;
    const availableUntil = data.availableUntil || test.availableUntil;
    
    if (availableFrom && availableUntil && availableFrom >= availableUntil) {
      throw new ValidationError('Available from date must be before available until date');
    }

    const updatedTest = await prisma.test.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        courseId: data.courseId,
        lessonId: data.lessonId,
        timeLimitMinutes: data.timeLimitMinutes,
        maxAttempts: data.maxAttempts,
        passingScore: data.passingScore,
        shuffleQuestions: data.shuffleQuestions,
        shuffleOptions: data.shuffleOptions,
        showResultsImmediately: data.showResultsImmediately,
        isPublished: data.isPublished,
        availableFrom: data.availableFrom,
        availableUntil: data.availableUntil,
      },
      include: testInclude,
    });

    return updatedTest;
  }

  /**
   * Delete test
   */
  async deleteTest(id: number, userId: number, userRole: string): Promise<void> {
    const test = await this.getTestById(id);

    // Check permissions - only creator or admin can delete
    if (test.createdBy !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You can only delete tests you created');
    }

    // Check if test has any completed attempts
    const completedAttempts = await prisma.userTestResult.count({
      where: {
        testId: id,
        status: 'COMPLETED'
      }
    });

    if (completedAttempts > 0) {
      throw new ValidationError('Cannot delete test with completed attempts');
    }

    await prisma.test.delete({
      where: { id }
    });
  }

  /**
   * Add question to test
   */
  async addQuestionToTest(testId: number, questionId: number, sortOrder?: number, userId?: number, userRole?: string): Promise<void> {
    const test = await this.getTestById(testId);

    // Check permissions for non-admin users
    if (userId && userRole !== 'ADMIN' && test.createdBy !== userId) {
      throw new ForbiddenError('You can only modify tests you created');
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    // Check if question is already in test
    const existingTestQuestion = await prisma.testQuestion.findUnique({
      where: {
        testId_questionId: {
          testId,
          questionId
        }
      }
    });

    if (existingTestQuestion) {
      throw new ValidationError('Question is already added to this test');
    }

    // Get next sort order if not provided
    if (sortOrder === undefined) {
      const lastQuestion = await prisma.testQuestion.findFirst({
        where: { testId },
        orderBy: { sortOrder: 'desc' }
      });
      sortOrder = lastQuestion ? lastQuestion.sortOrder + 1 : 1;
    }

    await prisma.testQuestion.create({
      data: {
        testId,
        questionId,
        sortOrder
      }
    });
  }

  /**
   * Remove question from test
   */
  async removeQuestionFromTest(testId: number, questionId: number, userId?: number, userRole?: string): Promise<void> {
    const test = await this.getTestById(testId);

    // Check permissions for non-admin users
    if (userId && userRole !== 'ADMIN' && test.createdBy !== userId) {
      throw new ForbiddenError('You can only modify tests you created');
    }

    const testQuestion = await prisma.testQuestion.findUnique({
      where: {
        testId_questionId: {
          testId,
          questionId
        }
      }
    });

    if (!testQuestion) {
      throw new NotFoundError('Question not found in test');
    }

    await prisma.testQuestion.delete({
      where: {
        testId_questionId: {
          testId,
          questionId
        }
      }
    });
  }

  /**
   * Check if user can take test
   */
  async canUserTakeTest(userId: number, testId: number): Promise<{ canTake: boolean; reason?: string }> {
    const test = await this.getTestById(testId);

    // Check if test is published
    if (!test.isPublished) {
      return { canTake: false, reason: 'Test is not published' };
    }

    // Check availability dates
    const now = new Date();
    if (test.availableFrom && test.availableFrom > now) {
      return { canTake: false, reason: 'Test is not yet available' };
    }
    if (test.availableUntil && test.availableUntil < now) {
      return { canTake: false, reason: 'Test is no longer available' };
    }

    // Check attempt limits
    if (test.maxAttempts) {
      const attemptCount = await prisma.userTestResult.count({
        where: {
          userId,
          testId,
          status: { in: ['COMPLETED', 'IN_PROGRESS'] }
        }
      });

      if (attemptCount >= test.maxAttempts) {
        return { canTake: false, reason: `Maximum attempts (${test.maxAttempts}) exceeded` };
      }
    }

    // Check for active test session
    const activeSession = await prisma.userTestResult.findFirst({
      where: {
        userId,
        testId,
        status: 'IN_PROGRESS'
      }
    });

    if (activeSession) {
      return { canTake: false, reason: 'Test is already in progress' };
    }

    return { canTake: true };
  }

  /**
   * Start test for user
   */
  async startTest(data: StartTestData): Promise<TestResult> {
    const { userId, testId } = data;

    // Check if user can take test
    const canTake = await this.canUserTakeTest(userId, testId);
    if (!canTake.canTake) {
      throw new ValidationError(canTake.reason || 'Cannot take test');
    }

    const test = await this.getTestById(testId);

    // Get attempt number
    const previousAttempts = await prisma.userTestResult.count({
      where: {
        userId,
        testId,
        status: { in: ['COMPLETED', 'ABANDONED'] }
      }
    });

    const attemptNumber = previousAttempts + 1;

    // Create test result
    const testResult = await prisma.userTestResult.create({
      data: {
        userId,
        testId,
        attemptNumber,
        startedAt: new Date(),
        status: 'IN_PROGRESS',
        totalPoints: test.testQuestions.reduce((sum, tq) => sum + tq.question.points, 0),
      },
      include: testResultInclude,
    });

    return testResult;
  }

  /**
   * Get user's current test session
   */
  async getUserTestSession(userId: number, testId: number): Promise<TestResult | null> {
    const testResult = await prisma.userTestResult.findFirst({
      where: {
        userId,
        testId,
        status: 'IN_PROGRESS'
      },
      include: testResultInclude,
    });

    return testResult;
  }

  /**
   * Submit test answers
   */
  async submitTest(data: SubmitTestData): Promise<TestResult> {
    const { testResultId, answers } = data;

    const testResult = await prisma.userTestResult.findUnique({
      where: { id: testResultId },
      include: {
        test: {
          include: {
            testQuestions: {
              include: {
                question: {
                  include: {
                    questionOptions: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!testResult) {
      throw new NotFoundError('Test result not found');
    }

    if (testResult.status !== 'IN_PROGRESS') {
      throw new ValidationError('Test is not in progress');
    }

    // Process answers and calculate score
    let earnedPoints = 0;
    const userAnswers: any[] = [];

    for (const answer of answers) {
      const testQuestion = testResult.test.testQuestions.find(tq => tq.questionId === answer.questionId);
      if (!testQuestion) continue;

      const question = testQuestion.question;
      let isCorrect: boolean | null = null;
      let pointsEarned = 0;

      if (question.questionType === 'MULTIPLE_CHOICE' && answer.selectedOptionId) {
        const selectedOption = question.questionOptions.find(opt => opt.id === answer.selectedOptionId);
        isCorrect = selectedOption?.isCorrect || false;
        pointsEarned = isCorrect ? question.points : 0;
      } else if (question.questionType === 'TRUE_FALSE' && answer.selectedOptionId) {
        const selectedOption = question.questionOptions.find(opt => opt.id === answer.selectedOptionId);
        isCorrect = selectedOption?.isCorrect || false;
        pointsEarned = isCorrect ? question.points : 0;
      }
      // For ESSAY and PROGRAMMING questions, manual grading is required (isCorrect = null)

      earnedPoints += pointsEarned;

      userAnswers.push({
        testResultId,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        answerText: answer.answerText,
        isCorrect,
        pointsEarned,
        answeredAt: new Date(),
      });
    }

    // Calculate score percentage
    const score = testResult.totalPoints > 0 ? (earnedPoints / testResult.totalPoints) * 100 : 0;
    const isPassed = score >= testResult.test.passingScore.toNumber();

    // Calculate time spent
    const timeSpentMinutes = Math.ceil((new Date().getTime() - testResult.startedAt.getTime()) / (1000 * 60));

    // Update test result
    const [updatedTestResult] = await Promise.all([
      prisma.userTestResult.update({
        where: { id: testResultId },
        data: {
          score,
          earnedPoints,
          isPassed,
          timeSpentMinutes,
          completedAt: new Date(),
          status: 'COMPLETED',
        },
        include: testResultInclude,
      }),
      // Create user answers
      prisma.userAnswer.createMany({
        data: userAnswers
      })
    ]);

    return updatedTestResult;
  }

  /**
   * Get test results for a user
   */
  async getUserTestResults(userId?: number, testId?: number, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (testId) where.testId = testId;

    const [results, total] = await Promise.all([
      prisma.userTestResult.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: testResultInclude,
      }),
      prisma.userTestResult.count({ where }),
    ]);

    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get test statistics
   */
  async getTestStatistics(testId: number): Promise<TestStatistics> {
    const results = await prisma.userTestResult.findMany({
      where: {
        testId,
        status: 'COMPLETED'
      },
      select: {
        score: true,
        timeSpentMinutes: true,
        isPassed: true,
      }
    });

    const totalAttempts = results.length;
    const passedAttempts = results.filter(r => r.isPassed).length;
    const failedAttempts = totalAttempts - passedAttempts;
    
    const scores = results.map(r => r.score.toNumber());
    const times = results.filter(r => r.timeSpentMinutes).map(r => r.timeSpentMinutes!);

    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const averageTimeSpent = times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    return {
      totalAttempts,
      passedAttempts,
      failedAttempts,
      averageScore,
      averageTimeSpent,
      highestScore,
      lowestScore,
    };
  }

  /**
   * Get shuffled test questions for user
   */
  async getTestQuestionsForUser(testId: number, userId: number): Promise<any[]> {
    const test = await this.getTestById(testId);
    
    // Check if user has permission to view questions
    const canTake = await this.canUserTakeTest(userId, testId);
    if (!canTake.canTake) {
      throw new ValidationError(canTake.reason || 'Cannot access test questions');
    }

    let questions = test.testQuestions.map(tq => ({
      id: tq.question.id,
      title: tq.question.title,
      questionText: tq.question.questionText,
      questionType: tq.question.questionType,
      points: tq.question.points,
      timeLimitMinutes: tq.question.timeLimitMinutes,
      hints: tq.question.hints,
      options: tq.question.questionOptions.map(opt => ({
        id: opt.id,
        optionText: opt.optionText,
        sortOrder: opt.sortOrder,
      }))
    }));

    // Shuffle questions if enabled
    if (test.shuffleQuestions) {
      questions = this.shuffleArray(questions);
    }

    // Shuffle options if enabled
    if (test.shuffleOptions) {
      questions = questions.map(q => ({
        ...q,
        options: this.shuffleArray(q.options)
      }));
    }

    return questions;
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const testService = new TestService();
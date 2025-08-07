import { PrismaClient, Question, QuestionOption, QuestionType, DifficultyLevel } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

export interface CreateQuestionData {
  title: string;
  questionText: string;
  questionType: QuestionType;
  difficultyLevel?: DifficultyLevel;
  points?: number;
  timeLimitMinutes?: number;
  explanation?: string;
  hints?: string[];
  tags?: string[];
  isPublished?: boolean;
  courseId?: number;
  lessonId?: number;
  createdBy: number;
  options?: CreateQuestionOptionData[];
}

export interface CreateQuestionOptionData {
  optionText: string;
  isCorrect: boolean;
  sortOrder?: number;
  explanation?: string;
}

export interface UpdateQuestionData {
  title?: string;
  questionText?: string;
  difficultyLevel?: DifficultyLevel;
  points?: number;
  timeLimitMinutes?: number;
  explanation?: string;
  hints?: string[];
  tags?: string[];
  isPublished?: boolean;
  courseId?: number;
  lessonId?: number;
  options?: UpdateQuestionOptionData[];
}

export interface UpdateQuestionOptionData {
  id?: number;
  optionText: string;
  isCorrect: boolean;
  sortOrder?: number;
  explanation?: string;
}

export interface QuestionQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  courseId?: number;
  lessonId?: number;
  questionType?: QuestionType;
  difficultyLevel?: DifficultyLevel;
  isPublished?: boolean;
  tags?: string[];
  search?: string;
}

export interface QuestionWithOptions extends Question {
  questionOptions: QuestionOption[];
  creator: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  course?: {
    id: number;
    title: string;
  } | null;
  lesson?: {
    id: number;
    title: string;
  } | null;
}

export class QuestionService {
  /**
   * Create a new question
   */
  async createQuestion(data: CreateQuestionData): Promise<QuestionWithOptions> {
    // Validate course and lesson exist if provided
    if (data.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: data.courseId }
      });
      if (!course) {
        throw new NotFoundError('Course not found');
      }
    }

    if (data.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: data.lessonId }
      });
      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }
    }

    // For multiple choice questions, validate options
    if (data.questionType === 'MULTIPLE_CHOICE' && (!data.options || data.options.length < 2)) {
      throw new Error('Multiple choice questions must have at least 2 options');
    }

    if (data.questionType === 'MULTIPLE_CHOICE' && data.options) {
      const correctOptions = data.options.filter(opt => opt.isCorrect);
      if (correctOptions.length === 0) {
        throw new Error('Multiple choice questions must have at least one correct option');
      }
    }

    const question = await prisma.question.create({
      data: {
        title: data.title,
        questionText: data.questionText,
        questionType: data.questionType,
        difficultyLevel: data.difficultyLevel || 'BEGINNER',
        points: data.points || 10,
        timeLimitMinutes: data.timeLimitMinutes,
        explanation: data.explanation,
        hints: data.hints ? JSON.stringify(data.hints) : null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        isPublished: data.isPublished || false,
        courseId: data.courseId,
        lessonId: data.lessonId,
        createdBy: data.createdBy,
        questionOptions: data.options ? {
          create: data.options.map((option, index) => ({
            optionText: option.optionText,
            isCorrect: option.isCorrect,
            sortOrder: option.sortOrder || index + 1,
            explanation: option.explanation,
          }))
        } : undefined,
      },
      include: {
        questionOptions: {
          orderBy: { sortOrder: 'asc' }
        },
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
          }
        },
        lesson: {
          select: {
            id: true,
            title: true,
          }
        },
      },
    });

    return question;
  }

  /**
   * Get questions with filtering and pagination
   */
  async getQuestions(options: QuestionQueryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      courseId,
      lessonId,
      questionType,
      difficultyLevel,
      isPublished,
      tags,
      search
    } = options;

    const skip = (page - 1) * limit;
    
    const where: any = {};

    if (courseId) where.courseId = courseId;
    if (lessonId) where.lessonId = lessonId;
    if (questionType) where.questionType = questionType;
    if (difficultyLevel) where.difficultyLevel = difficultyLevel;
    if (typeof isPublished === 'boolean') where.isPublished = isPublished;

    if (tags && tags.length > 0) {
      where.OR = tags.map(tag => ({
        tags: {
          contains: tag
        }
      }));
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { questionText: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          questionOptions: {
            orderBy: { sortOrder: 'asc' }
          },
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
            }
          },
          lesson: {
            select: {
              id: true,
              title: true,
            }
          },
        },
      }),
      prisma.question.count({ where }),
    ]);

    return {
      data: questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get question by ID
   */
  async getQuestionById(id: number): Promise<QuestionWithOptions> {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        questionOptions: {
          orderBy: { sortOrder: 'asc' }
        },
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
          }
        },
        lesson: {
          select: {
            id: true,
            title: true,
          }
        },
      },
    });

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    return question;
  }

  /**
   * Update question
   */
  async updateQuestion(id: number, data: UpdateQuestionData, userId: number, userRole: string): Promise<QuestionWithOptions> {
    const question = await this.getQuestionById(id);

    // Check permissions - only creator or admin can update
    if (question.createdBy !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You can only update questions you created');
    }

    // Validate course and lesson exist if provided
    if (data.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: data.courseId }
      });
      if (!course) {
        throw new NotFoundError('Course not found');
      }
    }

    if (data.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: data.lessonId }
      });
      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }
    }

    // Handle question options updates for multiple choice questions
    if (data.options && question.questionType === 'MULTIPLE_CHOICE') {
      const correctOptions = data.options.filter(opt => opt.isCorrect);
      if (correctOptions.length === 0) {
        throw new Error('Multiple choice questions must have at least one correct option');
      }

      // Delete existing options and create new ones
      await prisma.questionOption.deleteMany({
        where: { questionId: id }
      });
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        title: data.title,
        questionText: data.questionText,
        difficultyLevel: data.difficultyLevel,
        points: data.points,
        timeLimitMinutes: data.timeLimitMinutes,
        explanation: data.explanation,
        hints: data.hints ? JSON.stringify(data.hints) : undefined,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
        isPublished: data.isPublished,
        courseId: data.courseId,
        lessonId: data.lessonId,
        questionOptions: data.options ? {
          create: data.options.map((option, index) => ({
            optionText: option.optionText,
            isCorrect: option.isCorrect,
            sortOrder: option.sortOrder || index + 1,
            explanation: option.explanation,
          }))
        } : undefined,
      },
      include: {
        questionOptions: {
          orderBy: { sortOrder: 'asc' }
        },
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
          }
        },
        lesson: {
          select: {
            id: true,
            title: true,
          }
        },
      },
    });

    return updatedQuestion;
  }

  /**
   * Delete question
   */
  async deleteQuestion(id: number, userId: number, userRole: string): Promise<void> {
    const question = await this.getQuestionById(id);

    // Check permissions - only creator or admin can delete
    if (question.createdBy !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You can only delete questions you created');
    }

    await prisma.question.delete({
      where: { id }
    });
  }

  /**
   * Get unique categories from all questions
   */
  async getCategories(): Promise<string[]> {
    const courses = await prisma.course.findMany({
      select: {
        category: true
      },
      distinct: ['category']
    });

    return courses.map(course => course.category).filter(Boolean);
  }

  /**
   * Get unique tags from all questions
   */
  async getTags(): Promise<string[]> {
    const questions = await prisma.question.findMany({
      select: {
        tags: true
      },
      where: {
        tags: {
          not: null
        }
      }
    });

    const allTags = new Set<string>();
    
    questions.forEach(question => {
      if (question.tags) {
        try {
          const tags = JSON.parse(question.tags) as string[];
          tags.forEach(tag => allTags.add(tag));
        } catch (error) {
          // Skip invalid JSON
        }
      }
    });

    return Array.from(allTags).sort();
  }
}

export const questionService = new QuestionService();
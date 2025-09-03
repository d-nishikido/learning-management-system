import { Request } from 'express';
import { TestService } from './testService';
import { 
  SupportedLocale, 
  getLocaleFromRequest,
  DateFormatter,
  NumberFormatter
} from '../utils/i18n';
import { TestErrorFactory } from '../utils/localizedErrors';

// Extended interfaces with localization support
export interface LocalizedTestData {
  locale?: SupportedLocale;
  timeZone?: string;
}

export interface LocalizedTestResult {
  id: number;
  score: string;
  formattedScore: string;
  isPassed: boolean;
  status: string;
  startedAt: string;
  completedAt: string | null;
  timeSpent: string | null;
  test: {
    id: number;
    title: string;
    timeLimitMinutes: number | null;
    passingScore: string;
  };
}

export interface LocalizedTestStatistics {
  totalAttempts: string;
  passedAttempts: string;
  failedAttempts: string;
  averageScore: string;
  averageTimeSpent: string;
  highestScore: string;
  lowestScore: string;
  passRate: string;
}

export class LocalizedTestService extends TestService {
  private locale: SupportedLocale;
  private timeZone: string;
  private dateFormatter: DateFormatter;
  private numberFormatter: NumberFormatter;
  private errorFactory: TestErrorFactory;

  constructor(req: Request) {
    super();
    this.locale = getLocaleFromRequest(req);
    this.timeZone = (req.headers['x-timezone'] as string) || 'UTC';
    this.dateFormatter = new DateFormatter(this.locale, this.timeZone);
    this.numberFormatter = new NumberFormatter(this.locale);
    this.errorFactory = new TestErrorFactory(this.locale);
  }

  // Override methods to use localized errors
  override async getTestById(id: number) {
    try {
      return await super.getTestById(id);
    } catch (error: any) {
      if (error.message === 'Test not found') {
        throw this.errorFactory.testNotFound();
      }
      throw error;
    }
  }

  override async createTest(data: any) {
    try {
      return await super.createTest(data);
    } catch (error: any) {
      if (error.message === 'Course not found') {
        throw this.errorFactory.courseNotFound();
      }
      if (error.message === 'Lesson not found') {
        throw this.errorFactory.lessonNotFound();
      }
      if (error.message === 'Available from date must be before available until date') {
        throw this.errorFactory.invalidDateRange();
      }
      throw error;
    }
  }

  override async updateTest(id: number, data: any, userId: number, userRole: string) {
    try {
      return await super.updateTest(id, data, userId, userRole);
    } catch (error: any) {
      if (error.message === 'You can only update tests you created') {
        throw this.errorFactory.unauthorizedAccess('update');
      }
      if (error.message === 'Course not found') {
        throw this.errorFactory.courseNotFound();
      }
      if (error.message === 'Lesson not found') {
        throw this.errorFactory.lessonNotFound();
      }
      throw error;
    }
  }

  override async deleteTest(id: number, userId: number, userRole: string) {
    try {
      return await super.deleteTest(id, userId, userRole);
    } catch (error: any) {
      if (error.message === 'You can only delete tests you created') {
        throw this.errorFactory.unauthorizedAccess('delete');
      }
      if (error.message === 'Cannot delete test with completed attempts') {
        throw this.errorFactory.cannotDeleteTestWithResults();
      }
      throw error;
    }
  }

  override async addQuestionToTest(testId: number, questionId: number, sortOrder?: number, userId?: number, userRole?: string) {
    try {
      return await super.addQuestionToTest(testId, questionId, sortOrder, userId, userRole);
    } catch (error: any) {
      if (error.message === 'You can only modify tests you created') {
        throw this.errorFactory.unauthorizedAccess('modify');
      }
      if (error.message === 'Question not found') {
        throw this.errorFactory.questionNotFound();
      }
      if (error.message === 'Question is already added to this test') {
        throw this.errorFactory.questionAlreadyInTest();
      }
      throw error;
    }
  }

  override async removeQuestionFromTest(testId: number, questionId: number, userId?: number, userRole?: string) {
    try {
      return await super.removeQuestionFromTest(testId, questionId, userId, userRole);
    } catch (error: any) {
      if (error.message === 'You can only modify tests you created') {
        throw this.errorFactory.unauthorizedAccess('modify');
      }
      if (error.message === 'Question not found in test') {
        throw this.errorFactory.questionNotInTest();
      }
      throw error;
    }
  }

  override async canUserTakeTest(userId: number, testId: number) {
    const result = await super.canUserTakeTest(userId, testId);
    
    // Localize the reason message
    if (!result.canTake && result.reason) {
      const localizedReasons: Record<string, any> = {
        'Test is not published': this.errorFactory.testNotPublished().message,
        'Test is not yet available': this.errorFactory.testNotAvailableYet().message,
        'Test is no longer available': this.errorFactory.testNoLongerAvailable().message,
        'Test is already in progress': this.errorFactory.testInProgress().message,
      };

      // Handle max attempts exceeded message
      if (result.reason.includes('Maximum attempts')) {
        const maxAttempts = result.reason.match(/\((\d+)\)/)?.[1];
        if (maxAttempts) {
          result.reason = this.errorFactory.maxAttemptsExceeded(parseInt(maxAttempts)).message;
        }
      } else if (localizedReasons[result.reason]) {
        result.reason = localizedReasons[result.reason];
      }
    }

    return result;
  }

  override async startTest(data: any) {
    try {
      return await super.startTest(data);
    } catch (error: any) {
      if (error.message.includes('Cannot take test')) {
        // Re-check eligibility to get localized reason
        const canTake = await this.canUserTakeTest(data.userId, data.testId);
        throw new Error(canTake.reason || error.message);
      }
      throw error;
    }
  }

  override async submitTest(data: any) {
    try {
      return await super.submitTest(data);
    } catch (error: any) {
      if (error.message === 'Test not in progress') {
        throw this.errorFactory.testNotInProgress();
      }
      throw error;
    }
  }

  override async getTestQuestionsForUser(testId: number, userId: number) {
    try {
      return await super.getTestQuestionsForUser(testId, userId);
    } catch (error: any) {
      if (error.message.includes('Cannot access test questions')) {
        const canTake = await this.canUserTakeTest(userId, testId);
        throw new Error(canTake.reason || error.message);
      }
      throw error;
    }
  }

  // Localized formatting methods
  async getLocalizedTestResult(testResultId: number): Promise<LocalizedTestResult> {
    const testResult = await this.getUserTestResults(undefined, undefined, { limit: 1 });
    const result = testResult.data.find(r => r.id === testResultId);
    
    if (!result) {
      throw this.errorFactory.testNotFound();
    }

    return {
      id: result.id,
      score: this.numberFormatter.formatScore(result.score.toNumber()),
      formattedScore: this.numberFormatter.formatPercentage(result.score.toNumber()),
      isPassed: result.isPassed,
      status: result.status,
      startedAt: this.dateFormatter.formatDateTime(result.startedAt),
      completedAt: result.completedAt ? this.dateFormatter.formatDateTime(result.completedAt) : null,
      timeSpent: result.timeSpentMinutes ? this.dateFormatter.formatDuration(result.timeSpentMinutes) : null,
      test: {
        id: result.test.id,
        title: result.test.title,
        timeLimitMinutes: result.test.timeLimitMinutes,
        passingScore: this.numberFormatter.formatPercentage(result.test.passingScore.toNumber())
      }
    };
  }

  async getLocalizedTestStatistics(testId: number): Promise<LocalizedTestStatistics> {
    const stats = await super.getTestStatistics(testId);
    
    const passRate = stats.totalAttempts > 0 ? 
      (stats.passedAttempts / stats.totalAttempts) * 100 : 0;

    return {
      totalAttempts: this.numberFormatter.formatInteger(stats.totalAttempts),
      passedAttempts: this.numberFormatter.formatInteger(stats.passedAttempts),
      failedAttempts: this.numberFormatter.formatInteger(stats.failedAttempts),
      averageScore: this.numberFormatter.formatScore(stats.averageScore),
      averageTimeSpent: this.dateFormatter.formatDuration(stats.averageTimeSpent),
      highestScore: this.numberFormatter.formatScore(stats.highestScore),
      lowestScore: this.numberFormatter.formatScore(stats.lowestScore),
      passRate: this.numberFormatter.formatPercentage(passRate)
    };
  }

  // Helper method to get localized test list with formatted dates
  async getLocalizedTests(options: any = {}) {
    const result = await super.getTests(options);
    
    const localizedTests = result.data.map(test => ({
      ...test,
      createdAt: this.dateFormatter.formatDateTime(test.createdAt),
      updatedAt: this.dateFormatter.formatDateTime(test.updatedAt),
      availableFrom: test.availableFrom ? this.dateFormatter.formatDateTime(test.availableFrom) : null,
      availableUntil: test.availableUntil ? this.dateFormatter.formatDateTime(test.availableUntil) : null,
      timeLimitDisplay: test.timeLimitMinutes ? this.dateFormatter.formatDuration(test.timeLimitMinutes) : null,
      passingScoreDisplay: this.numberFormatter.formatPercentage(test.passingScore.toNumber())
    }));

    return {
      ...result,
      data: localizedTests
    };
  }

  // Helper method to get user's localized test history
  async getLocalizedUserTestHistory(userId: number, options: any = {}) {
    const result = await super.getUserTestResults(userId, undefined, options);
    
    const localizedResults = result.data.map(testResult => ({
      ...testResult,
      score: this.numberFormatter.formatScore(testResult.score.toNumber()),
      formattedScore: this.numberFormatter.formatPercentage(testResult.score.toNumber()),
      startedAt: this.dateFormatter.formatDateTime(testResult.startedAt),
      completedAt: testResult.completedAt ? this.dateFormatter.formatDateTime(testResult.completedAt) : null,
      timeSpent: testResult.timeSpentMinutes ? this.dateFormatter.formatDuration(testResult.timeSpentMinutes) : null,
      relativeTime: this.dateFormatter.formatRelativeTime(testResult.startedAt)
    }));

    return {
      ...result,
      data: localizedResults
    };
  }

  // Get current locale and timezone info
  getLocalizationInfo() {
    return {
      locale: this.locale,
      timeZone: this.timeZone,
      isRTL: false // Japanese and English are both LTR
    };
  }
}
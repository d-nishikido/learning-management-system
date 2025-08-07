import { Request } from 'express';

export type SupportedLocale = 'en' | 'ja';

export interface LocalizedMessage {
  en: string;
  ja: string;
}

// Detect locale from request headers
export function getLocaleFromRequest(req: Request): SupportedLocale {
  const acceptLanguage = req.headers['accept-language'];
  const locale = req.headers['x-locale'] as string || 
                 req.query.locale as string ||
                 acceptLanguage?.split(',')[0]?.split('-')[0];

  return locale === 'ja' ? 'ja' : 'en';
}

// Test management error messages
export const TEST_ERROR_MESSAGES = {
  TEST_NOT_FOUND: {
    en: 'Test not found',
    ja: 'テストが見つかりません'
  },
  TEST_NOT_PUBLISHED: {
    en: 'Test is not published',
    ja: 'テストが公開されていません'
  },
  TEST_NOT_AVAILABLE_YET: {
    en: 'Test is not yet available',
    ja: 'テストはまだ利用できません'
  },
  TEST_NO_LONGER_AVAILABLE: {
    en: 'Test is no longer available',
    ja: 'テストは利用期間が終了しています'
  },
  MAX_ATTEMPTS_EXCEEDED: {
    en: 'Maximum attempts ({maxAttempts}) exceeded',
    ja: '最大受験回数（{maxAttempts}回）を超過しました'
  },
  TEST_IN_PROGRESS: {
    en: 'Test is already in progress',
    ja: 'テストは既に実行中です'
  },
  TEST_NOT_IN_PROGRESS: {
    en: 'Test is not in progress',
    ja: 'テストが実行中ではありません'
  },
  COURSE_NOT_FOUND: {
    en: 'Course not found',
    ja: 'コースが見つかりません'
  },
  LESSON_NOT_FOUND: {
    en: 'Lesson not found',
    ja: 'レッスンが見つかりません'
  },
  QUESTION_NOT_FOUND: {
    en: 'Question not found',
    ja: '問題が見つかりません'
  },
  QUESTION_ALREADY_IN_TEST: {
    en: 'Question is already added to this test',
    ja: 'この問題は既にテストに追加されています'
  },
  QUESTION_NOT_IN_TEST: {
    en: 'Question not found in test',
    ja: 'テストに問題が見つかりません'
  },
  CANNOT_DELETE_TEST_WITH_RESULTS: {
    en: 'Cannot delete test with completed attempts',
    ja: '完了した受験記録があるテストは削除できません'
  },
  INVALID_DATE_RANGE: {
    en: 'Available from date must be before available until date',
    ja: '利用開始日は利用終了日より前でなければなりません'
  },
  UNAUTHORIZED_ACCESS: {
    en: 'You can only {action} tests you created',
    ja: '自分が作成したテストのみ{action}できます'
  },
  INSUFFICIENT_PERMISSIONS: {
    en: 'Insufficient permissions to perform this action',
    ja: 'この操作を実行する権限がありません'
  },
  VALIDATION_ERROR: {
    en: 'Validation failed: {details}',
    ja: '入力検証エラー: {details}'
  }
} as const;

// Success messages
export const TEST_SUCCESS_MESSAGES = {
  TEST_CREATED: {
    en: 'Test created successfully',
    ja: 'テストが正常に作成されました'
  },
  TEST_UPDATED: {
    en: 'Test updated successfully',
    ja: 'テストが正常に更新されました'
  },
  TEST_DELETED: {
    en: 'Test deleted successfully',
    ja: 'テストが正常に削除されました'
  },
  TEST_PUBLISHED: {
    en: 'Test published successfully',
    ja: 'テストが正常に公開されました'
  },
  TEST_STARTED: {
    en: 'Test started successfully',
    ja: 'テストが正常に開始されました'
  },
  TEST_SUBMITTED: {
    en: 'Test submitted successfully',
    ja: 'テストが正常に提出されました'
  },
  QUESTION_ADDED: {
    en: 'Question added to test successfully',
    ja: '問題がテストに正常に追加されました'
  },
  QUESTION_REMOVED: {
    en: 'Question removed from test successfully',
    ja: '問題がテストから正常に削除されました'
  },
  RESULTS_RETRIEVED: {
    en: 'Test results retrieved successfully',
    ja: 'テスト結果が正常に取得されました'
  },
  STATISTICS_RETRIEVED: {
    en: 'Test statistics retrieved successfully',
    ja: 'テスト統計が正常に取得されました'
  },
  ELIGIBILITY_CHECKED: {
    en: 'Test eligibility checked successfully',
    ja: '受験資格が正常に確認されました'
  },
  QUESTIONS_RETRIEVED: {
    en: 'Test questions retrieved successfully',
    ja: 'テスト問題が正常に取得されました'
  },
  TESTS_RETRIEVED: {
    en: 'Tests retrieved successfully',
    ja: 'テストが正常に取得されました'
  }
} as const;

// Time and date related messages
export const TIME_MESSAGES = {
  TIME_REMAINING: {
    en: 'Time remaining: {time}',
    ja: '残り時間: {time}'
  },
  TIME_EXPIRED: {
    en: 'Time expired',
    ja: '時間切れ'
  },
  DURATION: {
    en: 'Duration: {duration} minutes',
    ja: '所要時間: {duration}分'
  },
  STARTED_AT: {
    en: 'Started at: {time}',
    ja: '開始時刻: {time}'
  },
  COMPLETED_AT: {
    en: 'Completed at: {time}',
    ja: '完了時刻: {time}'
  },
  AVAILABLE_FROM: {
    en: 'Available from: {date}',
    ja: '利用開始: {date}'
  },
  AVAILABLE_UNTIL: {
    en: 'Available until: {date}',
    ja: '利用終了: {date}'
  }
} as const;

// Test status messages
export const TEST_STATUS_MESSAGES = {
  DRAFT: {
    en: 'Draft',
    ja: '下書き'
  },
  PUBLISHED: {
    en: 'Published',
    ja: '公開済み'
  },
  IN_PROGRESS: {
    en: 'In Progress',
    ja: '実行中'
  },
  COMPLETED: {
    en: 'Completed',
    ja: '完了'
  },
  ABANDONED: {
    en: 'Abandoned',
    ja: '中断'
  },
  PASSED: {
    en: 'Passed',
    ja: '合格'
  },
  FAILED: {
    en: 'Failed',
    ja: '不合格'
  }
} as const;

// Utility function to get localized message
export function getLocalizedMessage(
  message: LocalizedMessage,
  locale: SupportedLocale,
  params?: Record<string, string | number>
): string {
  let text = message[locale];
  
  // Replace parameters in the message
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      text = text.replace(new RegExp(`{${key}}`, 'g'), String(value));
    });
  }
  
  return text;
}

// Date formatting utilities
export class DateFormatter {
  private locale: SupportedLocale;
  private timeZone: string;

  constructor(locale: SupportedLocale, timeZone: string = 'UTC') {
    this.locale = locale;
    this.timeZone = timeZone;
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: this.timeZone
    };

    return new Intl.DateTimeFormat(this.getIntlLocale(), options).format(dateObj);
  }

  formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.timeZone
    };

    return new Intl.DateTimeFormat(this.getIntlLocale(), options).format(dateObj);
  }

  formatTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: this.timeZone
    };

    return new Intl.DateTimeFormat(this.getIntlLocale(), options).format(dateObj);
  }

  formatDuration(minutes: number): string {
    if (this.locale === 'ja') {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      if (hours > 0) {
        return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
      }
      return `${mins}分`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      if (hours > 0) {
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      }
      return `${mins}m`;
    }
  }

  formatRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (this.locale === 'ja') {
      if (diffInSeconds < 60) return `${diffInSeconds}秒前`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`;
      return `${Math.floor(diffInSeconds / 86400)}日前`;
    } else {
      if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  }

  private getIntlLocale(): string {
    return this.locale === 'ja' ? 'ja-JP' : 'en-US';
  }
}

// Number formatting utilities
export class NumberFormatter {
  private locale: SupportedLocale;

  constructor(locale: SupportedLocale) {
    this.locale = locale;
  }

  formatScore(score: number): string {
    return new Intl.NumberFormat(this.getIntlLocale(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(score);
  }

  formatPercentage(value: number): string {
    return new Intl.NumberFormat(this.getIntlLocale(), {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  }

  formatInteger(value: number): string {
    return new Intl.NumberFormat(this.getIntlLocale()).format(value);
  }

  private getIntlLocale(): string {
    return this.locale === 'ja' ? 'ja-JP' : 'en-US';
  }
}

// Validation messages for Joi schemas
export const VALIDATION_MESSAGES = {
  'string.empty': {
    en: '{#label} is required',
    ja: '{#label}は必須です'
  },
  'string.min': {
    en: '{#label} must be at least {#limit} characters long',
    ja: '{#label}は{#limit}文字以上である必要があります'
  },
  'string.max': {
    en: '{#label} must be at most {#limit} characters long',
    ja: '{#label}は{#limit}文字以下である必要があります'
  },
  'number.base': {
    en: '{#label} must be a number',
    ja: '{#label}は数値である必要があります'
  },
  'number.integer': {
    en: '{#label} must be an integer',
    ja: '{#label}は整数である必要があります'
  },
  'number.positive': {
    en: '{#label} must be positive',
    ja: '{#label}は正の数である必要があります'
  },
  'number.min': {
    en: '{#label} must be at least {#limit}',
    ja: '{#label}は{#limit}以上である必要があります'
  },
  'number.max': {
    en: '{#label} must be at most {#limit}',
    ja: '{#label}は{#limit}以下である必要があります'
  },
  'date.base': {
    en: '{#label} must be a valid date',
    ja: '{#label}は有効な日付である必要があります'
  },
  'date.format': {
    en: '{#label} must be in ISO format',
    ja: '{#label}はISO形式である必要があります'
  },
  'date.greater': {
    en: '{#label} must be after {#limit}',
    ja: '{#label}は{#limit}より後である必要があります'
  },
  'boolean.base': {
    en: '{#label} must be a boolean',
    ja: '{#label}は真偽値である必要があります'
  },
  'any.required': {
    en: '{#label} is required',
    ja: '{#label}は必須です'
  },
  'array.base': {
    en: '{#label} must be an array',
    ja: '{#label}は配列である必要があります'
  },
  'object.min': {
    en: 'At least one field must be provided for update',
    ja: '更新のために少なくとも1つのフィールドが必要です'
  }
} as const;
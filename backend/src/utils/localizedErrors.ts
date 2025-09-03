import { 
  NotFoundError, 
  ValidationError, 
  AuthorizationError 
} from './errors';
import { 
  SupportedLocale, 
  LocalizedMessage, 
  getLocalizedMessage,
  TEST_ERROR_MESSAGES 
} from './i18n';

export class LocalizedNotFoundError extends NotFoundError {
  constructor(
    message: LocalizedMessage, 
    locale: SupportedLocale,
    params?: Record<string, string | number>
  ) {
    super(getLocalizedMessage(message, locale, params));
  }
}

export class LocalizedValidationError extends ValidationError {
  constructor(
    message: LocalizedMessage, 
    locale: SupportedLocale,
    params?: Record<string, string | number>
  ) {
    super(getLocalizedMessage(message, locale, params));
  }
}

export class LocalizedForbiddenError extends AuthorizationError {
  constructor(
    message: LocalizedMessage, 
    locale: SupportedLocale,
    params?: Record<string, string | number>
  ) {
    super(getLocalizedMessage(message, locale, params));
  }
}

// Factory functions for common test-related errors
export class TestErrorFactory {
  constructor(private locale: SupportedLocale) {}

  testNotFound(): LocalizedNotFoundError {
    return new LocalizedNotFoundError(
      TEST_ERROR_MESSAGES.TEST_NOT_FOUND, 
      this.locale
    );
  }

  courseNotFound(): LocalizedNotFoundError {
    return new LocalizedNotFoundError(
      TEST_ERROR_MESSAGES.COURSE_NOT_FOUND, 
      this.locale
    );
  }

  lessonNotFound(): LocalizedNotFoundError {
    return new LocalizedNotFoundError(
      TEST_ERROR_MESSAGES.LESSON_NOT_FOUND, 
      this.locale
    );
  }

  questionNotFound(): LocalizedNotFoundError {
    return new LocalizedNotFoundError(
      TEST_ERROR_MESSAGES.QUESTION_NOT_FOUND, 
      this.locale
    );
  }

  testNotPublished(): LocalizedValidationError {
    return new LocalizedValidationError(
      TEST_ERROR_MESSAGES.TEST_NOT_PUBLISHED, 
      this.locale
    );
  }

  testNotAvailableYet(): LocalizedValidationError {
    return new LocalizedValidationError(
      TEST_ERROR_MESSAGES.TEST_NOT_AVAILABLE_YET, 
      this.locale
    );
  }

  testNoLongerAvailable(): LocalizedValidationError {
    return new LocalizedValidationError(
      TEST_ERROR_MESSAGES.TEST_NO_LONGER_AVAILABLE, 
      this.locale
    );
  }

  maxAttemptsExceeded(maxAttempts: number): LocalizedValidationError {
    return new LocalizedValidationError(
      TEST_ERROR_MESSAGES.MAX_ATTEMPTS_EXCEEDED, 
      this.locale,
      { maxAttempts: maxAttempts.toString() }
    );
  }

  testInProgress(): LocalizedValidationError {
    return new LocalizedValidationError(
      TEST_ERROR_MESSAGES.TEST_IN_PROGRESS, 
      this.locale
    );
  }

  testNotInProgress(): LocalizedValidationError {
    return new LocalizedValidationError(
      TEST_ERROR_MESSAGES.TEST_NOT_IN_PROGRESS, 
      this.locale
    );
  }

  questionAlreadyInTest(): LocalizedValidationError {
    return new LocalizedValidationError(
      TEST_ERROR_MESSAGES.QUESTION_ALREADY_IN_TEST, 
      this.locale
    );
  }

  questionNotInTest(): LocalizedNotFoundError {
    return new LocalizedNotFoundError(
      TEST_ERROR_MESSAGES.QUESTION_NOT_IN_TEST, 
      this.locale
    );
  }

  cannotDeleteTestWithResults(): LocalizedValidationError {
    return new LocalizedValidationError(
      TEST_ERROR_MESSAGES.CANNOT_DELETE_TEST_WITH_RESULTS, 
      this.locale
    );
  }

  invalidDateRange(): LocalizedValidationError {
    return new LocalizedValidationError(
      TEST_ERROR_MESSAGES.INVALID_DATE_RANGE, 
      this.locale
    );
  }

  unauthorizedAccess(action: string): LocalizedForbiddenError {
    const actionTranslations = {
      en: {
        update: 'update',
        delete: 'delete',
        modify: 'modify',
        view: 'view'
      },
      ja: {
        update: '更新',
        delete: '削除',
        modify: '変更',
        view: '表示'
      }
    };

    return new LocalizedForbiddenError(
      TEST_ERROR_MESSAGES.UNAUTHORIZED_ACCESS, 
      this.locale,
      { action: actionTranslations[this.locale][action as keyof typeof actionTranslations.en] || action }
    );
  }

  insufficientPermissions(): LocalizedForbiddenError {
    return new LocalizedForbiddenError(
      TEST_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS, 
      this.locale
    );
  }
}
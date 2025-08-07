/**
 * Custom error classes for the LMS application
 */

export enum ErrorCode {
  // Authentication & Authorization
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Business Logic
  ENROLLMENT_FAILED = 'ENROLLMENT_FAILED',
  COURSE_NOT_AVAILABLE = 'COURSE_NOT_AVAILABLE',
  LESSON_NOT_ACCESSIBLE = 'LESSON_NOT_ACCESSIBLE',
  TEST_SUBMISSION_FAILED = 'TEST_SUBMISSION_FAILED',
  
  // Question Management
  INVALID_QUESTION_TYPE = 'INVALID_QUESTION_TYPE',
  INSUFFICIENT_OPTIONS = 'INSUFFICIENT_OPTIONS',
  NO_CORRECT_OPTION = 'NO_CORRECT_OPTION',
  QUESTION_ALREADY_PUBLISHED = 'QUESTION_ALREADY_PUBLISHED',
  
  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    errorCode: ErrorCode,
    isOperational = true,
    details?: Record<string, unknown>
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    if (details !== undefined) {
      this.details = details;
    }

    Error.captureStackTrace(this);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', errorCode: ErrorCode = ErrorCode.INVALID_CREDENTIALS) {
    super(message, 401, errorCode);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, ErrorCode.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, ErrorCode.RESOURCE_NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, ErrorCode.RESOURCE_CONFLICT, true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: Record<string, unknown>) {
    super(message, 500, ErrorCode.DATABASE_ERROR, false, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `External service ${service} is unavailable`,
      503,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      true
    );
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED);
  }
}

/**
 * Helper functions to create common errors
 */
export const createNotFoundError = (resource: string) => new NotFoundError(resource);

export const createValidationError = (message: string, details?: Record<string, unknown>) =>
  new ValidationError(message, details);

export const createAuthenticationError = (message?: string, errorCode?: ErrorCode) =>
  new AuthenticationError(message, errorCode);

export const createAuthorizationError = (message?: string) => new AuthorizationError(message);

export const createConflictError = (message: string, details?: Record<string, unknown>) =>
  new ConflictError(message, details);

export const createDatabaseError = (message?: string, details?: Record<string, unknown>) =>
  new DatabaseError(message, details);

/**
 * Question-specific error classes
 */
export class QuestionValidationError extends AppError {
  constructor(message: string, errorCode: ErrorCode, details?: Record<string, unknown>) {
    super(message, 400, errorCode, true, details);
  }
}

export const createQuestionValidationError = {
  insufficientOptions: () => new QuestionValidationError(
    'Multiple choice questions must have at least 2 options',
    ErrorCode.INSUFFICIENT_OPTIONS
  ),
  noCorrectOption: () => new QuestionValidationError(
    'Multiple choice questions must have at least one correct option',
    ErrorCode.NO_CORRECT_OPTION
  ),
  invalidQuestionType: (type: string) => new QuestionValidationError(
    `Invalid question type: ${type}`,
    ErrorCode.INVALID_QUESTION_TYPE
  ),
  alreadyPublished: () => new QuestionValidationError(
    'Cannot modify a published question',
    ErrorCode.QUESTION_ALREADY_PUBLISHED
  )
};
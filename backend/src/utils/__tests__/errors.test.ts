import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  ErrorCode,
  createNotFoundError,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createConflictError,
  createDatabaseError,
} from '../errors';

describe('AppError', () => {
  it('should create an error with all properties', () => {
    const error = new AppError(
      'Test error',
      400,
      ErrorCode.VALIDATION_ERROR,
      true,
      { field: 'test' }
    );

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.isOperational).toBe(true);
    expect(error.details).toEqual({ field: 'test' });
    expect(error.name).toBe('AppError');
    expect(error.stack).toBeDefined();
  });

  it('should set isOperational to true by default', () => {
    const error = new AppError('Test error', 400, ErrorCode.VALIDATION_ERROR);
    expect(error.isOperational).toBe(true);
  });
});

describe('ValidationError', () => {
  it('should create a validation error with correct properties', () => {
    const details = { email: ['Invalid email format'] };
    const error = new ValidationError('Validation failed', details);

    expect(error.message).toBe('Validation failed');
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.isOperational).toBe(true);
    expect(error.details).toEqual(details);
  });

  it('should create a validation error without details', () => {
    const error = new ValidationError('Validation failed');

    expect(error.message).toBe('Validation failed');
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.details).toBeUndefined();
  });
});

describe('AuthenticationError', () => {
  it('should create an authentication error with default message', () => {
    const error = new AuthenticationError();

    expect(error.message).toBe('Authentication failed');
    expect(error.statusCode).toBe(401);
    expect(error.errorCode).toBe(ErrorCode.INVALID_CREDENTIALS);
  });

  it('should create an authentication error with custom message and error code', () => {
    const error = new AuthenticationError('Token expired', ErrorCode.TOKEN_EXPIRED);

    expect(error.message).toBe('Token expired');
    expect(error.statusCode).toBe(401);
    expect(error.errorCode).toBe(ErrorCode.TOKEN_EXPIRED);
  });
});

describe('AuthorizationError', () => {
  it('should create an authorization error with default message', () => {
    const error = new AuthorizationError();

    expect(error.message).toBe('Access denied');
    expect(error.statusCode).toBe(403);
    expect(error.errorCode).toBe(ErrorCode.FORBIDDEN);
  });

  it('should create an authorization error with custom message', () => {
    const error = new AuthorizationError('Admin access required');

    expect(error.message).toBe('Admin access required');
    expect(error.statusCode).toBe(403);
    expect(error.errorCode).toBe(ErrorCode.FORBIDDEN);
  });
});

describe('NotFoundError', () => {
  it('should create a not found error with default resource', () => {
    const error = new NotFoundError();

    expect(error.message).toBe('Resource not found');
    expect(error.statusCode).toBe(404);
    expect(error.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
  });

  it('should create a not found error with custom resource', () => {
    const error = new NotFoundError('Course');

    expect(error.message).toBe('Course not found');
    expect(error.statusCode).toBe(404);
    expect(error.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
  });
});

describe('ConflictError', () => {
  it('should create a conflict error', () => {
    const details = { field: 'email' };
    const error = new ConflictError('Email already exists', details);

    expect(error.message).toBe('Email already exists');
    expect(error.statusCode).toBe(409);
    expect(error.errorCode).toBe(ErrorCode.RESOURCE_CONFLICT);
    expect(error.details).toEqual(details);
  });
});

describe('DatabaseError', () => {
  it('should create a database error with default message', () => {
    const error = new DatabaseError();

    expect(error.message).toBe('Database operation failed');
    expect(error.statusCode).toBe(500);
    expect(error.errorCode).toBe(ErrorCode.DATABASE_ERROR);
    expect(error.isOperational).toBe(false);
  });

  it('should create a database error with custom message and details', () => {
    const details = { code: 'P2002' };
    const error = new DatabaseError('Unique constraint violation', details);

    expect(error.message).toBe('Unique constraint violation');
    expect(error.statusCode).toBe(500);
    expect(error.errorCode).toBe(ErrorCode.DATABASE_ERROR);
    expect(error.details).toEqual(details);
    expect(error.isOperational).toBe(false);
  });
});

describe('ExternalServiceError', () => {
  it('should create an external service error with default message', () => {
    const error = new ExternalServiceError('PaymentService');

    expect(error.message).toBe('External service PaymentService is unavailable');
    expect(error.statusCode).toBe(503);
    expect(error.errorCode).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
  });

  it('should create an external service error with custom message', () => {
    const error = new ExternalServiceError('PaymentService', 'Payment failed');

    expect(error.message).toBe('Payment failed');
    expect(error.statusCode).toBe(503);
    expect(error.errorCode).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
  });
});

describe('RateLimitError', () => {
  it('should create a rate limit error with default message', () => {
    const error = new RateLimitError();

    expect(error.message).toBe('Rate limit exceeded');
    expect(error.statusCode).toBe(429);
    expect(error.errorCode).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
  });

  it('should create a rate limit error with custom message', () => {
    const error = new RateLimitError('Too many requests');

    expect(error.message).toBe('Too many requests');
    expect(error.statusCode).toBe(429);
    expect(error.errorCode).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
  });
});

describe('Helper functions', () => {
  it('should create a not found error using helper', () => {
    const error = createNotFoundError('User');

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe('User not found');
  });

  it('should create a validation error using helper', () => {
    const details = { email: ['Required'] };
    const error = createValidationError('Validation failed', details);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Validation failed');
    expect(error.details).toEqual(details);
  });

  it('should create an authentication error using helper', () => {
    const error = createAuthenticationError('Invalid token', ErrorCode.TOKEN_INVALID);

    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.message).toBe('Invalid token');
    expect(error.errorCode).toBe(ErrorCode.TOKEN_INVALID);
  });

  it('should create an authorization error using helper', () => {
    const error = createAuthorizationError('Admin required');

    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error.message).toBe('Admin required');
  });

  it('should create a conflict error using helper', () => {
    const details = { field: 'username' };
    const error = createConflictError('Username taken', details);

    expect(error).toBeInstanceOf(ConflictError);
    expect(error.message).toBe('Username taken');
    expect(error.details).toEqual(details);
  });

  it('should create a database error using helper', () => {
    const details = { code: 'P2025' };
    const error = createDatabaseError('Record not found', details);

    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.message).toBe('Record not found');
    expect(error.details).toEqual(details);
  });
});
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiResponse, ErrorWithStatus } from '../types';
import { AppError, ErrorCode, DatabaseError } from '../utils/errors';

export const errorHandler = (
  err: ErrorWithStatus | AppError,
  req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction,
): void => {
  let error = err;

  // Convert known errors to AppError instances
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = new DatabaseError('Database validation error');
  } else if (!(err instanceof AppError)) {
    // Convert generic errors to AppError
    const status = (err as ErrorWithStatus).status || (err as ErrorWithStatus).statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const errorCode = status === 500 ? ErrorCode.INTERNAL_SERVER_ERROR : ErrorCode.VALIDATION_ERROR;
    
    error = new AppError(message, status, errorCode, status < 500);
  }

  const appError = error as AppError;
  const status = appError.statusCode || 500;

  // Enhanced error logging
  const errorInfo = {
    timestamp: new Date().toISOString(),
    errorCode: appError.errorCode || 'UNKNOWN_ERROR',
    message: appError.message,
    status,
    stack: appError.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query,
    details: appError.details,
  };

  // Log error with appropriate level
  if (status >= 500) {
    console.error('Server Error:', errorInfo);
  } else if (status >= 400) {
    console.warn('Client Error:', errorInfo);
  }

  // Prepare error response
  const errorResponse: ApiResponse = {
    success: false,
    error: appError.message,
    ...(appError.errorCode && { errorCode: appError.errorCode }),
    ...(appError.details && { details: appError.details }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: appError.stack,
      requestInfo: {
        url: req.url,
        method: req.method,
        timestamp: errorInfo.timestamp,
      }
    }),
  };

  res.status(status).json(errorResponse);
};

/**
 * Handle Prisma-specific errors and convert them to AppError instances
 */
function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): AppError {
  switch (err.code) {
    case 'P2002': {
      // Unique constraint violation
      const target = err.meta?.target as string[] | undefined;
      const field = target?.[0] || 'field';
      return new AppError(
        `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
        409,
        ErrorCode.RESOURCE_ALREADY_EXISTS,
        true,
        { field, constraint: 'unique' }
      );
    }
    
    case 'P2025':
      // Record not found
      return new AppError(
        'Record not found',
        404,
        ErrorCode.RESOURCE_NOT_FOUND
      );
    
    case 'P2003':
      // Foreign key constraint violation
      return new AppError(
        'Referenced record does not exist',
        400,
        ErrorCode.VALIDATION_ERROR,
        true,
        { constraint: 'foreign_key' }
      );
    
    case 'P2011': {
      // Null constraint violation
      const field2 = err.meta?.target as string | undefined;
      return new AppError(
        `Field ${field2} is required`,
        400,
        ErrorCode.MISSING_REQUIRED_FIELD,
        true,
        { field: field2 }
      );
    }
    
    default:
      return new DatabaseError(`Database error: ${err.message}`, { code: err.code });
  }
}

export const notFoundHandler = (
  req: Request,
  res: Response<ApiResponse>,
): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};

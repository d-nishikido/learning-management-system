import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ErrorWithStatus } from '../types';

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction,
): void => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error for debugging
  console.error(`Error ${status}: ${message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send error response
  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response<ApiResponse>,
): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};

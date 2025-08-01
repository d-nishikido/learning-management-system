import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../types';

export const validateRequest = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages: Record<string, string[]> = {};
    
    errors.array().forEach((error) => {
      if (error.type === 'field') {
        const field = error.path;
        if (!errorMessages[field]) {
          errorMessages[field] = [];
        }
        errorMessages[field].push(error.msg);
      }
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errorMessages,
    });
    return;
  }
  
  next();
};
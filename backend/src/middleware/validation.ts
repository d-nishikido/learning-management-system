import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';
import { ApiResponse } from '../types';

/**
 * Generic validation middleware that validates request body, query, or params
 */
export const validate = (schema: Joi.Schema, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response<ApiResponse>, next: NextFunction): void => {
    const data = req[target];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errorDetails: Record<string, string[]> = {};
      
      error.details.forEach((detail) => {
        const field = detail.path.join('.');
        if (!errorDetails[field]) {
          errorDetails[field] = [];
        }
        errorDetails[field].push(detail.message);
      });

      const validationError = new ValidationError('Validation failed', errorDetails);
      return next(validationError);
    }

    // Replace the original data with the validated and sanitized version
    req[target] = value;
    next();
  };
};

/**
 * Middleware to validate request body
 */
export const validateBody = (schema: Joi.Schema) => validate(schema, 'body');

/**
 * Middleware to validate query parameters
 */
export const validateQuery = (schema: Joi.Schema) => validate(schema, 'query');

/**
 * Middleware to validate route parameters
 */
export const validateParams = (schema: Joi.Schema) => validate(schema, 'params');

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID must be a number',
    'number.integer': 'ID must be an integer',
    'number.positive': 'ID must be positive',
    'any.required': 'ID is required',
  }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),

  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .trim()
    .required()
    .messages({
      'string.alphanum': 'Username must only contain alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required',
    }),

  name: Joi.string()
    .min(1)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.min': 'Name cannot be empty',
      'string.max': 'Name must not exceed 50 characters',
      'any.required': 'Name is required',
    }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().trim(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
  }),
};

/**
 * Authentication validation schemas
 */
export const authSchemas = {
  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required',
    }),
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email,
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required',
    }),
    password: commonSchemas.password,
  }),
};

/**
 * Course validation schemas
 */
export const courseSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).trim().required(),
    description: Joi.string().max(1000).trim().optional(),
    category: Joi.string().max(100).trim().required(),
    level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').required(),
    duration: Joi.number().integer().min(1).optional(),
    isPublished: Joi.boolean().default(false),
    prerequisites: Joi.array().items(Joi.number().integer().positive()).optional(),
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(200).trim().optional(),
    description: Joi.string().max(1000).trim().optional(),
    category: Joi.string().max(100).trim().optional(),
    level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').optional(),
    duration: Joi.number().integer().min(1).optional(),
    isPublished: Joi.boolean().optional(),
    prerequisites: Joi.array().items(Joi.number().integer().positive()).optional(),
  }),

  query: Joi.object({
    category: Joi.string().trim(),
    level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
    isPublished: Joi.boolean(),
    search: Joi.string().trim(),
  }).concat(commonSchemas.pagination),
};

/**
 * User validation schemas
 */
export const userSchemas = {
  create: Joi.object({
    username: commonSchemas.username,
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: commonSchemas.name,
    lastName: commonSchemas.name,
    role: Joi.string().valid('USER', 'ADMIN').default('USER'),
  }),

  update: Joi.object({
    username: commonSchemas.username.optional(),
    email: commonSchemas.email.optional(),
    firstName: commonSchemas.name.optional(),
    lastName: commonSchemas.name.optional(),
    bio: Joi.string().max(500).trim().optional(),
    profileImageUrl: Joi.string().uri().max(500).optional(),
    isActive: Joi.boolean().optional(),
    role: Joi.string().valid('USER', 'ADMIN').optional(),
  }),

  query: Joi.object({
    role: Joi.string().valid('USER', 'ADMIN'),
    isActive: Joi.boolean(),
    search: Joi.string().trim(),
  }).concat(commonSchemas.pagination),
};

/**
 * Lesson validation schemas
 */
export const lessonSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).trim().required(),
    description: Joi.string().max(1000).trim().allow('').optional(),
    content: Joi.string().allow('').optional(),
    estimatedMinutes: Joi.number().integer().min(1).optional(),
    sortOrder: Joi.number().integer().min(1).optional(),
    isPublished: Joi.boolean().default(false),
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(200).trim().optional(),
    description: Joi.string().max(1000).trim().allow('').optional(),
    content: Joi.string().allow('').optional(),
    estimatedMinutes: Joi.number().integer().min(1).optional(),
    sortOrder: Joi.number().integer().min(1).optional(),
    isPublished: Joi.boolean().optional(),
  }),

  query: Joi.object({
    isPublished: Joi.boolean(),
    search: Joi.string().trim(),
  }).concat(commonSchemas.pagination),

  updateOrder: Joi.object({
    sortOrder: Joi.number().integer().min(1).required(),
  }),
};

/**
 * Learning Material validation schemas
 */
export const learningMaterialSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).trim().required(),
    description: Joi.string().max(1000).trim().optional(),
    materialType: Joi.string().valid('FILE', 'URL', 'MANUAL_PROGRESS').required(),
    materialCategory: Joi.string().valid('MAIN', 'SUPPLEMENTARY').default('MAIN'),
    externalUrl: Joi.when('materialType', {
      is: 'URL',
      then: Joi.string().uri().max(1000).required(),
      otherwise: Joi.forbidden()
    }),
    durationMinutes: Joi.number().integer().min(1).optional(),
    allowManualProgress: Joi.when('materialType', {
      is: 'MANUAL_PROGRESS',
      then: Joi.boolean().valid(true).required(),
      otherwise: Joi.boolean().default(false)
    }),
    sortOrder: Joi.number().integer().min(1).optional(),
    isPublished: Joi.boolean().default(false),
    // File fields are populated by upload middleware
    filePath: Joi.string().when('materialType', {
      is: 'FILE',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    fileSize: Joi.number().integer().min(1).when('materialType', {
      is: 'FILE',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    fileType: Joi.string().when('materialType', {
      is: 'FILE',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(200).trim().optional(),
    description: Joi.string().max(1000).trim().optional(),
    externalUrl: Joi.string().uri().max(1000).optional(),
    durationMinutes: Joi.number().integer().min(1).optional(),
    allowManualProgress: Joi.boolean().optional(),
    sortOrder: Joi.number().integer().min(1).optional(),
    isPublished: Joi.boolean().optional(),
  }),

  query: Joi.object({
    materialType: Joi.string().valid('FILE', 'URL', 'MANUAL_PROGRESS'),
    materialCategory: Joi.string().valid('MAIN', 'SUPPLEMENTARY'),
    isPublished: Joi.boolean(),
    search: Joi.string().trim(),
  }).concat(commonSchemas.pagination),

  updateOrder: Joi.object({
    sortOrder: Joi.number().integer().min(1).required(),
  }),

  fileUpload: Joi.object({
    title: Joi.string().min(1).max(200).trim().required(),
    description: Joi.string().max(1000).trim().optional(),
    materialCategory: Joi.string().valid('MAIN', 'SUPPLEMENTARY').default('MAIN'),
    durationMinutes: Joi.number().integer().min(1).optional(),
    allowManualProgress: Joi.boolean().default(false),
    sortOrder: Joi.number().integer().min(1).optional(),
    isPublished: Joi.boolean().default(false),
  }),
};

/**
 * Q&A validation schemas
 */
export const qaSchemas = {
  createQuestion: Joi.object({
    title: Joi.string().min(5).max(200).trim().required(),
    content: Joi.string().min(10).max(5000).trim().required(),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional(),
    courseId: Joi.number().integer().positive().optional(),
    lessonId: Joi.number().integer().positive().optional(),
    isPublic: Joi.boolean().default(true),
  }),

  createAnswer: Joi.object({
    content: Joi.string().min(10).max(5000).trim().required(),
  }),

  query: Joi.object({
    courseId: Joi.number().integer().positive(),
    lessonId: Joi.number().integer().positive(),
    tags: Joi.alternatives().try(
      Joi.string().trim(),
      Joi.array().items(Joi.string().trim())
    ),
    isPublic: Joi.boolean(),
    search: Joi.string().trim(),
  }).concat(commonSchemas.pagination),
};
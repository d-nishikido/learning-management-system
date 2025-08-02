import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  commonSchemas,
  authSchemas,
  courseSchemas,
  userSchemas,
  qaSchemas,
} from '../validation';
import { ValidationError } from '../../utils/errors';
import { ApiResponse } from '../../types';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response<ApiResponse>>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('validate middleware', () => {
    const testSchema = Joi.object({
      name: Joi.string().required(),
      age: Joi.number().integer().min(0),
    });

    it('should pass validation with valid data', () => {
      mockRequest.body = { name: 'John', age: 25 };
      const middleware = validate(testSchema, 'body');

      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({ name: 'John', age: 25 });
    });

    it('should sanitize and convert data', () => {
      mockRequest.body = { name: 'John  ', age: '25', extra: 'field' };
      const middleware = validate(testSchema, 'body');

      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({ name: 'John  ', age: 25 });
      expect(mockRequest.body.extra).toBeUndefined();
    });

    it('should call next with ValidationError on invalid data', () => {
      mockRequest.body = { age: -1 };
      const middleware = validate(testSchema, 'body');

      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ValidationError;
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual({
        name: ['"name" is required'],
        age: ['"age" must be greater than or equal to 0'],
      });
    });

    it('should validate query parameters', () => {
      mockRequest.query = { name: 'John', age: '25' };
      const middleware = validate(testSchema, 'query');

      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({ name: 'John', age: 25 });
    });

    it('should validate route parameters', () => {
      mockRequest.params = { name: 'John', age: '25' };
      const middleware = validate(testSchema, 'params');

      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.params).toEqual({ name: 'John', age: 25 });
    });
  });

  describe('validateBody', () => {
    it('should validate request body', () => {
      const schema = Joi.object({ name: Joi.string().required() });
      mockRequest.body = { name: 'John' };
      const middleware = validateBody(schema);

      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('validateQuery', () => {
    it('should validate query parameters', () => {
      const schema = Joi.object({ page: Joi.number().integer().min(1) });
      mockRequest.query = { page: '2' };
      const middleware = validateQuery(schema);

      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({ page: 2 });
    });
  });

  describe('validateParams', () => {
    it('should validate route parameters', () => {
      const schema = Joi.object({ id: Joi.number().integer().positive() });
      mockRequest.params = { id: '123' };
      const middleware = validateParams(schema);

      middleware(mockRequest as Request, mockResponse as Response<ApiResponse>, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.params).toEqual({ id: 123 });
    });
  });
});

describe('Common Schemas', () => {
  describe('id schema', () => {
    it('should validate positive integer ID', () => {
      const { error, value } = commonSchemas.id.validate(123);
      expect(error).toBeUndefined();
      expect(value).toBe(123);
    });

    it('should reject negative ID', () => {
      const { error } = commonSchemas.id.validate(-1);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toBe('ID must be positive');
    });

    it('should reject non-integer ID', () => {
      const { error } = commonSchemas.id.validate(12.5);
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toBe('ID must be an integer');
    });
  });

  describe('email schema', () => {
    it('should validate and normalize email', () => {
      const { error, value } = commonSchemas.email.validate('  TEST@EXAMPLE.COM  ');
      expect(error).toBeUndefined();
      expect(value).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      const { error } = commonSchemas.email.validate('invalid-email');
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toBe('Please provide a valid email address');
    });
  });

  describe('password schema', () => {
    it('should validate strong password', () => {
      const { error, value } = commonSchemas.password.validate('StrongPass123!');
      expect(error).toBeUndefined();
      expect(value).toBe('StrongPass123!');
    });

    it('should reject weak password', () => {
      const { error } = commonSchemas.password.validate('weak');
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toBe('Password must be at least 8 characters long');
    });

    it('should reject password without special characters', () => {
      const { error } = commonSchemas.password.validate('Password123');
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toContain('special character');
    });
  });

  describe('username schema', () => {
    it('should validate alphanumeric username', () => {
      const { error, value } = commonSchemas.username.validate('  user123  ');
      expect(error).toBeUndefined();
      expect(value).toBe('user123');
    });

    it('should reject username with special characters', () => {
      const { error } = commonSchemas.username.validate('user@123');
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toBe('Username must only contain alphanumeric characters');
    });

    it('should reject short username', () => {
      const { error } = commonSchemas.username.validate('ab');
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toBe('Username must be at least 3 characters long');
    });
  });

  describe('pagination schema', () => {
    it('should validate pagination with defaults', () => {
      const { error, value } = commonSchemas.pagination.validate({});
      expect(error).toBeUndefined();
      expect(value).toEqual({
        page: 1,
        limit: 10,
        sortOrder: 'asc',
      });
    });

    it('should validate custom pagination', () => {
      const input = { page: 2, limit: 20, sortBy: 'name', sortOrder: 'desc' };
      const { error, value } = commonSchemas.pagination.validate(input);
      expect(error).toBeUndefined();
      expect(value).toEqual(input);
    });

    it('should reject invalid pagination values', () => {
      const { error } = commonSchemas.pagination.validate({ page: 0, limit: 101 });
      expect(error).toBeDefined();
    });
  });
});

describe('Auth Schemas', () => {
  describe('login schema', () => {
    it('should validate login credentials', () => {
      const input = { email: 'test@example.com', password: 'password123' };
      const { error, value } = authSchemas.login.validate(input);
      expect(error).toBeUndefined();
      expect(value.email).toBe('test@example.com');
    });

    it('should reject login without email', () => {
      const { error } = authSchemas.login.validate({ password: 'password123' });
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toBe('Email is required');
    });

    it('should reject login without password', () => {
      const { error } = authSchemas.login.validate({ email: 'test@example.com' });
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toBe('Password is required');
    });
  });

  describe('refresh schema', () => {
    it('should validate refresh token', () => {
      const input = { refreshToken: 'valid-token' };
      const { error, value } = authSchemas.refresh.validate(input);
      expect(error).toBeUndefined();
      expect(value).toEqual(input);
    });

    it('should reject without refresh token', () => {
      const { error } = authSchemas.refresh.validate({});
      expect(error).toBeDefined();
      expect(error?.details?.[0]?.message).toBe('Refresh token is required');
    });
  });
});

describe('Course Schemas', () => {
  describe('create schema', () => {
    it('should validate course creation data', () => {
      const input = {
        title: 'JavaScript Basics',
        description: 'Learn JavaScript fundamentals',
        category: 'Programming',
        level: 'BEGINNER',
        duration: 40,
        isPublished: true,
        prerequisites: [1, 2],
      };
      const { error, value } = courseSchemas.create.validate(input);
      expect(error).toBeUndefined();
      expect(value).toEqual(input);
    });

    it('should validate minimal course data', () => {
      const input = {
        title: 'Course Title',
        category: 'Category',
        level: 'INTERMEDIATE',
      };
      const { error, value } = courseSchemas.create.validate(input);
      expect(error).toBeUndefined();
      expect(value.isPublished).toBe(false);
    });

    it('should reject invalid level', () => {
      const input = {
        title: 'Course Title',
        category: 'Category',
        level: 'INVALID',
      };
      const { error } = courseSchemas.create.validate(input);
      expect(error).toBeDefined();
    });
  });

  describe('query schema', () => {
    it('should validate course query parameters', () => {
      const input = {
        category: 'Programming',
        level: 'BEGINNER',
        isPublished: true,
        search: 'javascript',
        page: 1,
        limit: 10,
      };
      const { error, value } = courseSchemas.query.validate(input);
      expect(error).toBeUndefined();
      expect(value).toEqual({
        ...input,
        sortOrder: 'asc',
      });
    });
  });
});

describe('User Schemas', () => {
  describe('create schema', () => {
    it('should validate user creation data', () => {
      const input = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
      };
      const { error, value } = userSchemas.create.validate(input);
      expect(error).toBeUndefined();
      expect(value).toEqual(input);
    });

    it('should set default role to USER', () => {
      const input = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };
      const { error, value } = userSchemas.create.validate(input);
      expect(error).toBeUndefined();
      expect(value.role).toBe('USER');
    });
  });
});

describe('QA Schemas', () => {
  describe('createQuestion schema', () => {
    it('should validate question creation data', () => {
      const input = {
        title: 'How to use async/await in JavaScript?',
        content: 'I am having trouble understanding async/await syntax.',
        tags: ['javascript', 'async'],
        courseId: 1,
        isPublic: true,
      };
      const { error, value } = qaSchemas.createQuestion.validate(input);
      expect(error).toBeUndefined();
      expect(value).toEqual(input);
    });

    it('should reject short title', () => {
      const input = {
        title: 'How?',
        content: 'I am having trouble understanding async/await syntax.',
      };
      const { error } = qaSchemas.createQuestion.validate(input);
      expect(error).toBeDefined();
    });

    it('should reject short content', () => {
      const input = {
        title: 'How to use async/await in JavaScript?',
        content: 'Help',
      };
      const { error } = qaSchemas.createQuestion.validate(input);
      expect(error).toBeDefined();
    });
  });

  describe('createAnswer schema', () => {
    it('should validate answer creation data', () => {
      const input = {
        content: 'You can use async/await by declaring an async function.',
      };
      const { error, value } = qaSchemas.createAnswer.validate(input);
      expect(error).toBeUndefined();
      expect(value).toEqual(input);
    });

    it('should reject short answer', () => {
      const input = { content: 'Yes' };
      const { error } = qaSchemas.createAnswer.validate(input);
      expect(error).toBeDefined();
    });
  });
});
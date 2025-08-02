import request from 'supertest';
import { Express } from 'express';
import { jwtTokens } from './fixtures';

export class ApiTestHelper {
  constructor(private app: Express) {}

  // Authentication helpers
  asAdmin() {
    return {
      get: (url: string) => request(this.app).get(url).set('Authorization', `Bearer ${jwtTokens.validAdmin}`),
      post: (url: string) => request(this.app).post(url).set('Authorization', `Bearer ${jwtTokens.validAdmin}`),
      put: (url: string) => request(this.app).put(url).set('Authorization', `Bearer ${jwtTokens.validAdmin}`),
      delete: (url: string) => request(this.app).delete(url).set('Authorization', `Bearer ${jwtTokens.validAdmin}`),
    };
  }

  asUser() {
    return {
      get: (url: string) => request(this.app).get(url).set('Authorization', `Bearer ${jwtTokens.validUser}`),
      post: (url: string) => request(this.app).post(url).set('Authorization', `Bearer ${jwtTokens.validUser}`),
      put: (url: string) => request(this.app).put(url).set('Authorization', `Bearer ${jwtTokens.validUser}`),
      delete: (url: string) => request(this.app).delete(url).set('Authorization', `Bearer ${jwtTokens.validUser}`),
    };
  }

  asGuest() {
    return {
      get: (url: string) => request(this.app).get(url),
      post: (url: string) => request(this.app).post(url),
      put: (url: string) => request(this.app).put(url),
      delete: (url: string) => request(this.app).delete(url),
    };
  }

  withExpiredToken() {
    return {
      get: (url: string) => request(this.app).get(url).set('Authorization', `Bearer ${jwtTokens.expired}`),
      post: (url: string) => request(this.app).post(url).set('Authorization', `Bearer ${jwtTokens.expired}`),
      put: (url: string) => request(this.app).put(url).set('Authorization', `Bearer ${jwtTokens.expired}`),
      delete: (url: string) => request(this.app).delete(url).set('Authorization', `Bearer ${jwtTokens.expired}`),
    };
  }

  withInvalidToken() {
    return {
      get: (url: string) => request(this.app).get(url).set('Authorization', `Bearer ${jwtTokens.invalid}`),
      post: (url: string) => request(this.app).post(url).set('Authorization', `Bearer ${jwtTokens.invalid}`),
      put: (url: string) => request(this.app).put(url).set('Authorization', `Bearer ${jwtTokens.invalid}`),
      delete: (url: string) => request(this.app).delete(url).set('Authorization', `Bearer ${jwtTokens.invalid}`),
    };
  }

  // Common assertion helpers
  expectSuccess(response: request.Response, expectedData?: any) {
    expect(response.body.success).toBe(true);
    if (expectedData) {
      expect(response.body.data).toEqual(expect.objectContaining(expectedData));
    }
    return response;
  }

  expectError(response: request.Response, errorCode: string, message?: string) {
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe(errorCode);
    if (message) {
      expect(response.body.message).toContain(message);
    }
    return response;
  }

  expectValidationError(response: request.Response, fields?: string[]) {
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('VALIDATION_ERROR');
    if (fields) {
      fields.forEach(field => {
        expect(response.body.details).toHaveProperty(field);
      });
    }
    return response;
  }

  expectUnauthorized(response: request.Response) {
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('UNAUTHORIZED');
    return response;
  }

  expectForbidden(response: request.Response) {
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('FORBIDDEN');
    return response;
  }

  expectNotFound(response: request.Response) {
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('NOT_FOUND');
    return response;
  }

  expectConflict(response: request.Response) {
    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('CONFLICT');
    return response;
  }

  // Pagination helpers
  expectPaginatedResponse(response: request.Response, expectedFields = ['items', 'total', 'page', 'limit']) {
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expectedFields.forEach(field => {
      expect(response.body.data).toHaveProperty(field);
    });
    expect(Array.isArray(response.body.data.items)).toBe(true);
    expect(typeof response.body.data.total).toBe('number');
    expect(typeof response.body.data.page).toBe('number');
    expect(typeof response.body.data.limit).toBe('number');
    return response;
  }

  // JWT token extraction helper
  extractTokenFromResponse(response: request.Response): string {
    expect(response.body.data).toHaveProperty('token');
    return response.body.data.token;
  }

  extractRefreshTokenFromResponse(response: request.Response): string {
    expect(response.body.data).toHaveProperty('refreshToken');
    return response.body.data.refreshToken;
  }
}

// Helper to create test app with mocked dependencies
export const createTestApp = (): Express => {
  // This will be implemented when we create the integration tests
  // For now, we'll export the type
  throw new Error('createTestApp not implemented yet');
};

// Database test helpers
export const testDbHelpers = {
  async clearDatabase() {
    // Implementation will depend on test database setup
    // For now, just a placeholder
  },

  async seedTestData() {
    // Implementation will depend on test database setup
    // For now, just a placeholder
  },

  async createTestUser(userData: any) {
    // Implementation will depend on test database setup
    // For now, just a placeholder
    return userData;
  },

  async createTestCourse(courseData: any) {
    // Implementation will depend on test database setup
    // For now, just a placeholder
    return courseData;
  },
};

// Mock helpers
export const mockHelpers = {
  createMockPrismaClient() {
    return {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      course: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userProgress: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userBadge: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      userSkill: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $disconnect: jest.fn(),
    };
  },

  createMockRequest(overrides = {}) {
    return {
      body: {},
      query: {},
      params: {},
      headers: {},
      user: undefined,
      ...overrides,
    } as any;
  },

  createMockResponse() {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    return res;
  },

  createMockNext() {
    return jest.fn();
  },
};
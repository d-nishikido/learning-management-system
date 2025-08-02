// Mock Prisma first
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Mock services
jest.mock('../../services/passwordService');
jest.mock('../../services/jwtService');

import request from 'supertest';
import express from 'express';
import { PasswordService } from '../../services/passwordService';
import { JwtService } from '../../services/jwtService';
import { validateBody } from '../../middleware/validation';
import { authSchemas } from '../../middleware/validation';
import { authenticateToken } from '../../middleware/auth';
import { AuthController } from '../../controllers/authController';
import { userFixtures, loginData, jwtTokens } from '../helpers/fixtures';

const mockPasswordService = PasswordService as jest.Mocked<typeof PasswordService>;
const mockJwtService = {
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  generateTokenPair: jest.fn(),
} as any;

// Apply the mocks
(JwtService as any).verifyAccessToken = mockJwtService.verifyAccessToken;
(JwtService as any).verifyRefreshToken = mockJwtService.verifyRefreshToken;
(JwtService as any).generateTokenPair = mockJwtService.generateTokenPair;

describe('Auth API Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Set up auth routes
    app.post('/api/v1/auth/login', validateBody(authSchemas.login), AuthController.login);
    app.post('/api/v1/auth/refresh', validateBody(authSchemas.refresh), AuthController.refresh);
    app.post('/api/v1/auth/logout', authenticateToken, AuthController.logout);
    app.post('/api/v1/auth/forgot-password', AuthController.forgotPassword);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginRequest = loginData.admin;
      const dbUser = {
        ...userFixtures.admin,
        passwordHash: '$2b$10$hashedPassword',
      };
      const tokenPair = {
        accessToken: jwtTokens.validAdmin,
        refreshToken: jwtTokens.refreshToken,
      };

      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockJwtService.generateTokenPair.mockReturnValue(tokenPair);
      mockPrisma.user.update.mockResolvedValue(dbUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            role: dbUser.role,
          },
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
        },
        message: 'Login successful',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginRequest.email },
        select: {
          id: true,
          username: true,
          email: true,
          passwordHash: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });

      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(
        loginRequest.password,
        dbUser.passwordHash
      );

      expect(mockJwtService.generateTokenPair).toHaveBeenCalledWith(
        dbUser.id,
        dbUser.username,
        dbUser.email,
        dbUser.role
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: dbUser.id },
        data: { lastLogin: expect.any(Date) },
      });
    });

    it('should reject login with invalid credentials', async () => {
      const loginRequest = loginData.invalid;
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginRequest)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid credentials',
      });

      expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
      expect(mockJwtService.generateTokenPair).not.toHaveBeenCalled();
    });

    it('should reject login with wrong password', async () => {
      const loginRequest = loginData.admin;
      const dbUser = {
        ...userFixtures.admin,
        passwordHash: '$2b$10$hashedPassword',
      };

      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPasswordService.verifyPassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginRequest)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid credentials',
      });

      expect(mockJwtService.generateTokenPair).not.toHaveBeenCalled();
    });

    it('should reject login for inactive user', async () => {
      const loginRequest = loginData.user1;
      const inactiveUser = {
        ...userFixtures.inactiveUser,
        passwordHash: '$2b$10$hashedPassword',
      };

      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginRequest)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid credentials',
      });

      expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
    });

    it('should validate login request body', async () => {
      const invalidRequest = loginData.malformed;

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details).toHaveProperty('email');
      expect(response.body.details).toHaveProperty('password');

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should require email and password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details).toHaveProperty('email');
      expect(response.body.details).toHaveProperty('password');
    });

    it('should handle internal server error', async () => {
      const loginRequest = loginData.admin;
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginRequest)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error',
      });

      expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const refreshRequest = { refreshToken: jwtTokens.refreshToken };
      const decodedToken = { userId: 1, tokenVersion: 1, type: 'refresh' as const };
      const newTokenPair = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockJwtService.verifyRefreshToken.mockReturnValue(decodedToken);
      mockPrisma.user.findUnique.mockResolvedValue(userFixtures.admin);
      mockJwtService.generateTokenPair.mockReturnValue(newTokenPair);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send(refreshRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          accessToken: newTokenPair.accessToken,
          refreshToken: newTokenPair.refreshToken,
        },
        message: 'Token refreshed successfully',
      });

      expect(mockJwtService.verifyRefreshToken).toHaveBeenCalledWith(refreshRequest.refreshToken);
      expect(mockJwtService.generateTokenPair).toHaveBeenCalledWith(
        userFixtures.admin.id,
        userFixtures.admin.username,
        userFixtures.admin.email,
        userFixtures.admin.role,
        decodedToken.tokenVersion
      );
    });

    it('should reject refresh with invalid token', async () => {
      const refreshRequest = { refreshToken: 'invalid-token' };
      mockJwtService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send(refreshRequest)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid refresh token',
      });

      consoleSpy.mockRestore();
    });

    it('should reject refresh for inactive user', async () => {
      const refreshRequest = { refreshToken: jwtTokens.refreshToken };
      const decodedToken = { userId: 4, tokenVersion: 1, type: 'refresh' as const };

      mockJwtService.verifyRefreshToken.mockReturnValue(decodedToken);
      mockPrisma.user.findUnique.mockResolvedValue(userFixtures.inactiveUser);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send(refreshRequest)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid refresh token',
      });
    });

    it('should validate refresh request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details).toHaveProperty('refreshToken');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout authenticated user', async () => {
      const payload = { userId: 1, role: 'USER' };
      
      mockJwtService.verifyAccessToken.mockResolvedValue(payload);
      mockPrisma.user.findUnique.mockResolvedValue(userFixtures.user1);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${jwtTokens.validUser}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Logout successful',
      });
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('should reject logout with invalid token', async () => {
      mockJwtService.verifyAccessToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${jwtTokens.invalid}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should process forgot password request', async () => {
      const forgotPasswordRequest = { email: 'user@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(userFixtures.user1);

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send(forgotPasswordRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: forgotPasswordRequest.email },
        select: { id: true, isActive: true },
      });
    });

    it('should handle non-existent email gracefully', async () => {
      const forgotPasswordRequest = { email: 'nonexistent@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send(forgotPasswordRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent',
      });
    });

    it('should require email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Email is required',
      });

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });
});
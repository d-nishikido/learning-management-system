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

import { Request, Response } from 'express';
import { AuthController } from '../../controllers/authController';
import { PasswordService } from '../../services/passwordService';
import { JwtService } from '../../services/jwtService';
import { mockHelpers } from '../helpers/apiHelpers';
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

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = mockHelpers.createMockRequest();
    mockResponse = mockHelpers.createMockResponse();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginRequest = loginData.admin;
      mockRequest.body = loginRequest;

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

      await AuthController.login(mockRequest as Request, mockResponse as Response);

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

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
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
    });

    it('should reject login without email', async () => {
      mockRequest.body = { password: 'password123' };

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email and password are required',
      });

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should reject login without password', async () => {
      mockRequest.body = { email: 'test@example.com' };

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email and password are required',
      });

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should reject login for non-existent user', async () => {
      mockRequest.body = loginData.invalid;
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials',
      });

      expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
    });

    it('should reject login for inactive user', async () => {
      mockRequest.body = loginData.user1;
      mockPrisma.user.findUnique.mockResolvedValue(userFixtures.inactiveUser);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials',
      });

      expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
    });

    it('should reject login with invalid password', async () => {
      mockRequest.body = loginData.admin;
      const dbUser = {
        ...userFixtures.admin,
        passwordHash: '$2b$10$hashedPassword',
      };

      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPasswordService.verifyPassword.mockResolvedValue(false);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials',
      });

      expect(mockJwtService.generateTokenPair).not.toHaveBeenCalled();
    });

    it('should handle internal server error', async () => {
      mockRequest.body = loginData.admin;
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });

      expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const refreshRequest = { refreshToken: jwtTokens.refreshToken };
      mockRequest.body = refreshRequest;

      const decodedToken = { userId: 1, tokenVersion: 1, type: 'refresh' as const };
      const newTokenPair = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockJwtService.verifyRefreshToken.mockReturnValue(decodedToken);
      mockPrisma.user.findUnique.mockResolvedValue(userFixtures.admin);
      mockJwtService.generateTokenPair.mockReturnValue(newTokenPair);

      await AuthController.refresh(mockRequest as Request, mockResponse as Response);

      expect(mockJwtService.verifyRefreshToken).toHaveBeenCalledWith(refreshRequest.refreshToken);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: decodedToken.userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      expect(mockJwtService.generateTokenPair).toHaveBeenCalledWith(
        userFixtures.admin.id,
        userFixtures.admin.username,
        userFixtures.admin.email,
        userFixtures.admin.role,
        decodedToken.tokenVersion
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: newTokenPair.accessToken,
          refreshToken: newTokenPair.refreshToken,
        },
        message: 'Token refreshed successfully',
      });
    });

    it('should reject refresh without refresh token', async () => {
      mockRequest.body = {};

      await AuthController.refresh(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Refresh token is required',
      });

      expect(mockJwtService.verifyRefreshToken).not.toHaveBeenCalled();
    });

    it('should reject refresh with invalid token', async () => {
      mockRequest.body = { refreshToken: 'invalid-token' };
      mockJwtService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await AuthController.refresh(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid refresh token',
      });

      consoleSpy.mockRestore();
    });

    it('should reject refresh with expired token', async () => {
      mockRequest.body = { refreshToken: 'expired-token' };
      mockJwtService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await AuthController.refresh(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Refresh token expired',
      });

      consoleSpy.mockRestore();
    });

    it('should reject refresh for inactive user', async () => {
      mockRequest.body = { refreshToken: jwtTokens.refreshToken };
      const decodedToken = { userId: 4, tokenVersion: 1, type: 'refresh' as const };

      mockJwtService.verifyRefreshToken.mockReturnValue(decodedToken);
      mockPrisma.user.findUnique.mockResolvedValue(userFixtures.inactiveUser);

      await AuthController.refresh(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid refresh token',
      });
    });
  });

  describe('logout', () => {
    it('should logout authenticated user', async () => {
      mockRequest.user = userFixtures.user1;

      await AuthController.logout(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });

    it('should reject logout without authentication', async () => {
      mockRequest.user = undefined;

      await AuthController.logout(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });

    it('should handle internal server error', async () => {
      mockRequest.user = userFixtures.user1;
      
      // Mock an error by making the response throw
      (mockResponse.json as jest.Mock).mockImplementation(() => {
        throw new Error('Response error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await AuthController.logout(mockRequest as any, mockResponse as Response);

      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('forgotPassword', () => {
    it('should process forgot password request with valid email', async () => {
      mockRequest.body = { email: 'user@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(userFixtures.user1);

      await AuthController.forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        select: { id: true, isActive: true },
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent',
      });
    });

    it('should process forgot password request with non-existent email', async () => {
      mockRequest.body = { email: 'nonexistent@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await AuthController.forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent',
      });
    });

    it('should reject forgot password request without email', async () => {
      mockRequest.body = {};

      await AuthController.forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email is required',
      });

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should handle internal server error', async () => {
      mockRequest.body = { email: 'user@example.com' };
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await AuthController.forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });

      expect(consoleSpy).toHaveBeenCalledWith('Forgot password error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
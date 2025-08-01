import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PasswordService } from '../services/passwordService';
import { JwtService } from '../services/jwtService';
import { ApiResponse, RequestWithUser } from '../types';

const prisma = new PrismaClient();

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'USER' | 'ADMIN';
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthController {
  static async login(req: Request<{}, ApiResponse<AuthResponse>, LoginRequest>, res: Response<ApiResponse<AuthResponse>>): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email },
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

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
        return;
      }

      const isPasswordValid = await PasswordService.verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
        return;
      }

      const tokenPair = JwtService.generateTokenPair(
        user.id,
        user.username,
        user.email,
        user.role
      );

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const responseData: AuthResponse = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
      };

      res.status(200).json({
        success: true,
        data: responseData,
        message: 'Login successful',
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async refresh(req: Request<{}, ApiResponse<Omit<AuthResponse, 'user'>>, RefreshRequest>, res: Response<ApiResponse<Omit<AuthResponse, 'user'>>>): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      const decoded = JwtService.verifyRefreshToken(refreshToken);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
        });
        return;
      }

      const tokenPair = JwtService.generateTokenPair(
        user.id,
        user.username,
        user.email,
        user.role,
        decoded.tokenVersion
      );

      const responseData = {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
      };

      res.status(200).json({
        success: true,
        data: responseData,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      
      if (error instanceof Error && error.message.includes('expired')) {
        res.status(401).json({
          success: false,
          error: 'Refresh token expired',
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }
  }

  static async logout(req: RequestWithUser, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  static async forgotPassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      await prisma.user.findUnique({
        where: { email },
        select: { id: true, isActive: true },
      });

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JwtPayload, RequestWithUser, ApiResponse } from '../types';

const prisma = new PrismaClient();

export const authenticateToken = async (
  req: RequestWithUser,
  res: Response<ApiResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token is required',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Invalid or inactive user',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

export const requireRole = (role: 'USER' | 'ADMIN') => {
  return (
    req: RequestWithUser,
    res: Response<ApiResponse>,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({
        success: false,
        error: `${role.toLowerCase()} privileges required`,
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: RequestWithUser,
  res: Response<ApiResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // If no token provided, continue without authentication
    if (!token) {
      req.user = undefined;
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      // If JWT_SECRET is not configured, continue without authentication
      req.user = undefined;
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      // If user is invalid/inactive, continue without authentication
      req.user = undefined;
      next();
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    // If authentication fails, continue without authentication
    req.user = undefined;
    next();
  }
};

export const requireAdmin = (
  req: RequestWithUser,
  res: Response<ApiResponse>,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: 'Admin privileges required',
    });
    return;
  }

  next();
};

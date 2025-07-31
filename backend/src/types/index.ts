import { Request } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface JwtPayload {
  userId: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

export interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // computed from firstName + lastName
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  bio?: string;
  profileImageUrl?: string;
  lastLoginAt?: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  duration: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthError extends Error {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };
}

// User Management Types
export interface UserProfile extends User {
  bio?: string;
  profileImageUrl?: string;
  lastLoginAt?: Date;
}

export interface UserProgress {
  id: number;
  userId: number;
  courseId: number;
  materialId: number;
  progressPercentage: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  lastAccessedAt?: Date;
}

export interface UserBadge {
  id: number;
  badgeName: string;
  description?: string;
  iconUrl?: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  earnedAt: Date;
}

export interface UserSkill {
  id: number;
  skillName: string;
  category: string;
  level: number;
  totalPoints: number;
}

export interface UserListQuery extends Record<string, unknown> {
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  bio?: string;
  profileImageUrl?: string;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImageUrl?: string;
  isActive?: boolean;
  role?: UserRole;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
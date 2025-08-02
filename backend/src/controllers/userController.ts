import { Request, Response } from 'express';
import { UserService, CreateUserData, UpdateUserData, UserQuery } from '../services/userService';
import { ApiResponse, RequestWithUser } from '../types';
import { NotFoundError, ConflictError } from '../utils/errors';

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'USER' | 'ADMIN';
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImageUrl?: string;
  isActive?: boolean;
  role?: 'USER' | 'ADMIN';
}

export interface UserQueryRequest {
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
  search?: string;
  page?: string;
  limit?: string;
}

export class UserController {
  /**
   * POST /users
   * Create a new user (Admin only)
   */
  static async createUser(
    req: Request<{}, ApiResponse, UserCreateRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userData: CreateUserData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role || 'USER'
      };

      const user = await UserService.createUser(userData);

      // Remove password hash from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _passwordHash, ...userResponse } = user;

      res.status(201).json({
        success: true,
        data: userResponse,
        message: 'User created successfully'
      });
    } catch (error: any) {
      if (error instanceof ConflictError) {
        res.status(409).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
    }
  }

  /**
   * GET /users
   * Get all users with filtering and pagination (Admin only)
   */
  static async getAllUsers(
    req: Request<{}, ApiResponse, {}, UserQueryRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const query: UserQuery = {
        ...(req.query.role && { role: req.query.role }),
        ...(req.query.isActive !== undefined && { isActive: String(req.query.isActive) === 'true' }),
        ...(req.query.search && { search: req.query.search }),
        page: req.query.page ? parseInt(req.query.page, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 20
      };

      const result = await UserService.getUsers(query);

      // Remove password hashes from response
      const usersWithoutPassword = result.users.map(user => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _passwordHash, ...userResponse } = user;
        return userResponse;
      });

      res.json({
        success: true,
        data: {
          users: usersWithoutPassword,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: Math.ceil(result.total / result.limit)
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get users'
      });
    }
  }

  /**
   * GET /users/me
   * Get current user profile
   */
  static async getCurrentUser(
    req: RequestWithUser,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await UserService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      // Remove password hash from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _passwordHash, ...userResponse } = user;

      res.json({
        success: true,
        data: userResponse
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile'
      });
    }
  }

  /**
   * PUT /users/me
   * Update current user profile
   */
  static async updateCurrentUser(
    req: RequestWithUser<{}, ApiResponse, UserUpdateRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      
      // Remove sensitive fields that users shouldn't be able to update themselves
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { role: _role, isActive: _isActive, ...updateData } = req.body;

      const updatedUser = await UserService.updateUser(userId, updateData);

      // Remove password hash from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _passwordHash, ...userResponse } = updatedUser;

      res.json({
        success: true,
        data: userResponse,
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      if (error instanceof ConflictError) {
        res.status(409).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }

  /**
   * GET /users/:id
   * Get user by ID (Admin only or own profile)
   */
  static async getUserById(
    req: RequestWithUser<{ id: string }>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const targetUserId = parseInt(req.params.id, 10);
      const currentUser = req.user!;

      // Allow access if user is admin or requesting their own profile
      if (currentUser.role !== 'ADMIN' && currentUser.id !== targetUserId) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      const user = await UserService.getUserById(targetUserId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      // Remove password hash from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _passwordHash, ...userResponse } = user;

      res.json({
        success: true,
        data: userResponse
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get user'
      });
    }
  }

  /**
   * PUT /users/:id
   * Update user by ID (Admin only)
   */
  static async updateUser(
    req: Request<{ id: string }, ApiResponse, UserUpdateRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      const updateData: UpdateUserData = req.body;

      const updatedUser = await UserService.updateUser(userId, updateData);

      // Remove password hash from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _passwordHash, ...userResponse } = updatedUser;

      res.json({
        success: true,
        data: userResponse,
        message: 'User updated successfully'
      });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      if (error instanceof ConflictError) {
        res.status(409).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update user'
      });
    }
  }

  /**
   * DELETE /users/:id
   * Soft delete user by ID (Admin only)
   */
  static async deleteUser(
    req: Request<{ id: string }>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);

      const deletedUser = await UserService.deleteUser(userId);

      // Remove password hash from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _passwordHash, ...userResponse } = deletedUser;

      res.json({
        success: true,
        data: userResponse,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete user'
      });
    }
  }

  /**
   * GET /users/:id/progress
   * Get user learning progress (Admin only or own progress)
   */
  static async getUserProgress(
    req: RequestWithUser<{ id: string }>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const targetUserId = parseInt(req.params.id, 10);
      const currentUser = req.user!;

      // Allow access if user is admin or requesting their own progress
      if (currentUser.role !== 'ADMIN' && currentUser.id !== targetUserId) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      const progress = await UserService.getUserProgress(targetUserId);

      res.json({
        success: true,
        data: progress
      });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get user progress'
      });
    }
  }

  /**
   * GET /users/:id/badges
   * Get user badges (Admin only or own badges)
   */
  static async getUserBadges(
    req: RequestWithUser<{ id: string }>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const targetUserId = parseInt(req.params.id, 10);
      const currentUser = req.user!;

      // Allow access if user is admin or requesting their own badges
      if (currentUser.role !== 'ADMIN' && currentUser.id !== targetUserId) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      const badges = await UserService.getUserBadges(targetUserId);

      res.json({
        success: true,
        data: badges
      });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get user badges'
      });
    }
  }

  /**
   * GET /users/:id/skills
   * Get user skills (Admin only or own skills)
   */
  static async getUserSkills(
    req: RequestWithUser<{ id: string }>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const targetUserId = parseInt(req.params.id, 10);
      const currentUser = req.user!;

      // Allow access if user is admin or requesting their own skills
      if (currentUser.role !== 'ADMIN' && currentUser.id !== targetUserId) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      const skills = await UserService.getUserSkills(targetUserId);

      res.json({
        success: true,
        data: skills
      });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get user skills'
      });
    }
  }
}
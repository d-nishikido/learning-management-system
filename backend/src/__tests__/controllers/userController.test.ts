// Mock UserService first
jest.mock('../../services/userService');

import { Request, Response } from 'express';
import { UserController } from '../../controllers/userController';
import { UserService } from '../../services/userService';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { mockHelpers } from '../helpers/apiHelpers';
import { userFixtures, createUserData } from '../helpers/fixtures';

const mockUserService = UserService as jest.Mocked<typeof UserService>;

describe('UserController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = mockHelpers.createMockRequest();
    mockResponse = mockHelpers.createMockResponse();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      mockRequest.body = createUserData.valid;
      const createdUser = { ...userFixtures.user1, passwordHash: 'hashedPassword' };
      
      mockUserService.createUser.mockResolvedValue(createdUser);

      await UserController.createUser(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.createUser).toHaveBeenCalledWith({
        username: createUserData.valid.username,
        email: createUserData.valid.email,
        password: createUserData.valid.password,
        firstName: createUserData.valid.firstName,
        lastName: createUserData.valid.lastName,
        role: createUserData.valid.role,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.not.objectContaining({ passwordHash: expect.anything() }),
        message: 'User created successfully',
      });
    });

    it('should default role to USER if not provided', async () => {
      const userData = { ...createUserData.valid };
      delete (userData as any).role;
      mockRequest.body = userData;
      
      const createdUser = { ...userFixtures.user1, passwordHash: 'hashedPassword' };
      mockUserService.createUser.mockResolvedValue(createdUser);

      await UserController.createUser(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'USER' })
      );
    });

    it('should handle conflict error', async () => {
      mockRequest.body = createUserData.valid;
      mockUserService.createUser.mockRejectedValue(new ConflictError('Username already exists'));

      await UserController.createUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Username already exists',
      });
    });

    it('should handle internal server error', async () => {
      mockRequest.body = createUserData.valid;
      mockUserService.createUser.mockRejectedValue(new Error('Database error'));

      await UserController.createUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create user',
      });
    });
  });

  describe('getAllUsers', () => {
    it('should get all users with default pagination', async () => {
      const usersResult = {
        users: [
          { ...userFixtures.admin, passwordHash: 'hash1' },
          { ...userFixtures.user1, passwordHash: 'hash2' },
        ],
        total: 2,
        page: 1,
        limit: 20,
      };

      mockUserService.getUsers.mockResolvedValue(usersResult);

      await UserController.getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          users: expect.arrayContaining([
            expect.not.objectContaining({ passwordHash: expect.anything() }),
            expect.not.objectContaining({ passwordHash: expect.anything() }),
          ]),
          pagination: {
            total: 2,
            page: 1,
            limit: 20,
            pages: 1,
          },
        },
      });
    });

    it('should get users with query parameters', async () => {
      mockRequest.query = {
        role: 'ADMIN',
        isActive: 'true',
        search: 'admin',
        page: '2',
        limit: '10',
      };

      const usersResult = {
        users: [{ ...userFixtures.admin, passwordHash: 'hash1' }],
        total: 1,
        page: 2,
        limit: 10,
      };

      mockUserService.getUsers.mockResolvedValue(usersResult);

      await UserController.getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getUsers).toHaveBeenCalledWith({
        role: 'ADMIN',
        isActive: true,
        search: 'admin',
        page: 2,
        limit: 10,
      });
    });

    it('should handle internal server error', async () => {
      mockUserService.getUsers.mockRejectedValue(new Error('Database error'));

      await UserController.getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get users',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user profile', async () => {
      (mockRequest as any).user = userFixtures.user1;
      const userWithPassword = { ...userFixtures.user1, passwordHash: 'hashedPassword' };
      
      mockUserService.getUserById.mockResolvedValue(userWithPassword);

      await UserController.getCurrentUser(mockRequest as any, mockResponse as Response);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(userFixtures.user1.id);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.not.objectContaining({ passwordHash: expect.anything() }),
      });
    });

    it('should handle user not found', async () => {
      (mockRequest as any).user = userFixtures.user1;
      mockUserService.getUserById.mockResolvedValue(null);

      await UserController.getCurrentUser(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should handle internal server error', async () => {
      (mockRequest as any).user = userFixtures.user1;
      mockUserService.getUserById.mockRejectedValue(new Error('Database error'));

      await UserController.getCurrentUser(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get user profile',
      });
    });
  });

  describe('updateCurrentUser', () => {
    it('should update current user profile', async () => {
      (mockRequest as any).user = userFixtures.user1;
      mockRequest.body = {
        firstName: 'Updated',
        lastName: 'Name',
        role: 'ADMIN', // Should be ignored
        isActive: false, // Should be ignored
      };

      const updatedUser = {
        ...userFixtures.user1,
        firstName: 'Updated',
        lastName: 'Name',
        passwordHash: 'hashedPassword',
      };

      mockUserService.updateUser.mockResolvedValue(updatedUser);

      await UserController.updateCurrentUser(mockRequest as any, mockResponse as Response);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(userFixtures.user1.id, {
        firstName: 'Updated',
        lastName: 'Name',
        // role and isActive should be excluded
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.not.objectContaining({ passwordHash: expect.anything() }),
        message: 'Profile updated successfully',
      });
    });

    it('should handle not found error', async () => {
      (mockRequest as any).user = userFixtures.user1;
      mockRequest.body = { firstName: 'Updated' };
      
      mockUserService.updateUser.mockRejectedValue(new NotFoundError('User not found'));

      await UserController.updateCurrentUser(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should handle conflict error', async () => {
      (mockRequest as any).user = userFixtures.user1;
      mockRequest.body = { username: 'conflictuser' };
      
      mockUserService.updateUser.mockRejectedValue(new ConflictError('Username already exists'));

      await UserController.updateCurrentUser(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Username already exists',
      });
    });
  });

  describe('getUserById', () => {
    it('should allow admin to get any user', async () => {
      (mockRequest as any).user = userFixtures.admin;
      mockRequest.params = { id: '2' };
      
      const userWithPassword = { ...userFixtures.user1, passwordHash: 'hashedPassword' };
      mockUserService.getUserById.mockResolvedValue(userWithPassword);

      await UserController.getUserById(mockRequest as any, mockResponse as Response);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(2);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.not.objectContaining({ passwordHash: expect.anything() }),
      });
    });

    it('should allow user to get their own profile', async () => {
      (mockRequest as any).user = userFixtures.user1;
      mockRequest.params = { id: '2' }; // Same as user1.id
      
      const userWithPassword = { ...userFixtures.user1, passwordHash: 'hashedPassword' };
      mockUserService.getUserById.mockResolvedValue(userWithPassword);

      await UserController.getUserById(mockRequest as any, mockResponse as Response);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(2);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.not.objectContaining({ passwordHash: expect.anything() }),
      });
    });

    it('should deny access for non-admin accessing other user', async () => {
      (mockRequest as any).user = userFixtures.user1;
      mockRequest.params = { id: '3' }; // Different user ID

      await UserController.getUserById(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied',
      });
      expect(mockUserService.getUserById).not.toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      (mockRequest as any).user = userFixtures.admin;
      mockRequest.params = { id: '999' };
      
      mockUserService.getUserById.mockResolvedValue(null);

      await UserController.getUserById(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      mockRequest.params = { id: '2' };
      mockRequest.body = { firstName: 'Updated', role: 'ADMIN' };
      
      const updatedUser = {
        ...userFixtures.user1,
        firstName: 'Updated',
        role: 'ADMIN',
        passwordHash: 'hashedPassword',
      };

      mockUserService.updateUser.mockResolvedValue(updatedUser);

      await UserController.updateUser(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(2, mockRequest.body);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.not.objectContaining({ passwordHash: expect.anything() }),
        message: 'User updated successfully',
      });
    });

    it('should handle not found error', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { firstName: 'Updated' };
      
      mockUserService.updateUser.mockRejectedValue(new NotFoundError('User not found'));

      await UserController.updateUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockRequest.params = { id: '2' };
      
      const deletedUser = {
        ...userFixtures.user1,
        isActive: false,
        passwordHash: 'hashedPassword',
      };

      mockUserService.deleteUser.mockResolvedValue(deletedUser);

      await UserController.deleteUser(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith(2);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.not.objectContaining({ passwordHash: expect.anything() }),
        message: 'User deleted successfully',
      });
    });

    it('should handle not found error', async () => {
      mockRequest.params = { id: '999' };
      
      mockUserService.deleteUser.mockRejectedValue(new NotFoundError('User not found'));

      await UserController.deleteUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });
  });

  describe('getUserProgress', () => {
    it('should allow admin to get any user progress', async () => {
      (mockRequest as any).user = userFixtures.admin;
      mockRequest.params = { id: '2' };
      
      const progressData = [{ id: 1, courseId: 1, progressRate: 0.75 }];
      mockUserService.getUserProgress.mockResolvedValue(progressData);

      await UserController.getUserProgress(mockRequest as any, mockResponse as Response);

      expect(mockUserService.getUserProgress).toHaveBeenCalledWith(2);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: progressData,
      });
    });

    it('should allow user to get their own progress', async () => {
      (mockRequest as any).user = userFixtures.user1;
      mockRequest.params = { id: '2' }; // Same as user1.id
      
      const progressData = [{ id: 1, courseId: 1, progressRate: 0.75 }];
      mockUserService.getUserProgress.mockResolvedValue(progressData);

      await UserController.getUserProgress(mockRequest as any, mockResponse as Response);

      expect(mockUserService.getUserProgress).toHaveBeenCalledWith(2);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: progressData,
      });
    });

    it('should deny access for non-admin accessing other user progress', async () => {
      (mockRequest as any).user = userFixtures.user1;
      mockRequest.params = { id: '3' }; // Different user ID

      await UserController.getUserProgress(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied',
      });
      expect(mockUserService.getUserProgress).not.toHaveBeenCalled();
    });

    it('should handle not found error', async () => {
      (mockRequest as any).user = userFixtures.admin;
      mockRequest.params = { id: '999' };
      
      mockUserService.getUserProgress.mockRejectedValue(new NotFoundError('User not found'));

      await UserController.getUserProgress(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });
  });

  describe('getUserBadges', () => {
    it('should get user badges successfully', async () => {
      (mockRequest as any).user = userFixtures.admin;
      mockRequest.params = { id: '2' };
      
      const badgesData = [{ id: 1, badgeId: 1, earnedAt: new Date() }];
      mockUserService.getUserBadges.mockResolvedValue(badgesData);

      await UserController.getUserBadges(mockRequest as any, mockResponse as Response);

      expect(mockUserService.getUserBadges).toHaveBeenCalledWith(2);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: badgesData,
      });
    });

    it('should deny access for non-admin accessing other user badges', async () => {
      (mockRequest as any).user = userFixtures.user1;
      mockRequest.params = { id: '3' }; // Different user ID

      await UserController.getUserBadges(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied',
      });
    });
  });

  describe('getUserSkills', () => {
    it('should get user skills successfully', async () => {
      (mockRequest as any).user = userFixtures.admin;
      mockRequest.params = { id: '2' };
      
      const skillsData = [{ id: 1, skillId: 1, skillLevel: 3, experiencePoints: 150 }];
      mockUserService.getUserSkills.mockResolvedValue(skillsData);

      await UserController.getUserSkills(mockRequest as any, mockResponse as Response);

      expect(mockUserService.getUserSkills).toHaveBeenCalledWith(2);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: skillsData,
      });
    });

    it('should deny access for non-admin accessing other user skills', async () => {
      (mockRequest as any).user = userFixtures.user1;
      mockRequest.params = { id: '3' }; // Different user ID

      await UserController.getUserSkills(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied',
      });
    });
  });
});
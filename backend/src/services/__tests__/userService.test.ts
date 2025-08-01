// Mock Prisma first
const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userProgress: {
    findMany: jest.fn(),
  },
  userBadge: {
    findMany: jest.fn(),
  },
  userSkill: {
    findMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Mock PasswordService
jest.mock('../passwordService');

import { UserService, CreateUserData, UpdateUserData } from '../userService';
import { PasswordService } from '../passwordService';
import { NotFoundError, ConflictError } from '../../utils/errors';

const mockPasswordService = PasswordService as jest.Mocked<typeof PasswordService>;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const validUserData: CreateUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER'
    };

    it('should create a new user successfully', async () => {
      const hashedPassword = 'hashed_password';
      const createdUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await UserService.createUser(validUserData);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: validUserData.username },
            { email: validUserData.email }
          ]
        }
      });
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(validUserData.password);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          username: validUserData.username,
          email: validUserData.email,
          passwordHash: hashedPassword,
          firstName: validUserData.firstName,
          lastName: validUserData.lastName,
          role: validUserData.role,
        }
      });
      expect(result).toEqual(createdUser);
    });

    it('should throw ConflictError if username already exists', async () => {
      const existingUser = {
        id: 1,
        username: 'testuser',
        email: 'other@example.com',
      };

      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      await expect(UserService.createUser(validUserData))
        .rejects.toThrow(ConflictError);
      
      expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError if email already exists', async () => {
      const existingUser = {
        id: 1,
        username: 'otheruser',
        email: 'test@example.com',
      };

      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      await expect(UserService.createUser(validUserData))
        .rejects.toThrow(ConflictError);
    });

    it('should default role to USER if not provided', async () => {
      const userData = { ...validUserData };
      delete (userData as any).role;
      
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPasswordService.hashPassword.mockResolvedValue('hashed');
      mockPrisma.user.create.mockResolvedValue({ id: 1 } as any);

      await UserService.createUser(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: 'USER'
        })
      });
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const user = { id: 1, username: 'test', email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await UserService.getUserById(1);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await UserService.getUserById(999);

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user if found', async () => {
      const user = { id: 1, username: 'test', email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await UserService.getUserByEmail('test@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ 
        where: { email: 'test@example.com' } 
      });
      expect(result).toEqual(user);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users with default pagination', async () => {
      const users = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' }
      ];
      const total = 2;

      mockPrisma.user.findMany.mockResolvedValue(users);
      mockPrisma.user.count.mockResolvedValue(total);

      const result = await UserService.getUsers({});

      expect(result).toEqual({
        users,
        total,
        page: 1,
        limit: 20
      });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should apply filters correctly', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await UserService.getUsers({
        role: 'ADMIN',
        isActive: true,
        search: 'john',
        page: 2,
        limit: 10
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: 'ADMIN',
          isActive: true,
          OR: [
            { username: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
            { firstName: { contains: 'john', mode: 'insensitive' } },
            { lastName: { contains: 'john', mode: 'insensitive' } }
          ]
        },
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should limit maximum results per page to 100', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await UserService.getUsers({ limit: 200 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });
  });

  describe('updateUser', () => {
    const updateData: UpdateUserData = {
      firstName: 'Jane',
      lastName: 'Smith'
    };

    it('should update user successfully', async () => {
      const existingUser = { id: 1, username: 'test' };
      const updatedUser = { ...existingUser, ...updateData };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await UserService.updateUser(1, updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(UserService.updateUser(999, updateData))
        .rejects.toThrow(NotFoundError);
    });

    it('should check for username conflicts when updating username', async () => {
      const existingUser = { id: 1, username: 'test' };
      const conflictUser = { id: 2, username: 'newusername' };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.findFirst.mockResolvedValue(conflictUser);

      await expect(UserService.updateUser(1, { username: 'newusername' }))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user successfully', async () => {
      const existingUser = { id: 1, username: 'test', isActive: true };
      const deletedUser = { ...existingUser, isActive: false };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue(deletedUser);

      const result = await UserService.deleteUser(1);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false }
      });
      expect(result).toEqual(deletedUser);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(UserService.deleteUser(999))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserProgress', () => {
    it('should return user progress with related data', async () => {
      const user = { id: 1, username: 'test' };
      const progress = [
        {
          id: 1,
          userId: 1,
          courseId: 1,
          progressRate: 0.75,
          course: { id: 1, title: 'Test Course', category: 'Programming' },
          lesson: { id: 1, title: 'Test Lesson' },
          material: { id: 1, title: 'Test Material', materialType: 'VIDEO' }
        }
      ];

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.userProgress.findMany.mockResolvedValue(progress);

      const result = await UserService.getUserProgress(1);

      expect(mockPrisma.userProgress.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          course: { select: { id: true, title: true, category: true } },
          lesson: { select: { id: true, title: true } },
          material: { select: { id: true, title: true, materialType: true } }
        },
        orderBy: { lastAccessed: 'desc' }
      });
      expect(result).toEqual(progress);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(UserService.getUserProgress(999))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserBadges', () => {
    it('should return user badges with badge details', async () => {
      const user = { id: 1, username: 'test' };
      const badges = [
        {
          id: 1,
          userId: 1,
          badgeId: 1,
          earnedAt: new Date(),
          badge: {
            id: 1,
            badgeName: 'First Steps',
            description: 'Complete first lesson',
            iconUrl: '/badges/first-steps.png',
            badgeColor: 'BRONZE',
            rarity: 'COMMON'
          }
        }
      ];

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.userBadge.findMany.mockResolvedValue(badges);

      const result = await UserService.getUserBadges(1);

      expect(result).toEqual(badges);
    });
  });

  describe('getUserSkills', () => {
    it('should return user skills with skill details', async () => {
      const user = { id: 1, username: 'test' };
      const skills = [
        {
          id: 1,
          userId: 1,
          skillId: 1,
          skillLevel: 3,
          experiencePoints: 150,
          skill: {
            id: 1,
            skillName: 'JavaScript',
            skillCategory: 'Programming',
            description: 'JavaScript programming language',
            iconUrl: '/skills/javascript.png'
          }
        }
      ];

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.userSkill.findMany.mockResolvedValue(skills);

      const result = await UserService.getUserSkills(1);

      expect(result).toEqual(skills);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 1 });

      await UserService.updateLastLogin(1);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lastLogin: expect.any(Date) }
      });
    });

    it('should not throw error if update fails', async () => {
      mockPrisma.user.update.mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(UserService.updateLastLogin(1)).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});
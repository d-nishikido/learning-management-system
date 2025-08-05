import { PrismaClient, User, UserProgress, UserBadge, UserSkill } from '@prisma/client';
import { PasswordService } from './passwordService';
import { NotFoundError, ConflictError } from '../utils/errors';

const prisma = new PrismaClient();

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'USER' | 'ADMIN';
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImageUrl?: string;
  isActive?: boolean;
  role?: 'USER' | 'ADMIN';
}

export interface UserQuery {
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserWithProgress extends User {
  userProgress?: UserProgress[];
  userBadges?: UserBadge[];
  userSkills?: UserSkill[];
}

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Check if username or email already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: userData.username },
            { email: userData.email }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.username === userData.username) {
          throw new ConflictError('Username already exists');
        }
        throw new ConflictError('Email already exists');
      }

      // Hash password
      const passwordHash = await PasswordService.hashPassword(userData.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role || 'USER',
        }
      });

      return user;
    } catch (error: any) {
      if (error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: number): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      });

      return user;
    } catch (error: any) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      return user;
    } catch (error: any) {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
  }

  /**
   * Get all users with filtering and pagination
   */
  static async getUsers(query: UserQuery): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    try {
      const page = query.page || 1;
      const limit = Math.min(query.limit || 20, 100); // Max 100 per page
      const skip = (page - 1) * limit;

      const where: any = {};

      // Apply filters
      if (query.role) {
        where.role = query.role;
      }

      if (query.isActive !== undefined) {
        where.isActive = query.isActive;
      }

      if (query.search) {
        where.OR = [
          { username: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      return { users, total, page, limit };
    } catch (error: any) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  /**
   * Update user by ID
   */
  static async updateUser(id: number, updateData: UpdateUserData): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Check for username/email conflicts if they're being updated
      if (updateData.username || updateData.email) {
        const conflictWhere: any = {
          AND: [
            { id: { not: id } }, // Exclude current user
            {
              OR: []
            }
          ]
        };

        if (updateData.username) {
          conflictWhere.AND[1].OR.push({ username: updateData.username });
        }

        if (updateData.email) {
          conflictWhere.AND[1].OR.push({ email: updateData.email });
        }

        const conflictUser = await prisma.user.findFirst({ where: conflictWhere });
        
        if (conflictUser) {
          if (conflictUser.username === updateData.username) {
            throw new ConflictError('Username already exists');
          }
          throw new ConflictError('Email already exists');
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData
      });

      return updatedUser;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Soft delete user by ID
   */
  static async deleteUser(id: number): Promise<User> {
    try {
      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Soft delete by setting isActive to false
      const deletedUser = await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });

      return deletedUser;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Get user progress
   */
  static async getUserProgress(userId: number): Promise<UserProgress[]> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const progress = await prisma.userProgress.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              category: true
            }
          },
          lesson: {
            select: {
              id: true,
              title: true
            }
          },
          material: {
            select: {
              id: true,
              title: true,
              materialType: true
            }
          }
        },
        orderBy: { lastAccessed: 'desc' }
      });

      return progress;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get user progress: ${error.message}`);
    }
  }

  /**
   * Get user badges
   */
  static async getUserBadges(userId: number): Promise<UserBadge[]> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const badges = await prisma.userBadge.findMany({
        where: { userId },
        include: {
          badge: {
            select: {
              id: true,
              badgeName: true,
              description: true,
              iconUrl: true,
              badgeColor: true,
              rarity: true
            }
          }
        },
        orderBy: { earnedAt: 'desc' }
      });

      return badges;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get user badges: ${error.message}`);
    }
  }

  /**
   * Get user skills
   */
  static async getUserSkills(userId: number): Promise<UserSkill[]> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const skills = await prisma.userSkill.findMany({
        where: { userId },
        include: {
          skill: {
            select: {
              id: true,
              skillName: true,
              skillCategory: true,
              description: true,
              iconUrl: true
            }
          }
        },
        orderBy: { skillLevel: 'desc' }
      });

      return skills;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get user skills: ${error.message}`);
    }
  }

  /**
   * Update user last login
   */
  static async updateLastLogin(id: number): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { lastLogin: new Date() }
      });
    } catch (error: any) {
      // Log error but don't throw to avoid breaking login flow
      console.error(`Failed to update last login for user ${id}:`, error.message);
    }
  }

  /**
   * Get enrolled course IDs for a user
   */
  static async getEnrolledCourseIds(userId: number): Promise<number[]> {
    try {
      const enrollments = await prisma.userProgress.findMany({
        where: { userId },
        select: { courseId: true }
      });

      return enrollments.map(enrollment => enrollment.courseId);
    } catch (error: any) {
      throw new Error(`Failed to get enrolled courses: ${error.message}`);
    }
  }
}
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

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Course {
  id: number;
  title: string;
  description?: string;
  category: string;
  difficultyLevel: DifficultyLevel;
  estimatedHours?: number;
  thumbnailUrl?: string;
  isPublished: boolean;
  sortOrder: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  lessons?: Array<{
    id: number;
    title: string;
    sortOrder: number;
    isPublished: boolean;
  }>;
  _count?: {
    lessons: number;
    userProgress: number;
  };
}

export interface CourseListResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
  category: string;
  difficultyLevel?: DifficultyLevel;
  estimatedHours?: number;
  thumbnailUrl?: string;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  category?: string;
  difficultyLevel?: DifficultyLevel;
  estimatedHours?: number;
  thumbnailUrl?: string;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface CourseQueryParams {
  category?: string;
  difficultyLevel?: DifficultyLevel;
  isPublished?: boolean;
  search?: string;
  page?: number;
  limit?: number;
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

export interface ApiRequestError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };
  message?: string;
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

// Lesson Management Types
export interface Lesson {
  id: number;
  title: string;
  description?: string;
  content?: string;
  estimatedMinutes?: number;
  sortOrder: number;
  isPublished: boolean;
  courseId: number;
  createdAt: Date;
  updatedAt: Date;
  course?: {
    id: number;
    title: string;
  };
}

export interface LessonListResponse {
  lessons: Lesson[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateLessonRequest {
  title: string;
  description?: string;
  content?: string;
  estimatedMinutes?: number;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface UpdateLessonRequest {
  title?: string;
  description?: string;
  content?: string;
  estimatedMinutes?: number;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface LessonQueryParams {
  isPublished?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LessonOrderUpdateRequest {
  sortOrder: number;
}

// Learning Material Types
export type MaterialType = 'FILE' | 'URL' | 'MANUAL_PROGRESS';
export type MaterialCategory = 'MAIN' | 'SUPPLEMENTARY';
export type ProgressType = 'AUTO' | 'MANUAL';

export interface LearningMaterial {
  id: number;
  lessonId: number;
  title: string;
  description?: string;
  materialType: MaterialType;
  materialCategory: MaterialCategory;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  externalUrl?: string;
  durationMinutes?: number;
  allowManualProgress: boolean;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  userProgress?: {
    progressRate: number;
    manualProgressRate?: number;
    spentMinutes: number;
    isCompleted: boolean;
    lastAccessed: Date;
  };
}

export interface LearningMaterialListResponse {
  materials: LearningMaterial[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateLearningMaterialRequest {
  title: string;
  description?: string;
  materialType: MaterialType;
  materialCategory?: MaterialCategory;
  externalUrl?: string;
  durationMinutes?: number;
  allowManualProgress?: boolean;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface UpdateLearningMaterialRequest {
  title?: string;
  description?: string;
  externalUrl?: string;
  durationMinutes?: number;
  allowManualProgress?: boolean;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface LearningMaterialQueryParams {
  materialType?: MaterialType;
  materialCategory?: MaterialCategory;
  isPublished?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ManualProgressUpdateRequest {
  progressRate: number;
  spentMinutes?: number;
  notes?: string;
}

export interface MaterialProgressUpdate {
  id: number;
  userId: number;
  courseId: number;
  lessonId?: number;
  materialId?: number;
  progressType: ProgressType;
  progressRate: number;
  manualProgressRate?: number;
  spentMinutes: number;
  isCompleted: boolean;
  completionDate?: Date;
  notes?: string;
  lastAccessed: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Learning Resource Types
export type ResourceType = 'FILE' | 'WEBSITE' | 'YOUTUBE' | 'DOCUMENT' | 'TOOL';
export type ImportanceLevel = 'REQUIRED' | 'RECOMMENDED' | 'REFERENCE';

export interface LearningResource {
  id: number;
  lessonId?: number;
  courseId?: number;
  title: string;
  description?: string;
  resourceType: ResourceType;
  resourceUrl: string;
  difficultyLevel: DifficultyLevel;
  importance: ImportanceLevel;
  tags?: string[];
  parsedTags?: string[];
  thumbnailUrl?: string;
  viewCount: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  lesson?: {
    id: number;
    title: string;
    courseId: number;
    course: {
      id: number;
      title: string;
    };
  };
  course?: {
    id: number;
    title: string;
  };
  _count?: {
    userMaterialAccess: number;
  };
}

export interface LearningResourceListResponse {
  resources: LearningResource[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateLearningResourceRequest {
  title: string;
  description?: string;
  resourceType: ResourceType;
  resourceUrl: string;
  difficultyLevel?: DifficultyLevel;
  importance?: ImportanceLevel;
  tags?: string[];
  thumbnailUrl?: string;
  isPublished?: boolean;
}

export interface UpdateLearningResourceRequest {
  title?: string;
  description?: string;
  resourceUrl?: string;
  difficultyLevel?: DifficultyLevel;
  importance?: ImportanceLevel;
  tags?: string[];
  thumbnailUrl?: string;
  isPublished?: boolean;
}

export interface LearningResourceQueryParams {
  resourceType?: ResourceType;
  importance?: ImportanceLevel;
  difficultyLevel?: DifficultyLevel;
  tags?: string;
  search?: string;
  page?: number;
  limit?: number;
}
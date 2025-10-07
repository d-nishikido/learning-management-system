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

export interface ProgressHistoryEntry {
  id: number;
  progressRate: number;
  spentMinutes: number;
  changedBy: number;
  notes: string | null;
  createdAt: string;
  previousProgressRate?: number;
  delta?: number;
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

// Progress API Types
export interface ProgressWithDetails extends MaterialProgressUpdate {
  course: Course;
  lesson?: Lesson | null;
  material?: LearningMaterial | null;
}

export interface ProgressQuery {
  courseId?: number;
  lessonId?: number;
  materialId?: number;
  isCompleted?: boolean;
  progressType?: ProgressType;
  page?: number;
  limit?: number;
}

export interface CreateProgressRequest {
  courseId: number;
  lessonId?: number;
  materialId?: number;
  progressType?: ProgressType;
  progressRate?: number;
  spentMinutes?: number;
  notes?: string;
}

export interface UpdateProgressRequest {
  progressRate?: number;
  spentMinutes?: number;
  isCompleted?: boolean;
  notes?: string;
}

export interface SessionStartRequest {
  materialId?: number;
  courseId?: number;
  lessonId?: number;
}

export interface SessionUpdateRequest {
  spentMinutes: number;
}

export interface LearningSession {
  id: number;
  userId: number;
  materialId?: number | null;
  courseId?: number;
  lessonId?: number;
  startTime: Date;
  endTime?: Date | null;
  duration: number;
  isActive: boolean;
}

export interface TimeStats {
  totalMinutes: number;
  dailyAverage: number;
  weeklyTotal: number;
  monthlyTotal: number;
  longestSession: number;
  sessionsCount: number;
  currentStreak: number;
  bestStreak: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  averageMinutesPerDay: number;
  streakHistory: {
    date: string;
    minutesStudied: number;
    materialsAccessed: number;
    lessonsCompleted: number;
  }[];
}

export interface ProgressSummary {
  totalCourses: number;
  enrolledCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  totalMaterials: number;
  completedMaterials: number;
  totalSpentMinutes: number;
  averageProgress: number;
  streakDays: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  spentMinutes: number;
  completedMaterials: number;
  progressRate: number;
}

export interface TimeStatsQuery {
  startDate?: string;
  endDate?: string;
  courseId?: number;
}

export interface TimeSeriesQuery {
  startDate?: string;
  endDate?: string;
  interval?: 'day' | 'week' | 'month';
  courseId?: number;
}

// Learning History Types
export type AccessType = 'VIEW' | 'DOWNLOAD' | 'EXTERNAL_LINK';

export interface AccessHistoryQuery {
  materialId?: number;
  resourceId?: number;
  accessType?: AccessType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AccessHistoryRecord {
  id: number;
  userId: number;
  materialId?: number | null;
  resourceId?: number | null;
  accessType: AccessType;
  sessionDuration?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  accessedAt: Date;
  user: User;
  material?: LearningMaterial | null;
  resource?: LearningResource | null;
}

export interface LearningPattern {
  hourOfDay: number;
  dayOfWeek: number;
  accessCount: number;
  averageSessionDuration: number;
}

export interface MaterialBreakdown {
  materialId: number;
  materialTitle: string;
  accessCount: number;
  totalTime: number;
}

export interface DetailedLearningHistory {
  totalAccesses: number;
  totalSessionTime: number;
  averageSessionTime: number;
  mostActiveHour: number;
  mostActiveDay: string;
  recentAccesses: AccessHistoryRecord[];
  learningPatterns: LearningPattern[];
  materialBreakdown: MaterialBreakdown[];
}

export interface DailyBreakdown {
  date: string;
  studyTime: number;
  materialsAccessed: number;
  sessionsCount: number;
}

export interface HourlyBreakdown {
  hour: number;
  accessCount: number;
  totalTime: number;
}

export interface WeeklyBreakdown {
  dayOfWeek: string;
  accessCount: number;
  totalTime: number;
}

export interface LearningStatsReport {
  userId: number;
  periodStart: Date;
  periodEnd: Date;
  totalStudyTime: number;
  totalMaterialsAccessed: number;
  uniqueMaterialsAccessed: number;
  averageDailyStudyTime: number;
  longestStudySession: number;
  shortestStudySession: number;
  mostUsedAccessType: AccessType;
  dailyBreakdown: DailyBreakdown[];
  hourlyBreakdown: HourlyBreakdown[];
  weeklyBreakdown: WeeklyBreakdown[];
}

export interface LearningPatternsResponse {
  mostActiveHour: number;
  mostActiveDay: string;
  learningPatterns: LearningPattern[];
  materialBreakdown: MaterialBreakdown[];
}

export interface RecordAccessRequest {
  materialId?: number;
  resourceId?: number;
  accessType: AccessType;
  sessionDuration?: number;
}
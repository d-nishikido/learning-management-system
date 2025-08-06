import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import type { 
  ApiError, 
  ApiResponse, 
  Course, 
  CourseListResponse, 
  CreateCourseRequest, 
  UpdateCourseRequest, 
  CourseQueryParams,
  UserProgress,
  Lesson,
  LessonListResponse,
  CreateLessonRequest,
  UpdateLessonRequest,
  LessonQueryParams,
  LessonOrderUpdateRequest,
  LearningMaterial,
  LearningMaterialListResponse,
  CreateLearningMaterialRequest,
  UpdateLearningMaterialRequest,
  LearningMaterialQueryParams,
  ManualProgressUpdateRequest,
  MaterialProgressUpdate,
  LearningResource,
  LearningResourceListResponse,
  CreateLearningResourceRequest,
  UpdateLearningResourceRequest,
  LearningResourceQueryParams,
  ProgressWithDetails,
  ProgressQuery,
  CreateProgressRequest,
  UpdateProgressRequest,
  SessionStartRequest,
  SessionUpdateRequest,
  LearningSession,
  TimeStats,
  StreakStats,
  ProgressSummary,
  TimeSeriesDataPoint,
  TimeStatsQuery,
  TimeSeriesQuery,
  PaginatedResponse
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  refresh: () => apiClient.post('/auth/refresh'),
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
};

export const courseApi = {
  getAll: (params?: CourseQueryParams): Promise<ApiResponse<CourseListResponse>> =>
    apiClient.get('/courses', { params }),
  getById: (id: number): Promise<ApiResponse<Course>> => 
    apiClient.get(`/courses/${id}`),
  create: (data: CreateCourseRequest): Promise<ApiResponse<Course>> => 
    apiClient.post('/courses', data),
  update: (id: number, data: UpdateCourseRequest): Promise<ApiResponse<Course>> => 
    apiClient.put(`/courses/${id}`, data),
  delete: (id: number): Promise<ApiResponse<void>> => 
    apiClient.delete(`/courses/${id}`),
  enroll: (id: number): Promise<ApiResponse<UserProgress>> => 
    apiClient.post(`/courses/${id}/enroll`),
  unenroll: (id: number): Promise<ApiResponse<void>> => 
    apiClient.delete(`/courses/${id}/enroll`),
};

export const progressApi = {
  // Basic progress CRUD
  getMyProgress: (params?: ProgressQuery): Promise<ApiResponse<PaginatedResponse<ProgressWithDetails>>> =>
    apiClient.get('/progress/me', { params }),
  
  getCourseProgress: (courseId: number): Promise<ApiResponse<ProgressWithDetails[]>> =>
    apiClient.get(`/progress/courses/${courseId}`),
  
  getLessonProgress: (lessonId: number): Promise<ApiResponse<ProgressWithDetails[]>> =>
    apiClient.get(`/progress/lessons/${lessonId}`),
  
  getMaterialProgress: (materialId: number): Promise<ApiResponse<ProgressWithDetails | null>> =>
    apiClient.get(`/progress/materials/${materialId}`),
  
  createProgress: (data: CreateProgressRequest): Promise<ApiResponse<ProgressWithDetails>> =>
    apiClient.post('/progress', data),
  
  updateProgress: (id: number, data: UpdateProgressRequest): Promise<ApiResponse<ProgressWithDetails>> =>
    apiClient.put(`/progress/${id}`, data),
  
  deleteProgress: (id: number): Promise<ApiResponse<void>> =>
    apiClient.delete(`/progress/${id}`),
  
  // Manual progress
  updateManualProgress: (
    materialId: number, 
    data: ManualProgressUpdateRequest
  ): Promise<ApiResponse<ProgressWithDetails>> =>
    apiClient.put(`/progress/materials/${materialId}/manual`, data),
  
  markMaterialComplete: (materialId: number): Promise<ApiResponse<ProgressWithDetails>> =>
    apiClient.post(`/progress/materials/${materialId}/complete`),
  
  // Learning sessions
  startSession: (data: SessionStartRequest): Promise<ApiResponse<LearningSession>> =>
    apiClient.post('/progress/sessions/start', data),
  
  updateSession: (sessionId: number, data: SessionUpdateRequest): Promise<ApiResponse<LearningSession>> =>
    apiClient.put(`/progress/sessions/${sessionId}/update`, data),
  
  endSession: (sessionId: number): Promise<ApiResponse<{ session: LearningSession; progressUpdated: boolean }>> =>
    apiClient.post(`/progress/sessions/${sessionId}/end`),
  
  // Statistics and analytics
  getTimeStats: (params?: TimeStatsQuery): Promise<ApiResponse<TimeStats>> =>
    apiClient.get('/progress/time-stats', { params }),
  
  getProgressSummary: (params?: { courseId?: number }): Promise<ApiResponse<ProgressSummary>> =>
    apiClient.get('/progress/stats/summary', { params }),
  
  getStreakStats: (): Promise<ApiResponse<StreakStats>> =>
    apiClient.get('/progress/stats/streaks'),
  
  getTimeSeriesData: (params?: TimeSeriesQuery): Promise<ApiResponse<TimeSeriesDataPoint[]>> =>
    apiClient.get('/progress/stats/time-series', { params }),
};

export const lessonApi = {
  getByCourse: (courseId: number, params?: LessonQueryParams): Promise<ApiResponse<LessonListResponse>> =>
    apiClient.get(`/courses/${courseId}/lessons`, { params }),
  getById: (courseId: number, id: number): Promise<ApiResponse<Lesson>> => 
    apiClient.get(`/courses/${courseId}/lessons/${id}`),
  create: (courseId: number, data: CreateLessonRequest): Promise<ApiResponse<Lesson>> => 
    apiClient.post(`/courses/${courseId}/lessons`, data),
  update: (courseId: number, id: number, data: UpdateLessonRequest): Promise<ApiResponse<Lesson>> => 
    apiClient.put(`/courses/${courseId}/lessons/${id}`, data),
  delete: (courseId: number, id: number): Promise<ApiResponse<void>> => 
    apiClient.delete(`/courses/${courseId}/lessons/${id}`),
  updateOrder: (courseId: number, id: number, data: LessonOrderUpdateRequest): Promise<ApiResponse<Lesson>> => 
    apiClient.put(`/courses/${courseId}/lessons/${id}/order`, data),
};

export const userApi = {
  // Admin APIs
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get('/users', { params }),
  getById: (id: string) => apiClient.get(`/users/${id}`),
  create: (data: unknown) => apiClient.post('/users', data),
  update: (id: string, data: unknown) => apiClient.put(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
  
  // Profile APIs
  getMe: () => apiClient.get('/users/me'),
  getEnrolledCourses: (): Promise<ApiResponse<{ courseIds: number[] }>> => 
    apiClient.get('/users/me/enrolled-courses'),
  updateMe: (data: unknown) => apiClient.put('/users/me', data),
  getMyProgress: (id: string) => apiClient.get(`/users/${id}/progress`),
  getMyBadges: (id: string) => apiClient.get(`/users/${id}/badges`),
  getMySkills: (id: string) => apiClient.get(`/users/${id}/skills`),
};

export const materialApi = {
  getByLesson: (
    courseId: number, 
    lessonId: number, 
    params?: LearningMaterialQueryParams
  ): Promise<ApiResponse<LearningMaterialListResponse>> =>
    apiClient.get(`/courses/${courseId}/lessons/${lessonId}/materials`, { params }),
  
  getById: (
    courseId: number, 
    lessonId: number, 
    id: number
  ): Promise<ApiResponse<LearningMaterial>> =>
    apiClient.get(`/courses/${courseId}/lessons/${lessonId}/materials/${id}`),
  
  download: (
    courseId: number, 
    lessonId: number, 
    id: number
  ): Promise<Blob> => {
    return axios.get(
      `${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/materials/${id}/download`,
      {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    ).then(response => response.data);
  },
  
  create: (
    courseId: number,
    lessonId: number,
    data: CreateLearningMaterialRequest
  ): Promise<ApiResponse<LearningMaterial>> =>
    apiClient.post(`/courses/${courseId}/lessons/${lessonId}/materials`, data),
  
  upload: (
    courseId: number,
    lessonId: number,
    file: File,
    data: Omit<CreateLearningMaterialRequest, 'materialType'>
  ): Promise<ApiResponse<LearningMaterial>> => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });
    
    return apiClient.post(
      `/courses/${courseId}/lessons/${lessonId}/materials/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },
  
  update: (
    courseId: number,
    lessonId: number,
    id: number,
    data: UpdateLearningMaterialRequest
  ): Promise<ApiResponse<LearningMaterial>> =>
    apiClient.put(`/courses/${courseId}/lessons/${lessonId}/materials/${id}`, data),
  
  delete: (
    courseId: number,
    lessonId: number,
    id: number
  ): Promise<ApiResponse<void>> =>
    apiClient.delete(`/courses/${courseId}/lessons/${lessonId}/materials/${id}`),
  
  updateManualProgress: (
    materialId: number,
    data: ManualProgressUpdateRequest
  ): Promise<ApiResponse<MaterialProgressUpdate>> =>
    apiClient.put(`/progress/materials/${materialId}/manual`, data),
};

export const resourceApi = {
  // Search resources across the system
  search: (params?: LearningResourceQueryParams): Promise<ApiResponse<LearningResourceListResponse>> =>
    apiClient.get('/resources/search', { params }),
  
  // Get all available tags
  getTags: (): Promise<ApiResponse<string[]>> =>
    apiClient.get('/resources/tags'),
  
  // Get resource by ID
  getById: (id: number): Promise<ApiResponse<LearningResource>> =>
    apiClient.get(`/resources/${id}`),
  
  // Update resource (admin only)
  update: (id: number, data: UpdateLearningResourceRequest): Promise<ApiResponse<LearningResource>> =>
    apiClient.put(`/resources/${id}`, data),
  
  // Delete resource (admin only)
  delete: (id: number): Promise<ApiResponse<void>> =>
    apiClient.delete(`/resources/${id}`),
  
  // Get resources for a specific course
  getByCourse: (
    courseId: number, 
    params?: LearningResourceQueryParams
  ): Promise<ApiResponse<LearningResourceListResponse>> =>
    apiClient.get(`/courses/${courseId}/resources`, { params }),
  
  // Create resource for a course (admin only)
  createForCourse: (
    courseId: number,
    data: CreateLearningResourceRequest
  ): Promise<ApiResponse<LearningResource>> =>
    apiClient.post(`/courses/${courseId}/resources`, data),
  
  // Get resources for a specific lesson
  getByLesson: (
    courseId: number,
    lessonId: number, 
    params?: LearningResourceQueryParams
  ): Promise<ApiResponse<LearningResourceListResponse>> =>
    apiClient.get(`/courses/${courseId}/lessons/${lessonId}/resources`, { params }),
  
  // Create resource for a lesson (admin only)
  createForLesson: (
    courseId: number,
    lessonId: number,
    data: CreateLearningResourceRequest
  ): Promise<ApiResponse<LearningResource>> =>
    apiClient.post(`/courses/${courseId}/lessons/${lessonId}/resources`, data),
};
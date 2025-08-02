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
  LessonOrderUpdateRequest
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
  getMyProgress: () => apiClient.get('/progress/me'),
  updateProgress: (id: string, data: unknown) =>
    apiClient.put(`/progress/${id}`, data),
  markComplete: (materialId: string) =>
    apiClient.post('/progress/complete', { materialId }),
  getStats: () => apiClient.get('/progress/stats'),
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
  updateMe: (data: unknown) => apiClient.put('/users/me', data),
  getMyProgress: (id: string) => apiClient.get(`/users/${id}/progress`),
  getMyBadges: (id: string) => apiClient.get(`/users/${id}/badges`),
  getMySkills: (id: string) => apiClient.get(`/users/${id}/skills`),
};
import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ApiError, ApiResponse } from '@/types';

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
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get('/courses', { params }),
  getById: (id: string) => apiClient.get(`/courses/${id}`),
  create: (data: unknown) => apiClient.post('/courses', data),
  update: (id: string, data: unknown) => apiClient.put(`/courses/${id}`, data),
};

export const progressApi = {
  getMyProgress: () => apiClient.get('/progress/me'),
  updateProgress: (id: string, data: unknown) =>
    apiClient.put(`/progress/${id}`, data),
  markComplete: (materialId: string) =>
    apiClient.post('/progress/complete', { materialId }),
  getStats: () => apiClient.get('/progress/stats'),
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
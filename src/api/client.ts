/**
 * Production-ready API client for Veo 3 Video Generator
 * Features: JWT auth, retry logic, timeouts, proper error handling
 */

import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig 
} from 'axios';
import { 
  ApiError, 
  ApiResponse, 
  ErrorResponse, 
  HTTPValidationError,
  UploadProgress 
} from './types';

// ========== CONFIGURATION ==========

const API_CONFIG = {
  // Base URL - use environment variable in production builds
  BASE_URL: import.meta.env.VITE_API_URL || 'https://api.lostmindai.com',
  // Smart API prefix to prevent double /api segments
  // If BASE_URL ends with '/api', use '/v1', otherwise use '/api/v1'
  API_PREFIX: (() => {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://api.lostmindai.com';
    return baseUrl.endsWith('/api') ? '/v1' : '/api/v1';
  })(),
  
  // Timeouts
  TIMEOUT: 30000,              // 30 seconds default
  UPLOAD_TIMEOUT: 300000,      // 5 minutes for file uploads
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,           // 1 second base delay
  BACKOFF_FACTOR: 2,           // exponential backoff
  RETRY_STATUS_CODES: [503, 502, 504, 408, 429],
  
  // Headers
  CONTENT_TYPE: 'application/json',
  ACCEPT: 'application/json',
} as const;

// ========== TYPES ==========

interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipRetry?: boolean;
  uploadProgress?: (progress: UploadProgress) => void;
}

// ========== ERROR HANDLING ==========

export class ApiClientError extends Error implements ApiError {
  public status?: number;
  public code?: string;
  public details?: any;
  public request_id?: string;

  constructor(
    message: string,
    status?: number,
    code?: string,
    details?: any,
    request_id?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.request_id = request_id;
  }
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate retry delay with jitter
 */
const calculateRetryDelay = (attempt: number, baseDelay: number): number => {
  const exponentialDelay = baseDelay * Math.pow(API_CONFIG.BACKOFF_FACTOR, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
};

/**
 * Determine if error should trigger retry
 */
const shouldRetry = (error: AxiosError, attempt: number): boolean => {
  if (attempt >= API_CONFIG.MAX_RETRIES) return false;
  
  // Network errors
  if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') return true;
  
  // Specific status codes
  if (error.response?.status && API_CONFIG.RETRY_STATUS_CODES.includes(error.response.status as any)) {
    return true;
  }
  
  // Rate limiting - always retry with longer delay
  if (error.response?.status === 429) return true;
  
  return false;
};

/**
 * Convert file to base64 for image upload
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Parse API error response
 */
const parseApiError = (error: AxiosError): ApiClientError => {
  const response = error.response;
  
  if (!response) {
    // Network error
    return new ApiClientError(
      'Network error - please check your connection',
      0,
      'NETWORK_ERROR',
      error.message
    );
  }

  const status = response.status;
  const data = response.data as any;

  // Handle different error response formats
  if (data?.error && data?.message) {
    // Standard ErrorResponse format
    const errorData = data as ErrorResponse;
    return new ApiClientError(
      errorData.message,
      status,
      errorData.error,
      errorData.detail,
      errorData.request_id || undefined
    );
  }

  if (data?.detail && Array.isArray(data.detail)) {
    // Validation error format (422)
    const validationError = data as HTTPValidationError;
    const firstError = validationError.detail[0];
    return new ApiClientError(
      `Validation error: ${firstError.msg}`,
      status,
      'VALIDATION_ERROR',
      validationError.detail
    );
  }

  // Generic error
  const message = data?.message || data?.detail || error.message || 'Unknown error occurred';
  return new ApiClientError(message, status, 'API_ERROR', data);
};

// ========== TOKEN MANAGEMENT ==========

class TokenManager {
  private static TOKEN_KEY = 'veo_auth_token';
  
  static getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }
  
  static setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.warn('Failed to store auth token:', error);
    }
  }
  
  static removeToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to remove auth token:', error);
    }
  }
  
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true; // Assume expired if we can't parse
    }
  }
}

// ========== API CLIENT CLASS ==========

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}`,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': API_CONFIG.CONTENT_TYPE,
        'Accept': API_CONFIG.ACCEPT,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const requestConfig = config as InternalAxiosRequestConfig & RequestConfig;
        
        // Skip auth for certain endpoints
        if (requestConfig.skipAuth) {
          return config;
        }

        const token = TokenManager.getToken();
        if (token && !TokenManager.isTokenExpired(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle auth errors and retries
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & RequestConfig & {
          _retry?: boolean;
          _retryAttempt?: number;
        };

        // Handle 401 - token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          TokenManager.removeToken();
          
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth';
          }
          
          return Promise.reject(parseApiError(error));
        }

        // Handle retries for eligible errors
        if (!originalRequest.skipRetry && shouldRetry(error, originalRequest._retryAttempt || 0)) {
          const attempt = (originalRequest._retryAttempt || 0) + 1;
          originalRequest._retryAttempt = attempt;

          const delay = error.response?.status === 429 
            ? 5000 + (attempt * 2000) // Longer delay for rate limiting
            : calculateRetryDelay(attempt, API_CONFIG.RETRY_DELAY);

          console.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${API_CONFIG.MAX_RETRIES})`);
          
          await sleep(delay);
          return this.instance(originalRequest);
        }

        return Promise.reject(parseApiError(error));
      }
    );
  }

  // ========== HTTP METHODS ==========

  async get<T = any>(
    url: string, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.get<T>(url, config);
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    };
  }

  async post<T = any>(
    url: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.post<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    };
  }

  async put<T = any>(
    url: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.put<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    };
  }

  async delete<T = any>(
    url: string, 
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<T>(url, config);
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    };
  }

  // ========== FILE UPLOAD ==========

  async uploadFile<T = any>(
    url: string,
    file: File,
    fieldName = 'file',
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const uploadConfig: RequestConfig = {
      ...config,
      timeout: API_CONFIG.UPLOAD_TIMEOUT,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (config?.uploadProgress && progressEvent.total) {
          const progress: UploadProgress = {
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          };
          config.uploadProgress(progress);
        }
      },
    };

    const response = await this.instance.post<T>(url, formData, uploadConfig);
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    };
  }

  // ========== DOWNLOAD ==========

  async downloadFile(url: string, filename?: string, config?: RequestConfig): Promise<void> {
    const response = await this.instance.get(url, {
      ...config,
      responseType: 'blob',
      timeout: API_CONFIG.UPLOAD_TIMEOUT, // Longer timeout for downloads
    });

    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || `download-${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // ========== UTILITIES ==========

  setAuthToken(token: string): void {
    TokenManager.setToken(token);
  }

  clearAuthToken(): void {
    TokenManager.removeToken();
  }

  getAuthToken(): string | null {
    return TokenManager.getToken();
  }

  isAuthenticated(): boolean {
    const token = TokenManager.getToken();
    return token ? !TokenManager.isTokenExpired(token) : false;
  }

  // Get base URL for debugging/development
  getBaseUrl(): string {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}`;
  }

  // ========== BLOB DOWNLOAD ==========

  async downloadBlob(url: string, config?: RequestConfig): Promise<Blob> {
    const response = await this.instance.get(url, {
      ...config,
      responseType: 'blob',
      timeout: API_CONFIG.UPLOAD_TIMEOUT, // Longer timeout for downloads
    });

    return response.data;
  }

  // ========== SERVER-SENT EVENTS ==========

  createEventSource(url: string): EventSource | null {
    try {
      const fullUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${url}`;
      const token = TokenManager.getToken();
      
      // Note: EventSource doesn't support custom headers directly
      // For production, backend should support token via query param or cookie
      const urlWithAuth = token ? `${fullUrl}?token=${encodeURIComponent(token)}` : fullUrl;
      
      return new EventSource(urlWithAuth);
    } catch (error) {
      console.warn('EventSource creation failed:', error);
      return null;
    }
  }
}

// ========== SINGLETON EXPORT ==========

export const apiClient = new ApiClient();
export default apiClient;

// Export utilities
export { TokenManager };
export type { RequestConfig };
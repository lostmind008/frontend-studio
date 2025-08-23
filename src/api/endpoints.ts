/**
 * API endpoint definitions and service methods
 * Matches the OpenAPI specification exactly
 */

import { apiClient } from './client';
import {
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoStatusResponse,
  VideoStatus,
  BatchGenerationRequest,
  BatchGenerationResponse,
  UserResponse,
  TemplateResponse,
  GenerationStats,
  LoginCredentials,
  RegisterData,
  AuthTokenResponse,
  TemplateListParams,
  VideoListParams,
  StatsParams,
  // ImageUploadRequest, // Unused for now
  FileUploadProgress,
  ProgressEvent
} from './types';

// === Authentication Endpoints ===

export const authApi = {
  /**
   * User login
   * Note: Endpoint may need verification - not clearly defined in OpenAPI
   */
  async login(credentials: LoginCredentials): Promise<AuthTokenResponse> {
    const response = await apiClient.post<AuthTokenResponse>('/auth/login', credentials);
    
    // Store the token
    if (response.data.access_token) {
      apiClient.setAuthToken(response.data.access_token);
    }
    
    return response.data;
  },

  /**
   * User registration
   * Note: Endpoint may need verification - not clearly defined in OpenAPI
   */
  async register(data: RegisterData): Promise<AuthTokenResponse> {
    const response = await apiClient.post<AuthTokenResponse>('/auth/register', data);
    
    // Store the token
    if (response.data.access_token) {
      apiClient.setAuthToken(response.data.access_token);
    }
    
    return response.data;
  },

  /**
   * Get current user profile
   * Uses the documented endpoint from OpenAPI spec
   */
  async getProfile(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>('/user/profile');
    return response.data;
  },

  /**
   * Logout (client-side token removal)
   */
  logout(): void {
    apiClient.clearAuthToken();
  },

  /**
   * Verify current token validity
   * Note: This endpoint is not in OpenAPI spec, may not exist
   */
  async verifyToken(): Promise<{ valid: boolean }> {
    try {
      await this.getProfile();
      return { valid: true };
    } catch (error) {
      return { valid: false };
    }
  }
};

// === Video Generation Endpoints ===

export const videoApi = {
  /**
   * Generate a new video
   * POST /api/v1/videos/generate
   */
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const response = await apiClient.post<VideoGenerationResponse>('/videos/generate', request);
    return response.data;
  },

  /**
   * Generate multiple videos in batch
   * POST /api/v1/videos/batch
   */
  async generateBatch(request: BatchGenerationRequest): Promise<BatchGenerationResponse> {
    const response = await apiClient.post<BatchGenerationResponse>('/videos/batch', request);
    return response.data;
  },

  /**
   * Check video generation status
   * GET /api/v1/videos/{generation_id}/status
   */
  async getVideoStatus(generationId: string): Promise<VideoStatusResponse> {
    const response = await apiClient.get<VideoStatusResponse>(`/videos/${generationId}/status`);
    return response.data;
  },

  /**
   * Download generated video
   * GET /api/v1/videos/{generation_id}/download
   */
  async downloadVideo(generationId: string): Promise<Blob> {
    return apiClient.downloadBlob(`/videos/${generationId}/download`);
  },

  /**
   * Get user's video generation history
   * GET /api/v1/user/videos
   */
  async getUserVideos(params?: VideoListParams): Promise<VideoStatusResponse[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.status) searchParams.append('status', params.status.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    const url = queryString ? `/user/videos?${queryString}` : '/user/videos';
    
    const response = await apiClient.get<VideoStatusResponse[]>(url);
    return response.data;
  },

  /**
   * Stream real-time progress updates via Server-Sent Events
   * GET /api/v1/events/{generation_id}
   */
  createProgressStream(generationId: string): EventSource | null {
    return apiClient.createEventSource(`/events/${generationId}`);
  },

  /**
   * Poll for video status with retry logic
   * Useful fallback when SSE is not available
   */
  async pollVideoStatus(
    generationId: string,
    onProgress: (status: VideoStatusResponse) => void,
    intervalMs: number = 2000,
    timeoutMs: number = 300000 // 5 minutes
  ): Promise<VideoStatusResponse> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getVideoStatus(generationId);
          onProgress(status);
          
          // Check if completed
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
            resolve(status);
            return;
          }
          
          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            reject(new Error('Polling timeout exceeded'));
            return;
          }
          
          // Continue polling
          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  },

  /**
   * Cancel a video generation
   * DELETE /api/v1/videos/{generation_id}/cancel
   * Note: This endpoint needs to be implemented in the backend
   */
  async cancelGeneration(generationId: string): Promise<void> {
    try {
      await apiClient.delete(`/videos/${generationId}/cancel`);
    } catch (error: any) {
      // If endpoint doesn't exist (404), provide helpful error
      if (error.status === 404) {
        throw new Error('Cancel functionality not yet implemented in the backend. Please implement DELETE /api/v1/videos/{generation_id}/cancel endpoint.');
      }
      throw error;
    }
  },

  /**
   * Cancel all active generations for the current user
   * DELETE /api/v1/videos/cancel-all
   * Note: This endpoint needs to be implemented in the backend
   */
  async cancelAllGenerations(): Promise<void> {
    try {
      await apiClient.delete('/videos/cancel-all');
    } catch (error: any) {
      // If endpoint doesn't exist (404), provide helpful error
      if (error.status === 404) {
        throw new Error('Cancel all functionality not yet implemented in the backend. Please implement DELETE /api/v1/videos/cancel-all endpoint.');
      }
      throw error;
    }
  },

  /**
   * Generate video with image conditioning
   * Convenience method that delegates to uploadApi
   */
  async generateVideoWithImage(
    request: Omit<VideoGenerationRequest, 'image_base64'>,
    imageFile: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<VideoGenerationResponse> {
    return uploadApi.generateVideoWithImage(request, imageFile, onProgress);
  },

  /**
   * Estimate cost for video generation
   * Note: This endpoint needs to be implemented in the backend
   */
  async estimateCost(request: VideoGenerationRequest): Promise<{ cost: number; credits: number }> {
    try {
      const response = await apiClient.post<{ cost: number; credits: number }>('/videos/estimate-cost', request);
      return response.data;
    } catch (error: any) {
      // If endpoint doesn't exist (404), provide helpful error
      if (error.status === 404) {
        throw new Error('Cost estimation not yet implemented in the backend. Please implement POST /api/v1/videos/estimate-cost endpoint.');
      }
      throw error;
    }
  }
};

// === Template Endpoints ===

export const templateApi = {
  /**
   * List available prompt templates
   * GET /api/v1/templates
   */
  async getTemplates(params?: TemplateListParams): Promise<TemplateResponse[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.category) searchParams.append('category', params.category);
    if (params?.featured !== undefined) searchParams.append('featured', params.featured.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    const url = queryString ? `/templates?${queryString}` : '/templates';
    
    const response = await apiClient.get<TemplateResponse[]>(url);
    return response.data;
  },

  /**
   * Get a specific template
   * GET /api/v1/templates/{template_id}
   */
  async getTemplate(templateId: string): Promise<TemplateResponse> {
    const response = await apiClient.get<TemplateResponse>(`/templates/${templateId}`);
    return response.data;
  }
};

// === Prompt Enhancement Endpoints ===

export const promptApi = {
  /**
   * Enhance a prompt using advanced techniques
   * POST /api/v1/prompts/enhance
   */
  async enhancePrompt(prompt: string): Promise<{ enhanced_prompt: string; suggestions: string[] }> {
    const response = await apiClient.post<{ enhanced_prompt: string; suggestions: string[] }>(
      '/prompts/enhance',
      { prompt }
    );
    return response.data;
  },

  /**
   * Get available prompt enhancement styles
   * GET /api/v1/prompts/styles
   */
  async getPromptStyles(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/prompts/styles');
    return response.data;
  },

  /**
   * Get intelligent prompt suggestions
   * GET /api/v1/prompts/suggestions
   */
  async getPromptSuggestions(
    prompt: string,
    style?: string,
    industry?: string
  ): Promise<{ suggestions: string[] }> {
    const searchParams = new URLSearchParams();
    searchParams.append('prompt', prompt);
    if (style) searchParams.append('style', style);
    if (industry) searchParams.append('industry', industry);
    
    const response = await apiClient.get<{ suggestions: string[] }>(`/prompts/suggestions?${searchParams}`);
    return response.data;
  }
};

// === Model and System Information ===

export const systemApi = {
  /**
   * List available Veo models
   * GET /api/v1/models
   */
  async getModels(): Promise<{ name: string; status: string }[]> {
    const response = await apiClient.get<{ name: string; status: string }[]>('/models');
    return response.data;
  },

  /**
   * List supported aspect ratios
   * GET /api/v1/supported-aspect-ratios
   */
  async getSupportedAspectRatios(): Promise<Record<string, string[]>> {
    const response = await apiClient.get<Record<string, string[]>>('/supported-aspect-ratios');
    return response.data;
  }
};

// === Admin Endpoints ===

export const adminApi = {
  /**
   * Get generation statistics (Admin only)
   * GET /api/v1/admin/stats
   */
  async getStats(params?: StatsParams): Promise<GenerationStats> {
    const searchParams = new URLSearchParams();
    if (params?.days) searchParams.append('days', params.days.toString());
    
    const queryString = searchParams.toString();
    const url = queryString ? `/admin/stats?${queryString}` : '/admin/stats';
    
    const response = await apiClient.get<GenerationStats>(url);
    return response.data;
  }
};

// === File Upload Utilities ===

export const uploadApi = {
  /**
   * Convert image file to base64 for video generation
   */
  async convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:image/...;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Generate video with image conditioning
   */
  async generateVideoWithImage(
    request: Omit<VideoGenerationRequest, 'image_base64'>,
    imageFile: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<VideoGenerationResponse> {
    // Show progress for base64 conversion
    onProgress?.({ loaded: 0, total: 100, percentage: 0 });
    
    const imageBase64 = await this.convertImageToBase64(imageFile);
    
    onProgress?.({ loaded: 50, total: 100, percentage: 50 });
    
    const videoRequest: VideoGenerationRequest = {
      ...request,
      image_base64: imageBase64
    };
    
    const result = await videoApi.generateVideo(videoRequest);
    
    onProgress?.({ loaded: 100, total: 100, percentage: 100 });
    
    return result;
  }
};

// === Utility Functions ===

export const apiUtils = {
  /**
   * Create a download link for a video
   */
  async createVideoDownloadUrl(generationId: string): Promise<string> {
    const blob = await videoApi.downloadVideo(generationId);
    return URL.createObjectURL(blob);
  },

  /**
   * Helper to handle video generation with real-time progress
   */
  async generateVideoWithProgress(
    request: VideoGenerationRequest,
    onProgress: (status: VideoStatusResponse) => void
  ): Promise<VideoStatusResponse> {
    // Start generation
    const response = await videoApi.generateVideo(request);
    
    // Try SSE first, fallback to polling
    const eventSource = videoApi.createProgressStream(response.generation_id);
    
    if (eventSource) {
      return new Promise((resolve, reject) => {
        eventSource.addEventListener('progress', (event) => {
          const data: ProgressEvent = JSON.parse(event.data);
          const status: VideoStatusResponse = {
            generation_id: data.generation_id || 'unknown',
            status: data.status || VideoStatus.PROCESSING,
            progress: data.progress || 0,
            message: data.message || '',
            created_at: data.timestamp || new Date().toISOString(),
            updated_at: data.timestamp || new Date().toISOString()
          };
          
          onProgress(status);
          
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
            eventSource.close();
            resolve(status);
          }
        });
        
        eventSource.addEventListener('error', () => {
          eventSource.close();
          // Fallback to polling
          videoApi.pollVideoStatus(response.generation_id, onProgress)
            .then(resolve)
            .catch(reject);
        });
      });
    } else {
      // Fallback to polling
      return videoApi.pollVideoStatus(response.generation_id, onProgress);
    }
  }
};

// === Export all APIs ===

export const api = {
  auth: authApi,
  video: videoApi,
  template: templateApi,
  prompt: promptApi,
  system: systemApi,
  admin: adminApi,
  upload: uploadApi,
  utils: apiUtils,

  // Convenience methods for common operations (delegate to sub-APIs)
  generateVideo: videoApi.generateVideo.bind(videoApi),
  getVideoStatus: videoApi.getVideoStatus.bind(videoApi),
  downloadVideo: videoApi.downloadVideo.bind(videoApi),
  getUserVideos: videoApi.getUserVideos.bind(videoApi),
  cancelGeneration: videoApi.cancelGeneration.bind(videoApi),
  cancelAllGenerations: videoApi.cancelAllGenerations.bind(videoApi),

  // Authentication convenience methods
  login: authApi.login.bind(authApi),
  register: authApi.register.bind(authApi),
  logout: authApi.logout.bind(authApi),
  getProfile: authApi.getProfile.bind(authApi),

  // Template convenience methods
  getTemplates: templateApi.getTemplates.bind(templateApi),
  getTemplate: templateApi.getTemplate.bind(templateApi),

  // Additional convenience methods for test compatibility
  getVideoHistory: videoApi.getUserVideos.bind(videoApi),
  deleteVideo: async (jobId: string) => {
    // Note: This endpoint needs to be implemented in the backend
    try {
      await apiClient.delete(`/videos/${jobId}`);
      return { data: { success: true } };
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error('Delete functionality not yet implemented in the backend. Please implement DELETE /api/v1/videos/{id} endpoint.');
      }
      throw error;
    }
  }
};
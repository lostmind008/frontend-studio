/**
 * Video service layer for video generation workflows
 * Provides high-level abstractions over the API client
 */

import { apiClient, fileToBase64 } from '../api/client';
import { 
  VideoGenerationRequest, 
  VideoGenerationResponse,
  VideoStatusResponse, 
  VideoStatus,
  UserVideosResponse,
  VideoListParams,
  ApiResponse,
  UploadProgress 
} from '../api/types';
import { trackGenerateStart, trackGenerateComplete } from '../lib/analytics';

// ========== CONFIGURATION ==========

const POLLING_CONFIG = {
  DEFAULT_INTERVAL: 10000,     // 10 seconds - optimized for Veo generation latency (60-90s typical)
  MAX_INTERVAL: 30000,         // 30 seconds max - balances responsiveness with server load
  BACKOFF_MULTIPLIER: 1.5,     // Gradual backoff - proven effective, unchanged
  MAX_POLLING_TIME: 900000,    // 15 minutes max - accommodates longest Veo generation scenarios
  COMPLETION_STATES: ['completed', 'failed', 'cancelled'] as VideoStatus[]
};

// ========== TYPES ==========

export interface VideoGenerationOptions {
  enableRealTime?: boolean;     // Use SSE if available
  pollInterval?: number;        // Polling interval if SSE not available
  maxPollTime?: number;         // Max time to poll
  onProgress?: (progress: VideoStatusResponse) => void;
  onUploadProgress?: (progress: UploadProgress) => void;
}

export interface BatchGenerationOptions extends VideoGenerationOptions {
  concurrency?: number;         // Max concurrent generations
  continueOnError?: boolean;    // Continue batch if individual generation fails
}

export interface ProgressEventData {
  generation_id: string;
  status: VideoStatus;
  progress?: number;
  message: string;
  video_url?: string;
  error_details?: string;
}

// ========== VIDEO SERVICE CLASS ==========

class VideoService {
  private activeEventSources = new Map<string, EventSource>();
  private activePolls = new Map<string, NodeJS.Timeout>();
  private generationStartTimes = new Map<string, number>();

  // ========== GENERATION METHODS ==========

  /**
   * Generate video from text prompt
   */
  async generateVideo(
    request: VideoGenerationRequest, 
    options: VideoGenerationOptions = {}
  ): Promise<VideoStatusResponse> {
    // Track generation start
    trackGenerateStart({
      prompt: request.prompt,
      duration: request.duration,
      hasImage: !!request.image_base64
    });

    // Start generation
    const response: ApiResponse<VideoGenerationResponse> = await apiClient.post(
      '/videos/generate',
      request
    );

    const generationId = response.data.generation_id;
    
    // Store start time for completion tracking
    this.generationStartTimes.set(generationId, Date.now());

    // Start progress tracking if requested
    if (options.onProgress) {
      if (options.enableRealTime !== false) {
        this.startProgressTracking(generationId, options);
      } else {
        this.startPolling(generationId, options);
      }
    }

    // Return initial status
    return this.getVideoStatus(generationId);
  }

  /**
   * Generate video with image conditioning
   */
  async generateVideoWithImage(
    request: Omit<VideoGenerationRequest, 'image_base64'>,
    imageFile: File,
    options: VideoGenerationOptions = {}
  ): Promise<VideoStatusResponse> {
    // Convert image to base64
    const imageBase64 = await fileToBase64(imageFile);
    
    // Create full request with image
    const fullRequest: VideoGenerationRequest = {
      ...request,
      image_base64: imageBase64
    };

    // Track upload progress if callback provided
    if (options.onUploadProgress) {
      // Simulate upload progress for base64 conversion
      options.onUploadProgress({ loaded: imageFile.size, total: imageFile.size, percentage: 100 });
    }

    return this.generateVideo(fullRequest, options);
  }

  /**
   * Generate multiple videos concurrently
   */
  async generateBatch(
    requests: VideoGenerationRequest[],
    options: BatchGenerationOptions = {}
  ): Promise<VideoStatusResponse[]> {
    const {
      concurrency = 3,
      continueOnError = true,
      ...baseOptions
    } = options;

    const results: VideoStatusResponse[] = [];
    const errors: string[] = [];

    // Process in batches
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (request, index) => {
        try {
          return await this.generateVideo(request, baseOptions);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Generation failed';
          errors.push(`Request ${i + index + 1}: ${errorMessage}`);
          
          if (!continueOnError) {
            throw error;
          }
          
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(Boolean) as VideoStatusResponse[]);
    }

    // Report any errors
    if (errors.length > 0 && !continueOnError) {
      throw new Error(`Batch generation failed: ${errors.join(', ')}`);
    }

    return results;
  }

  // ========== STATUS AND HISTORY ==========

  /**
   * Get video generation status
   */
  async getVideoStatus(generationId: string): Promise<VideoStatusResponse> {
    const response: ApiResponse<VideoStatusResponse> = await apiClient.get(
      `/videos/${generationId}/status`
    );
    return response.data;
  }


  /**
   * Download video file
   */
  async downloadVideo(generationId: string, filename?: string): Promise<void> {
    const url = `/videos/${generationId}/download`;
    await apiClient.downloadFile(url, filename);
  }

  /**
   * Delete video from history
   */
  async deleteVideo(generationId: string): Promise<void> {
    await apiClient.delete(`/videos/${generationId}`);
  }

  /**
   * Get user's video history with optional filtering
   */
  async getVideoHistory(params?: VideoListParams): Promise<UserVideosResponse> {
    const response = await apiClient.get<UserVideosResponse>('/user/videos', { params });
    return response.data;
  }

  // ========== PROGRESS TRACKING ==========

  /**
   * Start real-time progress tracking via Server-Sent Events
   */
  private startProgressTracking(
    generationId: string, 
    options: VideoGenerationOptions
  ): void {
    const baseUrl = apiClient.getBaseUrl().replace('/api/v1', '');
    const url = `${baseUrl}/api/v1/events/${generationId}`;
    
    try {
      const eventSource = new EventSource(url, {
        withCredentials: true
      });

      // Add auth header if possible (note: EventSource doesn't support custom headers directly)
      const token = apiClient.getAuthToken();
      if (token) {
        // For production, backend should support token via query param or cookie
        // eventSource.url += `?token=${token}`;
      }

      eventSource.onmessage = (event) => {
        try {
          const data: ProgressEventData = JSON.parse(event.data);
          
          // Convert to VideoStatusResponse format for consistent handling
          const progress: VideoStatusResponse = {
            generation_id: data.generation_id,
            status: data.status,
            progress: data.progress || 0,
            message: data.message,
            video_url: data.video_url || null,
            thumbnail_url: null,
            duration_seconds: null,
            resolution: null,
            file_size_bytes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            completed_at: data.status === 'completed' ? new Date().toISOString() : null,
            error_details: data.error_details || null
          };
          
          if (options.onProgress) {
            options.onProgress(progress);
          }

          // Close connection when complete
          if (POLLING_CONFIG.COMPLETION_STATES.includes(data.status)) {
            this.trackCompletionEvent(generationId, progress);
            this.stopProgressTracking(generationId);
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.warn('SSE connection error, falling back to polling:', error);
        this.stopProgressTracking(generationId);
        this.startPolling(generationId, options);
      };

      this.activeEventSources.set(generationId, eventSource);
    } catch (error) {
      console.warn('SSE not supported, falling back to polling:', error);
      this.startPolling(generationId, options);
    }
  }

  /**
   * Start polling for progress updates (fallback for SSE)
   */
  private startPolling(
    generationId: string, 
    options: VideoGenerationOptions
  ): void {
    const interval = options.pollInterval || POLLING_CONFIG.DEFAULT_INTERVAL;
    const maxTime = options.maxPollTime || POLLING_CONFIG.MAX_POLLING_TIME;
    const startTime = Date.now();
    let currentInterval = interval;

    const poll = async () => {
      try {
        const status = await this.getVideoStatus(generationId);
        
        if (options.onProgress) {
          options.onProgress(status);
        }

        // Stop polling if complete or timed out
        if (POLLING_CONFIG.COMPLETION_STATES.includes(status.status)) {
          this.trackCompletionEvent(generationId, status);
          this.stopPolling(generationId);
          return;
        }

        if (Date.now() - startTime > maxTime) {
          console.warn(`Polling timeout for generation ${generationId}`);
          this.stopPolling(generationId);
          return;
        }

        // Gradual backoff for longer operations
        currentInterval = Math.min(
          currentInterval * POLLING_CONFIG.BACKOFF_MULTIPLIER,
          POLLING_CONFIG.MAX_INTERVAL
        );

        // Schedule next poll
        const timeoutId = setTimeout(poll, currentInterval);
        this.activePolls.set(generationId, timeoutId);
      } catch (error) {
        console.error('Polling error:', error);
        this.stopPolling(generationId);
      }
    };

    // Start first poll
    const timeoutId = setTimeout(poll, interval);
    this.activePolls.set(generationId, timeoutId);
  }

  /**
   * Stop progress tracking for a generation
   */
  stopProgressTracking(generationId: string): void {
    // Stop SSE
    const eventSource = this.activeEventSources.get(generationId);
    if (eventSource) {
      eventSource.close();
      this.activeEventSources.delete(generationId);
    }

    // Stop polling
    this.stopPolling(generationId);
  }

  /**
   * Stop polling for a generation
   */
  private stopPolling(generationId: string): void {
    const timeoutId = this.activePolls.get(generationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activePolls.delete(generationId);
    }
  }

  /**
   * Track video generation completion event
   */
  private trackCompletionEvent(generationId: string, status: VideoStatusResponse): void {
    const startTime = this.generationStartTimes.get(generationId);
    const success = status.status === 'completed';
    
    // Calculate generation time if start time is available
    const generationTime = startTime ? Date.now() - startTime : undefined;
    
    // Track completion event
    trackGenerateComplete({
      success,
      generationTime,
      fileSize: status.file_size_bytes || undefined,
      generationId
    });
    
    // Clean up stored start time
    this.generationStartTimes.delete(generationId);
  }

  /**
   * Cancel video generation
   */
  async cancelGeneration(generationId: string): Promise<void> {
    // Stop tracking first
    this.stopProgressTracking(generationId);
    
    // Send cancel request to backend
    await apiClient.post(`/videos/cancel/${generationId}`);
  }

  /**
   * Retry failed generation
   */
  async retryGeneration(generationId: string): Promise<VideoStatusResponse> {
    const response: ApiResponse<VideoGenerationResponse> = await apiClient.post(
      `/videos/retry/${generationId}`
    );
    
    return this.getVideoStatus(response.data.generation_id);
  }

  // ========== UTILITIES ==========

  /**
   * Clean up all active connections
   */
  cleanup(): void {
    // Close all event sources
    this.activeEventSources.forEach(eventSource => eventSource.close());
    this.activeEventSources.clear();

    // Clear all polls
    this.activePolls.forEach(timeoutId => clearTimeout(timeoutId));
    this.activePolls.clear();
    
    // Clear generation start times
    this.generationStartTimes.clear();
  }

  /**
   * Get download URL for a video
   */
  getDownloadUrl(generationId: string): string {
    const baseUrl = apiClient.getBaseUrl();
    return `${baseUrl}/videos/${generationId}/download`;
  }

  /**
   * Validate video generation request
   */
  validateRequest(request: VideoGenerationRequest): string[] {
    const errors: string[] = [];

    if (!request.prompt || request.prompt.length < 3) {
      errors.push('Prompt must be at least 3 characters long');
    }

    if (request.prompt && request.prompt.length > 5000) {
      errors.push('Prompt must be less than 5000 characters');
    }

    if (request.duration && (request.duration < 5 || request.duration > 8)) {
      errors.push('Duration must be between 5 and 8 seconds');
    }

    return errors;
  }

  /**
   * Check if generation is in progress
   */
  isGenerationActive(status: VideoStatus): boolean {
    return ['pending', 'processing'].includes(status);
  }

  /**
   * Check if generation is complete
   */
  isGenerationComplete(status: VideoStatus): boolean {
    return POLLING_CONFIG.COMPLETION_STATES.includes(status);
  }
}

// ========== SINGLETON EXPORT ==========

export const videoService = new VideoService();
export default videoService;

// Export utilities and types for external usage
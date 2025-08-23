/**
 * Video Generation Service
 * High-level service for video generation workflows
 */

import { api } from '../api/endpoints';
import {
  VideoGenerationRequest,
  VideoStatusResponse,
  VideoStatus,
  FileUploadProgress
} from '../api/types';

export interface VideoGenerationOptions {
  /** Enable real-time progress updates */
  enableRealTimeProgress?: boolean;
  /** Polling interval in milliseconds (fallback) */
  pollingInterval?: number;
  /** Timeout for generation in milliseconds */
  timeout?: number;
  /** Callback for progress updates */
  onProgress?: (status: VideoStatusResponse) => void;
  /** Callback for status changes */
  onStatusChange?: (status: VideoStatus) => void;
  /** Callback for completion */
  onComplete?: (status: VideoStatusResponse) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
}

export interface BatchGenerationOptions extends VideoGenerationOptions {
  /** Maximum concurrent generations */
  maxConcurrent?: number;
  /** Callback for individual video completion */
  onVideoComplete?: (index: number, status: VideoStatusResponse) => void;
}

export class VideoGenerationService {
  private activeGenerations = new Map<string, AbortController>();
  private eventSources = new Map<string, EventSource>();

  /**
   * Generate a single video with comprehensive progress tracking
   */
  async generateVideo(
    request: VideoGenerationRequest,
    options: VideoGenerationOptions = {}
  ): Promise<VideoStatusResponse> {
    const {
      enableRealTimeProgress = true,
      pollingInterval = 2000,
      timeout = 300000, // 5 minutes
      onProgress,
      onStatusChange,
      onComplete,
      onError
    } = options;

    try {
      // Start generation
      const response = await api.video.generateVideo(request);
      const generationId = response.generation_id;

      // Create abort controller for this generation
      const abortController = new AbortController();
      this.activeGenerations.set(generationId, abortController);

      // Set up progress tracking
      const finalStatus = await this.trackProgress(
        generationId,
        {
          enableRealTimeProgress,
          pollingInterval,
          timeout,
          onProgress,
          onStatusChange,
          abortController
        }
      );

      // Clean up
      this.cleanup(generationId);

      // Call completion callback
      onComplete?.(finalStatus);

      return finalStatus;

    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Generate video with image conditioning
   */
  async generateVideoWithImage(
    request: Omit<VideoGenerationRequest, 'image_base64'>,
    imageFile: File,
    options: VideoGenerationOptions & {
      onUploadProgress?: (progress: FileUploadProgress) => void;
    } = {}
  ): Promise<VideoStatusResponse> {
    const { onUploadProgress, ...videoOptions } = options;

    try {
      // Generate with image upload progress
      const response = await api.upload.generateVideoWithImage(
        request,
        imageFile,
        onUploadProgress
      );

      // Track progress as normal
      return this.trackVideoGeneration(response.generation_id, videoOptions);

    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Generate multiple videos with batch optimization
   */
  async generateBatch(
    requests: VideoGenerationRequest[],
    options: BatchGenerationOptions = {}
  ): Promise<VideoStatusResponse[]> {
    const {
      maxConcurrent = 10,
      onVideoComplete,
      ...baseOptions
    } = options;

    // Use batch API if available and within limits
    if (requests.length <= maxConcurrent) {
      try {
        const batchResponse = await api.video.generateBatch({
          requests: requests,
          batch_name: `batch_${Date.now()}`,
          priority: 1
        });

        // Track all videos in parallel
        const trackingPromises = batchResponse.generation_ids.map((id, index) =>
          this.trackVideoGeneration(id, {
            ...baseOptions,
            onComplete: (status) => {
              onVideoComplete?.(index, status);
              baseOptions.onComplete?.(status);
            }
          })
        );

        return Promise.all(trackingPromises);

      } catch (error) {
        // Fallback to individual generation
        console.warn('Batch generation failed, falling back to individual requests:', error);
      }
    }

    // Fallback: Generate videos individually with concurrency control
    return this.generateConcurrent(requests, { maxConcurrent, onVideoComplete, ...baseOptions });
  }

  /**
   * Generate videos with controlled concurrency
   */
  private async generateConcurrent(
    requests: VideoGenerationRequest[],
    options: BatchGenerationOptions
  ): Promise<VideoStatusResponse[]> {
    const { maxConcurrent = 5, onVideoComplete, ...baseOptions } = options;
    const results: VideoStatusResponse[] = new Array(requests.length);
    const inProgress = new Set<number>();
    let nextIndex = 0;

    return new Promise((resolve, reject) => {
      const startNext = async () => {
        if (nextIndex >= requests.length) {
          return;
        }

        const currentIndex = nextIndex++;
        inProgress.add(currentIndex);

        try {
          const result = await this.generateVideo(requests[currentIndex], {
            ...baseOptions,
            onComplete: (status) => {
              results[currentIndex] = status;
              onVideoComplete?.(currentIndex, status);
              inProgress.delete(currentIndex);

              // Check if all completed
              if (inProgress.size === 0 && nextIndex >= requests.length) {
                resolve(results);
              } else {
                startNext(); // Start next generation
              }
            }
          });

          results[currentIndex] = result;

        } catch (error) {
          inProgress.delete(currentIndex);
          reject(error);
        }
      };

      // Start initial concurrent generations
      for (let i = 0; i < Math.min(maxConcurrent, requests.length); i++) {
        startNext();
      }
    });
  }

  /**
   * Track progress for an existing generation
   */
  async trackVideoGeneration(
    generationId: string,
    options: VideoGenerationOptions = {}
  ): Promise<VideoStatusResponse> {
    const abortController = new AbortController();
    this.activeGenerations.set(generationId, abortController);

    try {
      const result = await this.trackProgress(generationId, {
        ...options,
        abortController
      });

      this.cleanup(generationId);
      return result;

    } catch (error) {
      this.cleanup(generationId);
      throw error;
    }
  }

  /**
   * Internal progress tracking with SSE and polling fallback
   */
  private async trackProgress(
    generationId: string,
    options: VideoGenerationOptions & {
      abortController?: AbortController;
    }
  ): Promise<VideoStatusResponse> {
    const {
      enableRealTimeProgress = true,
      pollingInterval = 2000,
      timeout = 300000,
      onProgress,
      onStatusChange,
      abortController
    } = options;

    // Try Server-Sent Events first
    if (enableRealTimeProgress) {
      try {
        const result = await this.trackWithSSE(generationId, {
          onProgress,
          onStatusChange,
          timeout,
          abortController
        });
        return result;
      } catch (error) {
        console.warn('SSE tracking failed, falling back to polling:', error);
      }
    }

    // Fallback to polling
    return this.trackWithPolling(generationId, {
      pollingInterval,
      timeout,
      onProgress,
      onStatusChange,
      abortController
    });
  }

  /**
   * Track progress using Server-Sent Events
   */
  private async trackWithSSE(
    generationId: string,
    options: {
      onProgress?: (status: VideoStatusResponse) => void;
      onStatusChange?: (status: VideoStatus) => void;
      timeout: number;
      abortController?: AbortController;
    }
  ): Promise<VideoStatusResponse> {
    const { onProgress, onStatusChange, timeout, abortController } = options;

    return new Promise((resolve, reject) => {
      const eventSource = api.video.createProgressStream(generationId);
      
      if (!eventSource) {
        reject(new Error('Failed to create SSE connection'));
        return;
      }

      this.eventSources.set(generationId, eventSource);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        eventSource.close();
        reject(new Error('Progress tracking timeout'));
      }, timeout);

      // Handle abort
      abortController?.signal.addEventListener('abort', () => {
        eventSource.close();
        clearTimeout(timeoutId);
        reject(new Error('Generation aborted'));
      });

      // Handle progress events
      eventSource.addEventListener('progress', (event) => {
        try {
          const data = JSON.parse(event.data);
          const status: VideoStatusResponse = {
            generation_id: data.generation_id,
            status: data.status,
            progress: data.progress,
            message: data.message,
            created_at: data.timestamp,
            updated_at: data.timestamp,
            video_url: data.video_url,
            thumbnail_url: data.thumbnail_url,
            duration_seconds: data.duration_seconds,
            resolution: data.resolution,
            file_size_bytes: data.file_size_bytes,
            completed_at: data.completed_at,
            error_details: data.error_details
          };

          onProgress?.(status);
          onStatusChange?.(status.status);

          // Check if completed
          if (['completed', 'failed', 'cancelled'].includes(status.status)) {
            eventSource.close();
            clearTimeout(timeoutId);
            resolve(status);
          }
        } catch (error) {
          console.error('Failed to parse SSE data:', error);
        }
      });

      eventSource.addEventListener('error', () => {
        eventSource.close();
        clearTimeout(timeoutId);
        reject(new Error('SSE connection failed'));
      });
    });
  }

  /**
   * Track progress using polling
   */
  private async trackWithPolling(
    generationId: string,
    options: {
      pollingInterval: number;
      timeout: number;
      onProgress?: (status: VideoStatusResponse) => void;
      onStatusChange?: (status: VideoStatus) => void;
      abortController?: AbortController;
    }
  ): Promise<VideoStatusResponse> {
    return api.video.pollVideoStatus(
      generationId,
      (status) => {
        options.onProgress?.(status);
        options.onStatusChange?.(status.status);
      },
      options.pollingInterval,
      options.timeout
    );
  }

  /**
   * Cancel an active generation
   */
  async cancelGeneration(generationId: string): Promise<void> {
    const abortController = this.activeGenerations.get(generationId);
    if (abortController) {
      abortController.abort();
    }
    this.cleanup(generationId);
  }

  /**
   * Cancel all active generations
   */
  async cancelAllGenerations(): Promise<void> {
    for (const [generationId] of this.activeGenerations) {
      await this.cancelGeneration(generationId);
    }
  }

  /**
   * Get status of all active generations
   */
  getActiveGenerations(): string[] {
    return Array.from(this.activeGenerations.keys());
  }

  /**
   * Clean up resources for a generation
   */
  private cleanup(generationId: string): void {
    // Close event source
    const eventSource = this.eventSources.get(generationId);
    if (eventSource) {
      eventSource.close();
      this.eventSources.delete(generationId);
    }

    // Remove abort controller
    this.activeGenerations.delete(generationId);
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    // Close all event sources
    for (const eventSource of this.eventSources.values()) {
      eventSource.close();
    }
    this.eventSources.clear();

    // Abort all active generations
    for (const abortController of this.activeGenerations.values()) {
      abortController.abort();
    }
    this.activeGenerations.clear();
  }
}

// Export singleton instance
export const videoService = new VideoGenerationService();
export default videoService;
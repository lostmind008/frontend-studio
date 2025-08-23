import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { videoService } from './videos';
import { apiClient, fileToBase64 } from '@/api/client';
import type { VideoGenerationRequest, VideoStatusResponse } from '@/api/types';
import { VideoStatus } from '@/api/types';

// Mock the API client
vi.mock('@/api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    downloadFile: vi.fn(),
    getBaseUrl: vi.fn(() => 'https://api.example.com/api/v1'),
    getAuthToken: vi.fn(() => 'mock-token' as string | null),
  },
  fileToBase64: vi.fn(),
}));

vi.mock('@/lib/analytics', () => ({
  trackGenerateStart: vi.fn(),
  trackGenerateComplete: vi.fn(),
  trackRetry503: vi.fn(),
}));

// Get mocked functions
const mockApiClient = vi.mocked(apiClient);

// Helper to create complete ApiResponse objects
const createMockApiResponse = <T>(data: T): any => ({
  data,
  status: 200,
  headers: {},
});

describe('Video Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    videoService.cleanup();
  });

  describe('generateVideo', () => {
    it('should generate video with valid request', async () => {
      const mockRequest: VideoGenerationRequest = {
        prompt: 'A beautiful sunset over mountains',
        duration: 5,
      };

      const mockResponse = createMockApiResponse({ generation_id: 'test-gen-123' });

      const mockStatus: VideoStatusResponse = {
        generation_id: 'test-gen-123',
        status: VideoStatus.PENDING,
        progress: 0,
        message: 'Generation started',
        video_url: null,
        thumbnail_url: null,
        duration_seconds: null,
        resolution: null,
        file_size_bytes: null,
        created_at: '2025-08-18T12:00:00Z',
        updated_at: '2025-08-18T12:00:00Z',
        completed_at: null,
        error_details: null,
      };

      mockApiClient.post.mockResolvedValue(mockResponse);
      mockApiClient.get.mockResolvedValue(createMockApiResponse(mockStatus));

      const result = await videoService.generateVideo(mockRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/videos/generate', mockRequest);
      expect(result).toEqual(mockStatus);
    });

    it('should validate request parameters', () => {
      const errors = videoService.validateRequest({
        prompt: 'A',  // Too short
        duration: 10, // Too long
      });

      expect(errors).toContain('Prompt must be at least 3 characters long');
      expect(errors).toContain('Duration must be between 5 and 8 seconds');
    });

    it('should validate prompt length limits', () => {
      const longPrompt = 'A'.repeat(5001);
      const errors = videoService.validateRequest({
        prompt: longPrompt,
        duration: 5,
      });

      expect(errors).toContain('Prompt must be less than 5000 characters');
    });

    it('should track analytics on generation start', async () => {
      const mockRequest: VideoGenerationRequest = {
        prompt: 'Test prompt',
        duration: 5,
        image_base64: 'test-base64-data',
      };

      mockApiClient.post.mockResolvedValue(createMockApiResponse({ generation_id: 'test-123' }));
      mockApiClient.get.mockResolvedValue(createMockApiResponse({ 
        generation_id: 'test-123', status: 'pending' 
      }));

      await videoService.generateVideo(mockRequest);

      const { trackGenerateStart } = await import('@/lib/analytics');
      expect(trackGenerateStart).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        duration: 5,
        hasImage: true,
      });
    });
  });

  describe('generateVideoWithImage', () => {
    it('should convert image file to base64 and generate', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockRequest = {
        prompt: 'A beautiful scene',
        duration: 5,
      };

      // Mock file conversion
      vi.mocked(fileToBase64).mockResolvedValue('base64-encoded-image');

      mockApiClient.post.mockResolvedValue(createMockApiResponse({ generation_id: 'test-456' }));
      mockApiClient.get.mockResolvedValue(createMockApiResponse({
        generation_id: 'test-456', status: 'pending'
      }));

      const result = await videoService.generateVideoWithImage(mockRequest, mockFile);

      expect(result.generation_id).toBe('test-456');
    });

    it('should track upload progress', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockRequest = { prompt: 'Test', duration: 5 };
      const progressCallback = vi.fn();

      vi.mocked(fileToBase64).mockResolvedValue('base64-data');

      mockApiClient.post.mockResolvedValue(createMockApiResponse({ generation_id: 'test' }));
      mockApiClient.get.mockResolvedValue(createMockApiResponse({ 
        generation_id: 'test', status: 'pending' 
      }));

      await videoService.generateVideoWithImage(mockRequest, mockFile, {
        onUploadProgress: progressCallback
      });

      expect(progressCallback).toHaveBeenCalledWith({
        loaded: mockFile.size,
        total: mockFile.size,
        percentage: 100
      });
    });
  });

  describe('generateBatch', () => {
    it('should process multiple requests concurrently', async () => {
      const requests: VideoGenerationRequest[] = [
        { prompt: 'Video 1', duration: 5 },
        { prompt: 'Video 2', duration: 6 },
        { prompt: 'Video 3', duration: 7 },
      ];

      mockApiClient.post.mockResolvedValue(createMockApiResponse({ generation_id: 'test' }));
      mockApiClient.get.mockResolvedValue(createMockApiResponse({
        generation_id: 'test', status: 'pending'
      }));

      const results = await videoService.generateBatch(requests, { concurrency: 2 });

      expect(results).toHaveLength(3);
      expect(mockApiClient.post).toHaveBeenCalledTimes(3);
    });

    it('should handle individual failures with continueOnError', async () => {
      const requests: VideoGenerationRequest[] = [
        { prompt: 'Video 1', duration: 5 },
        { prompt: 'Video 2', duration: 6 },
      ];

      mockApiClient.post
        .mockResolvedValueOnce(createMockApiResponse({ generation_id: 'success' }))
        .mockRejectedValueOnce(new Error('Generation failed'));

      mockApiClient.get.mockResolvedValue(createMockApiResponse({
        generation_id: 'success', status: 'pending'
      }));

      const results = await videoService.generateBatch(requests, { 
        continueOnError: true 
      });

      expect(results).toHaveLength(1);
    });
  });

  describe('Progress Tracking', () => {
    it('should start SSE progress tracking', async () => {
      const progressCallback = vi.fn();
      const generationId = 'test-gen-123';

      // Mock EventSource
      const mockEventSource = {
        onmessage: null,
        onerror: null,
        addEventListener: vi.fn(),
        close: vi.fn(),
      };
      const EventSourceMock = vi.fn(() => mockEventSource);
      (global.EventSource as any) = EventSourceMock;

      // Setup API mocks
      mockApiClient.post.mockResolvedValue(createMockApiResponse({ generation_id: generationId }));
      mockApiClient.get.mockResolvedValue(createMockApiResponse({
        generation_id: generationId, status: 'pending', progress: 0
      }));

      await videoService.generateVideo({ prompt: 'test', duration: 5 }, {
        onProgress: progressCallback,
        enableRealTime: true,
      });

      expect(EventSourceMock).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/events/test-gen-123',
        { withCredentials: true }
      );
    });

    it('should fall back to polling when SSE fails', async () => {
      const progressCallback = vi.fn();
      
      // Mock console.warn to suppress expected error output
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock EventSource that fails
      (global.EventSource as any) = vi.fn(() => {
        throw new Error('SSE not supported');
      });

      mockApiClient.post.mockResolvedValue(createMockApiResponse({ generation_id: 'test' }));
      mockApiClient.get.mockResolvedValue(createMockApiResponse({
        generation_id: 'test', status: 'processing', progress: 50
      }));

      await videoService.generateVideo({ prompt: 'test', duration: 5 }, {
        onProgress: progressCallback,
        pollInterval: 100,
      });
      
      // Verify the warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith('SSE not supported, falling back to polling:', expect.any(Error));
      
      consoleWarnSpy.mockRestore();

      // Advance timers to trigger polling
      vi.advanceTimersByTime(150);

      expect(mockApiClient.get).toHaveBeenCalledWith('/videos/test/status');
    });

    it('should implement exponential backoff in polling', async () => {
      const progressCallback = vi.fn();
      
      mockApiClient.post.mockResolvedValue(createMockApiResponse({ generation_id: 'test' }));
      
      // Mock get to return processing status for first few calls, then completed
      let callCount = 0;
      mockApiClient.get.mockImplementation(() => {
        callCount++;
        return Promise.resolve(createMockApiResponse({ 
          generation_id: 'test', 
          status: callCount < 4 ? 'processing' : 'completed', // Complete after 4 calls
          progress: callCount < 4 ? 50 : 100
        }));
      });

      await videoService.generateVideo({ prompt: 'test', duration: 5 }, {
        onProgress: progressCallback,
        pollInterval: 1000,
        enableRealTime: false,
      });

      // First poll (at initial interval: 1000ms)
      await vi.advanceTimersByTimeAsync(1000);
      
      // Second poll (with backoff: 1000 * 1.5 = 1500ms)
      await vi.advanceTimersByTimeAsync(1500);
      
      // Third poll (with more backoff: 1500 * 1.5 = 2250ms) - this will return completed
      await vi.advanceTimersByTimeAsync(2250);

      expect(mockApiClient.get).toHaveBeenCalledTimes(4); // Initial + 3 polls
    });
  });

  describe('Video Status and History', () => {
    it('should get video status by generation ID', async () => {
      const mockStatus: VideoStatusResponse = {
        generation_id: 'test-123',
        status: VideoStatus.COMPLETED,
        progress: 100,
        message: 'Video generation complete',
        video_url: 'https://example.com/video.mp4',
        thumbnail_url: 'https://example.com/thumb.jpg',
        duration_seconds: 5,
        resolution: '720p',
        file_size_bytes: 2400000,
        created_at: '2025-08-18T12:00:00Z',
        updated_at: '2025-08-18T12:05:00Z',
        completed_at: '2025-08-18T12:05:00Z',
        error_details: null,
      };

      mockApiClient.get.mockResolvedValue(createMockApiResponse(mockStatus));

      const result = await videoService.getVideoStatus('test-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/videos/test-123/status');
      expect(result).toEqual(mockStatus);
    });

    it('should get video history with pagination', async () => {
      const mockHistory = {
        jobs: [
          { generation_id: 'job-1', status: 'completed', prompt: 'Video 1' },
          { generation_id: 'job-2', status: 'processing', prompt: 'Video 2' },
        ],
        total: 2,
        page: 1,
        page_size: 10,
      };

      mockApiClient.get.mockResolvedValue(createMockApiResponse(mockHistory));

      const result = await videoService.getVideoHistory({
        page: 1,
        page_size: 10,
        filters: {
          status: [VideoStatus.COMPLETED, VideoStatus.PROCESSING],
          search: 'test video',
        }
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/videos/history?page=1&page_size=10&status=completed%2Cprocessing&search=test+video'
      );
      expect(result).toEqual(mockHistory);
    });
  });

  describe('Utility Methods', () => {
    it('should identify active generation statuses', () => {
      expect(videoService.isGenerationActive(VideoStatus.PENDING)).toBe(true);
      expect(videoService.isGenerationActive(VideoStatus.PROCESSING)).toBe(true);
      expect(videoService.isGenerationActive(VideoStatus.COMPLETED)).toBe(false);
      expect(videoService.isGenerationActive(VideoStatus.FAILED)).toBe(false);
    });

    it('should identify complete generation statuses', () => {
      expect(videoService.isGenerationComplete(VideoStatus.COMPLETED)).toBe(true);
      expect(videoService.isGenerationComplete(VideoStatus.FAILED)).toBe(true);
      expect(videoService.isGenerationComplete(VideoStatus.CANCELLED)).toBe(true);
      expect(videoService.isGenerationComplete(VideoStatus.PROCESSING)).toBe(false);
    });

    it('should generate download URLs', () => {
      const url = videoService.getDownloadUrl('test-generation-id');
      expect(url).toContain('/videos/test-generation-id/download');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(videoService.generateVideo({
        prompt: 'test',
        duration: 5,
      })).rejects.toThrow('Network error');
    });

    it('should stop tracking on generation cancellation', async () => {
      const generationId = 'test-cancel';
      
      mockApiClient.post.mockResolvedValue(createMockApiResponse({ generation_id: generationId }));

      await videoService.cancelGeneration(generationId);

      expect(mockApiClient.post).toHaveBeenCalledWith(`/videos/cancel/${generationId}`);
    });
  });

  describe('Cleanup', () => {
    it('should clean up all active connections', () => {
      const mockEventSource = {
        close: vi.fn(),
      };
      
      // Simulate active event source
      (videoService as any).activeEventSources.set('test-1', mockEventSource);
      
      const mockTimeout = setTimeout(() => {}, 1000);
      (videoService as any).activePolls.set('test-2', mockTimeout);

      videoService.cleanup();

      expect(mockEventSource.close).toHaveBeenCalled();
      expect((videoService as any).activeEventSources.size).toBe(0);
      expect((videoService as any).activePolls.size).toBe(0);
    });
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVideoGeneration } from '../useVideoGeneration';

// Mock the video store
vi.mock('@/stores/videoStore', () => ({
  useVideoStore: vi.fn(() => ({
    generateVideo: vi.fn(),
    generateVideoWithImage: vi.fn(),
    cancelGeneration: vi.fn(),
    currentGeneration: null,
    isGenerating: false
  }))
}));

// Mock the API client to prevent real network calls
vi.mock('@/api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn()
  }
}));

describe('useVideoGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useVideoGeneration());
    
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.status).toBeNull();
    expect(result.current.currentGeneration).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.uploadProgress).toBeNull();
  });

  it('should provide generation functions', () => {
    const { result } = renderHook(() => useVideoGeneration());
    
    expect(typeof result.current.generateVideo).toBe('function');
    expect(typeof result.current.generateWithImage).toBe('function');
    expect(typeof result.current.cancelGeneration).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should handle error clearing', () => {
    const { result } = renderHook(() => useVideoGeneration());
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should handle generation state correctly', async () => {
    const { useVideoStore } = await import('@/stores/videoStore');
    
    // Mock store with different state
    vi.mocked(useVideoStore).mockReturnValue({
      generateVideo: vi.fn(),
      generateVideoWithImage: vi.fn(),
      cancelGeneration: vi.fn(),
      currentGeneration: {
        generation_id: 'test-123',
        status: 'processing',
        progress: 75,
        message: 'Processing video...'
      },
      isGenerating: true
    });

    const { result } = renderHook(() => useVideoGeneration());
    
    expect(result.current.isGenerating).toBe(true);
    expect(result.current.progress).toBe(75);
    expect(result.current.status).toBe('processing');
    expect(result.current.currentGeneration?.generation_id).toBe('test-123');
  });

  it('should handle different generation states', async () => {
    const { useVideoStore } = await import('@/stores/videoStore');
    
    // Mock completed generation
    vi.mocked(useVideoStore).mockReturnValue({
      generateVideo: vi.fn(),
      generateVideoWithImage: vi.fn(),
      cancelGeneration: vi.fn(),
      currentGeneration: {
        generation_id: 'test-123',
        status: 'completed',
        progress: 100,
        video_url: 'https://example.com/video.mp4'
      },
      isGenerating: false
    });

    const { result } = renderHook(() => useVideoGeneration());
    
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.progress).toBe(100);
    expect(result.current.status).toBe('completed');
  });
});
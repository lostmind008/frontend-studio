/**
 * React hooks for video generation workflows
 * Provides convenient interfaces for components to interact with video generation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useVideoStore } from '../stores/videoStore';
import { 
  VideoGenerationRequest, 
  VideoGenerationResponse,
  VideoStatusResponse, 
  VideoStatus,
  VideoModel,
  AspectRatio,
  UploadProgress 
} from '../api/types';
import { VideoGenerationOptions } from '../services/videoService';

// === Main Video Generation Hook ===

export interface UseVideoGenerationResult {
  // State
  isGenerating: boolean;
  currentGeneration: VideoStatusResponse | null;
  progress: number;
  status: VideoStatus | null;
  error: string | null;
  
  // Actions
  generateVideo: (request: VideoGenerationRequest) => Promise<VideoGenerationResponse>;
  generateWithImage: (
    request: Omit<VideoGenerationRequest, 'image_base64'>,
    imageFile: File
  ) => Promise<VideoStatusResponse>;
  cancelGeneration: () => Promise<void>;
  clearError: () => void;
  
  // Upload progress (for image uploads)
  uploadProgress: UploadProgress | null;
}

export function useVideoGeneration(options: VideoGenerationOptions = {}): UseVideoGenerationResult {
  const {
    generateVideo: storeGenerateVideo,
    generateVideoWithImage: storeGenerateWithImage,
    cancelGeneration: storeCancelGeneration,
    currentGeneration,
    isGenerating
  } = useVideoStore();

  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // Clear error when generation starts
  useEffect(() => {
    if (isGenerating) {
      setError(null);
    }
  }, [isGenerating]);

  const generateVideo = useCallback(async (request: VideoGenerationRequest) => {
    setError(null);
    setUploadProgress(null);
    
    try {
      return await storeGenerateVideo(request, options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      throw err;
    }
  }, [storeGenerateVideo, options]);

  const generateWithImage = useCallback(async (
    request: Omit<VideoGenerationRequest, 'image_base64'>,
    imageFile: File
  ) => {
    setError(null);
    setUploadProgress(null);
    
    try {
      return await storeGenerateWithImage(request, imageFile, {
        ...options,
        onUploadProgress: (progress) => {
          setUploadProgress(progress);
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      throw err;
    }
  }, [storeGenerateWithImage, options]);

  const cancelGeneration = useCallback(async () => {
    await storeCancelGeneration();
    setUploadProgress(null);
  }, [storeCancelGeneration]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isGenerating,
    currentGeneration,
    progress: currentGeneration?.progress || 0,
    status: currentGeneration?.status || null,
    error: error || currentGeneration?.error_details || null,
    generateVideo,
    generateWithImage,
    cancelGeneration,
    clearError,
    uploadProgress
  };
}

// === Video History Hook ===

export interface UseVideoHistoryResult {
  videos: VideoStatusResponse[];
  loading: boolean;
  error: string | null;
  loadHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  downloadVideo: (generationId: string) => Promise<void>;
}

export function useVideoHistory(): UseVideoHistoryResult {
  const {
    videoHistory,
    historyLoading,
    historyError,
    loadVideoHistory,
    refreshVideoHistory,
    downloadVideo
  } = useVideoStore();

  // Auto-load history on mount
  useEffect(() => {
    if (videoHistory.length === 0 && !historyLoading) {
      loadVideoHistory();
    }
  }, [videoHistory.length, historyLoading, loadVideoHistory]);

  return {
    videos: videoHistory,
    loading: historyLoading,
    error: historyError,
    loadHistory: loadVideoHistory,
    refreshHistory: refreshVideoHistory,
    downloadVideo
  };
}

// === Templates Hook ===

export interface UseTemplatesResult {
  templates: any[];
  loading: boolean;
  error: string | null;
  selectedTemplate: any | null;
  loadTemplates: (category?: string) => Promise<void>;
  selectTemplate: (template: any) => void;
}

export function useTemplates(): UseTemplatesResult {
  const {
    templates,
    templatesLoading,
    templatesError,
    selectedTemplate,
    loadTemplates,
    selectTemplate
  } = useVideoStore();

  // Auto-load templates on mount
  useEffect(() => {
    if (templates.length === 0 && !templatesLoading) {
      loadTemplates();
    }
  }, [templates.length, templatesLoading, loadTemplates]);

  return {
    templates,
    loading: templatesLoading,
    error: templatesError,
    selectedTemplate,
    loadTemplates,
    selectTemplate
  };
}

// === Batch Generation Hook ===

export interface UseBatchGenerationResult {
  isGenerating: boolean;
  batchProgress: {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
  };
  generations: any[];
  generateBatch: (requests: VideoGenerationRequest[]) => Promise<VideoStatusResponse[]>;
  cancelAll: () => Promise<void>;
}

export function useBatchGeneration(): UseBatchGenerationResult {
  const {
    generateBatch: storeGenerateBatch,
    cancelAllGenerations,
    batchGenerations,
    batchProgress,
    isGenerating
  } = useVideoStore();

  const generateBatch = useCallback(async (requests: VideoGenerationRequest[]) => {
    return await storeGenerateBatch(requests);
  }, [storeGenerateBatch]);

  const percentage = batchProgress.total > 0 
    ? Math.round(((batchProgress.completed + batchProgress.failed) / batchProgress.total) * 100)
    : 0;

  return {
    isGenerating,
    batchProgress: {
      ...batchProgress,
      percentage
    },
    generations: batchGenerations,
    generateBatch,
    cancelAll: cancelAllGenerations
  };
}

// === Real-time Progress Hook ===

export interface UseProgressTrackingResult {
  isTracking: boolean;
  enableTracking: (generationId: string) => void;
  disableTracking: () => void;
  currentStatus: VideoStatusResponse | null;
}

export function useProgressTracking(): UseProgressTrackingResult {
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const { currentGeneration } = useVideoStore();

  const enableTracking = useCallback((generationId: string) => {
    setTrackingId(generationId);
  }, []);

  const disableTracking = useCallback(() => {
    setTrackingId(null);
  }, []);

  // Auto-disable tracking when generation completes
  useEffect(() => {
    if (currentGeneration && trackingId === currentGeneration.generation_id) {
      const isComplete = ['completed', 'failed', 'cancelled'].includes(currentGeneration.status);
      if (isComplete) {
        setTrackingId(null);
      }
    }
  }, [currentGeneration, trackingId]);

  return {
    isTracking: !!trackingId,
    enableTracking,
    disableTracking,
    currentStatus: trackingId === currentGeneration?.generation_id ? currentGeneration : null
  };
}

// === Settings Hook ===

export interface UseVideoSettingsResult {
  defaultSettings: Partial<VideoGenerationRequest>;
  updateSettings: (settings: Partial<VideoGenerationRequest>) => void;
  resetSettings: () => void;
  realTimeUpdates: boolean;
  setRealTimeUpdates: (enabled: boolean) => void;
}

export function useVideoSettings(): UseVideoSettingsResult {
  const {
    defaultSettings,
    updateDefaultSettings,
    enableRealTimeUpdates,
    setRealTimeUpdates
  } = useVideoStore();

  const resetSettings = useCallback(() => {
    updateDefaultSettings({
      model: VideoModel.VEO_3_PREVIEW,
      duration: 5,
      aspect_ratio: AspectRatio.LANDSCAPE,
      enhance_prompt: true
    });
  }, [updateDefaultSettings]);

  return {
    defaultSettings,
    updateSettings: updateDefaultSettings,
    resetSettings,
    realTimeUpdates: enableRealTimeUpdates,
    setRealTimeUpdates
  };
}

// === Retry Hook ===

export interface UseRetryResult {
  retryGeneration: (generationId: string) => Promise<VideoGenerationResponse>;
  isRetrying: boolean;
}

export function useRetry(): UseRetryResult {
  const [isRetrying, setIsRetrying] = useState(false);
  const { retryGeneration: storeRetryGeneration } = useVideoStore();

  const retryGeneration = useCallback(async (generationId: string) => {
    setIsRetrying(true);
    try {
      const result = await storeRetryGeneration(generationId);
      return result;
    } finally {
      setIsRetrying(false);
    }
  }, [storeRetryGeneration]);

  return {
    retryGeneration,
    isRetrying
  };
}

// === Polling Hook (fallback for SSE) ===

export interface UsePollingResult {
  startPolling: (generationId: string, interval?: number) => void;
  stopPolling: () => void;
  isPolling: boolean;
}

export function usePolling(): UsePollingResult {
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { loadVideoHistory } = useVideoStore();

  const startPolling = useCallback((_generationId: string, interval = 3000) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsPolling(true);
    intervalRef.current = setInterval(() => {
      loadVideoHistory();
    }, interval);
  }, [loadVideoHistory]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    startPolling,
    stopPolling,
    isPolling
  };
}
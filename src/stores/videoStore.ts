/**
 * Video Generation State Management
 * Zustand store for handling video generation state and workflow
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { VideoGenerationOptions, videoService } from '../services/videoService';
import {
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoStatusResponse,
  VideoStatus,
  VideoModel,
  AspectRatio,
  TemplateResponse,
  UploadProgress
} from '../api/types';
import { api } from '../api/endpoints';

// === Types ===

export interface VideoGenerationState {
  generation_id: string;
  status: VideoStatus;
  progress: number;
  message: string;
  video_url?: string | null;
  thumbnail_url?: string | null;
  error_details?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  resolution?: string | null;
  file_size_bytes?: number | null;
  // UI state
  isGenerating: boolean;
  uploadProgress?: UploadProgress;
}

export interface VideoStoreState {
  // Current generation state
  currentGeneration: VideoGenerationState | null;
  
  // Video history
  videoHistory: VideoStatusResponse[];
  historyLoading: boolean;
  historyError: string | null;
  
  // Templates
  templates: TemplateResponse[];
  templatesLoading: boolean;
  templatesError: string | null;
  selectedTemplate: TemplateResponse | null;
  
  // Batch generation
  batchGenerations: VideoGenerationState[];
  batchProgress: {
    total: number;
    completed: number;
    failed: number;
  };
  
  // UI state
  isGenerating: boolean;
  showProgress: boolean;
  enableRealTimeUpdates: boolean;
  
  // Generation settings
  defaultSettings: Partial<VideoGenerationRequest>;
}

export interface VideoStoreActions {
  // Generation actions
  generateVideo: (
    request: VideoGenerationRequest,
    options?: VideoGenerationOptions
  ) => Promise<VideoGenerationResponse>;
  
  generateVideoWithImage: (
    request: Omit<VideoGenerationRequest, 'image_base64'>,
    imageFile: File,
    options?: VideoGenerationOptions & {
      onUploadProgress?: (progress: UploadProgress) => void;
    }
  ) => Promise<VideoStatusResponse>;
  
  generateBatch: (
    requests: VideoGenerationRequest[],
    options?: VideoGenerationOptions
  ) => Promise<VideoStatusResponse[]>;
  
  cancelGeneration: (generationId?: string) => Promise<void>;
  cancelAllGenerations: () => Promise<void>;
  
  // History actions
  loadVideoHistory: () => Promise<void>;
  refreshVideoHistory: () => Promise<void>;
  downloadVideo: (generationId: string) => Promise<void>;
  
  // Template actions
  loadTemplates: (category?: string) => Promise<void>;
  selectTemplate: (template: TemplateResponse | null) => void;
  
  // Settings actions
  updateDefaultSettings: (settings: Partial<VideoGenerationRequest>) => void;
  setRealTimeUpdates: (enabled: boolean) => void;
  
  // UI actions
  setShowProgress: (show: boolean) => void;
  clearCurrentGeneration: () => void;
  clearError: () => void;
  
  // Utility actions
  getGenerationById: (generationId: string) => VideoStatusResponse | null;
  retryGeneration: (generationId: string) => Promise<VideoGenerationResponse>;
}

type VideoStore = VideoStoreState & VideoStoreActions;

// === Store Implementation ===

export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      // === Initial State ===
      
      currentGeneration: null,
      videoHistory: [],
      historyLoading: false,
      historyError: null,
      templates: [],
      templatesLoading: false,
      templatesError: null,
      selectedTemplate: null,
      batchGenerations: [],
      batchProgress: { total: 0, completed: 0, failed: 0 },
      isGenerating: false,
      showProgress: false,
      enableRealTimeUpdates: true,
      defaultSettings: {
        model: VideoModel.VEO_3_PREVIEW,
        duration: 5,
        aspect_ratio: AspectRatio.LANDSCAPE,
        enhance_prompt: true
      },

      // === Generation Actions ===

      generateVideo: async (request, options = {}) => {
        const store = get();
        
        set({
          isGenerating: true,
          showProgress: true,
          currentGeneration: null
        });

        try {
          const mergedRequest = { ...store.defaultSettings, ...request };
          
          const result = await api.video.generateVideo(mergedRequest);
          
          // If real-time updates are enabled, start polling
          if (store.enableRealTimeUpdates && options.onProgress) {
            // Start polling for progress updates
            const pollInterval = setInterval(async () => {
              try {
                const status = await api.video.getVideoStatus(result.generation_id);
                options.onProgress?.(status);
                
                if (['completed', 'failed', 'cancelled'].includes(status.status)) {
                  clearInterval(pollInterval);
                  set({ isGenerating: false });
                  get().refreshVideoHistory();
                }
              } catch (error) {
                console.error('Polling error:', error);
              }
            }, 2000);
          }

          set({
            currentGeneration: {
              generation_id: result.generation_id,
              status: result.status,
              progress: 0,
              message: result.message,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              isGenerating: false
            }
          });

          return result;

        } catch (error) {
          set({
            isGenerating: false,
            currentGeneration: {
              generation_id: 'error',
              status: VideoStatus.FAILED,
              progress: 0,
              message: (error as Error).message,
              error_details: (error as Error).message,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              isGenerating: false
            }
          });
          throw error;
        }
      },

      generateVideoWithImage: async (request, imageFile, options = {}) => {
        const store = get();
        
        set({
          isGenerating: true,
          showProgress: true,
          currentGeneration: {
            generation_id: 'uploading',
            status: VideoStatus.PENDING,
            progress: 0,
            message: 'Uploading image...',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            isGenerating: true,
            uploadProgress: { loaded: 0, total: 100, percentage: 0 }
          }
        });

        try {
          const mergedRequest = { ...store.defaultSettings, ...request };
          
          const result = await videoService.generateVideoWithImage(
            mergedRequest, 
            imageFile,
            {
              ...options,
              onUploadProgress: (progress) => {
                set(state => ({
                  currentGeneration: state.currentGeneration ? {
                    ...state.currentGeneration,
                    uploadProgress: progress,
                    message: `Uploading image... ${progress.percentage}%`
                  } : null
                }));
                options.onUploadProgress?.(progress);
              }
            }
          );

          set({
            isGenerating: false,
            currentGeneration: {
              generation_id: result.generation_id,
              status: result.status,
              progress: 0,
              message: result.message,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              isGenerating: false
            }
          });

          return result;

        } catch (error) {
          set({
            isGenerating: false,
            currentGeneration: {
              generation_id: 'error',
              status: VideoStatus.FAILED,
              progress: 0,
              message: (error as Error).message,
              error_details: (error as Error).message,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              isGenerating: false
            }
          });
          throw error;
        }
      },

      generateBatch: async (requests) => {
        set({
          isGenerating: true,
          batchGenerations: [],
          batchProgress: { total: requests.length, completed: 0, failed: 0 }
        });

        try {
          const batchRequest = {
            requests: requests,
            batch_name: `batch_${Date.now()}`,
            priority: 1
          };
          const results = await api.video.generateBatch(batchRequest);

          // Poll each generation for completion
          const statusPromises = results.generation_ids.map(async (generation_id) => {
            const status = await api.video.getVideoStatus(generation_id);
            return status;
          });
          
          const videoStatuses = await Promise.all(statusPromises);

          set({ isGenerating: false });
          get().refreshVideoHistory();

          return videoStatuses;

        } catch (error) {
          set({ isGenerating: false });
          throw error;
        }
      },

      cancelGeneration: async (generationId) => {
        if (generationId) {
          await api.video.cancelGeneration(generationId);
        } else {
          // Cancel current generation
          const current = get().currentGeneration;
          if (current) {
            await api.video.cancelGeneration(current.generation_id);
          }
        }
        
        set({
          isGenerating: false,
          currentGeneration: null
        });
      },

      cancelAllGenerations: async () => {
        await api.video.cancelAllGenerations();
        set({
          isGenerating: false,
          currentGeneration: null,
          batchGenerations: []
        });
      },

      // === History Actions ===

      loadVideoHistory: async () => {
        set({ historyLoading: true, historyError: null });
        
        try {
          const videos = await api.video.getUserVideos({ limit: 50 });
          set({
            videoHistory: videos,
            historyLoading: false
          });
        } catch (error) {
          set({
            historyError: (error as Error).message,
            historyLoading: false
          });
        }
      },

      refreshVideoHistory: async () => {
        // Refresh without showing loading state
        try {
          const videos = await api.video.getUserVideos({ limit: 50 });
          set({ videoHistory: videos });
        } catch (error) {
          console.error('Failed to refresh video history:', error);
        }
      },

      downloadVideo: async (generationId) => {
        try {
          const url = await api.utils.createVideoDownloadUrl(generationId);
          
          // Create download link
          const link = document.createElement('a');
          link.href = url;
          link.download = `video-${generationId}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up object URL
          URL.revokeObjectURL(url);
          
        } catch (error) {
          console.error('Failed to download video:', error);
          throw error;
        }
      },

      // === Template Actions ===

      loadTemplates: async (category) => {
        set({ templatesLoading: true, templatesError: null });
        
        try {
          const templates = await api.template.getTemplates({ 
            category,
            limit: 100 
          });
          set({
            templates,
            templatesLoading: false
          });
        } catch (error) {
          set({
            templatesError: (error as Error).message,
            templatesLoading: false
          });
        }
      },

      selectTemplate: (template) => {
        set({ selectedTemplate: template });
      },

      // === Settings Actions ===

      updateDefaultSettings: (settings) => {
        set(state => ({
          defaultSettings: { ...state.defaultSettings, ...settings }
        }));
      },

      setRealTimeUpdates: (enabled) => {
        set({ enableRealTimeUpdates: enabled });
      },

      // === UI Actions ===

      setShowProgress: (show) => {
        set({ showProgress: show });
      },

      clearCurrentGeneration: () => {
        set({ currentGeneration: null });
      },

      clearError: () => {
        set({ 
          historyError: null,
          templatesError: null 
        });
      },

      // === Utility Actions ===

      getGenerationById: (generationId) => {
        const history = get().videoHistory;
        return history.find(video => video.generation_id === generationId) || null;
      },

      retryGeneration: async (generationId) => {
        const video = get().getGenerationById(generationId);
        if (!video) {
          throw new Error('Video not found in history');
        }

        // Reconstruct the original request (limited info available)
        const request: VideoGenerationRequest = {
          prompt: 'Retry generation', // Would need to store original prompt
          // Use current default settings
          ...get().defaultSettings
        };

        return get().generateVideo(request);
      }
    }),
    {
      name: 'video-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain parts of the state
      partialize: (state) => ({
        defaultSettings: state.defaultSettings,
        enableRealTimeUpdates: state.enableRealTimeUpdates,
        selectedTemplate: state.selectedTemplate
      })
    }
  )
);

// === Selectors for optimized component updates ===

export const useCurrentGeneration = () => useVideoStore(state => state.currentGeneration);
export const useVideoHistory = () => useVideoStore(state => state.videoHistory);
export const useTemplates = () => useVideoStore(state => state.templates);
export const useIsGenerating = () => useVideoStore(state => state.isGenerating);
export const useBatchProgress = () => useVideoStore(state => state.batchProgress);
export const useDefaultSettings = () => useVideoStore(state => state.defaultSettings);

// === Cleanup on page unload ===

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    videoService.dispose();
  });
}
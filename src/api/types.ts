/**
 * TypeScript interfaces generated from FastAPI OpenAPI specification
 * API: Veo 3 Video Generator v1.0.0
 * Base URL: https://api.lostmindai.com/api/v1
 */

// ========== ENUMS ==========

export enum VideoStatus {
  PENDING = "pending",
  PROCESSING = "processing", 
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

// Additional status aliases for compatibility
export type VideoStatusString = "pending" | "processing" | "completed" | "failed" | "cancelled";

export enum AspectRatio {
  LANDSCAPE = "16:9",
  PORTRAIT = "9:16", 
  SQUARE = "1:1",
  TRADITIONAL = "4:3",
  CINEMA = "21:9"
}

export enum VideoModel {
  VEO_3_PREVIEW = "veo-3.0-generate-preview",
  VEO_2_GA = "veo-2.0-generate-001"
}

// ========== AUTHENTICATION ==========

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserRegistration {
  email: string;
  password: string;
  name?: string | null;
  organisation?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: object;
}

export interface UserResponse {
  id: string;
  email: string;
  name?: string | null;
  organisation?: string | null;
  quota_remaining: number;
  total_generated: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  organisation: string | null;
  quota_remaining: number;
  total_generated: number;
  is_admin: boolean;
  created_at: string;
}

// ========== VIDEO GENERATION ==========

export interface VideoGenerationRequest {
  prompt: string;                    // 3-5000 chars
  model?: VideoModel | null;         // default: veo-3.0-generate-preview
  duration?: number;                 // 5-8 seconds, default: 5
  aspect_ratio?: AspectRatio;        // default: 16:9
  enhance_prompt?: boolean;          // default: true
  image_base64?: string | null;      // optional conditioning image
  webhook_url?: string | null;       // optional completion webhook
  metadata?: object | null;          // additional metadata
}

export interface VideoGenerationResponse {
  generation_id: string;
  status: VideoStatus;
  message: string;
  operation_id?: string | null;      // Google Cloud operation ID
  estimated_completion_seconds?: number | null;
  data?: any;                        // Optional response data field (for compatibility)
}

export interface VideoStatusResponse {
  generation_id: string;
  status: VideoStatus;
  progress?: number | null;          // 0-100
  message: string;
  video_url?: string | null;         // download URL when completed
  thumbnail_url?: string | null;     // thumbnail URL
  duration_seconds?: number | null;  // actual video duration
  resolution?: string | null;        // e.g., "1920x1080"
  file_size_bytes?: number | null;   // file size in bytes
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  error_details?: string | null;     // error info if failed

  // Extended UI properties (optional, may be added by frontend)
  title?: string | null;            // User-friendly title for the video
  prompt?: string | null;           // Original generation prompt
  cost?: number | null;             // Generation cost in credits/currency
  cost_estimate?: number | null;    // Estimated cost before generation
  duration?: number | null;         // Alias for duration_seconds for backward compatibility
  file_size?: number | null;        // Alias for file_size_bytes for backward compatibility
  error?: string | null;            // Alias for error_details for backward compatibility
  data?: any;                       // Optional response data field (for compatibility)
  videoUrl?: string | null;         // Alias for video_url for backward compatibility
  job_id?: string | null;           // Legacy job ID field for backward compatibility
  id?: string | null;               // Generic ID field for backward compatibility
  style?: string | null;            // Video generation style (e.g., cinematic, realistic)
  aspect_ratio?: string | null;     // Video aspect ratio (e.g., 16:9, 9:16)
}

// ========== ERROR HANDLING ==========

export interface ErrorResponse {
  error: string;
  message: string;
  detail?: object | null;
  request_id?: string | null;
  timestamp?: string;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// ========== API RESPONSES ==========

export interface UserVideosResponse {
  videos: VideoStatusResponse[];
  total: number;
  page: number;
  pages: number;
  page_size: number;
}

export interface GenerationStats {
  total_videos: number;
  completed_videos: number;
  processing_videos: number;
  failed_videos: number;
}

// ========== UI STATE TYPES ==========

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface VideoFilters {
  status?: VideoStatus[];
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface VideoListParams extends PaginationParams {
  filters?: VideoFilters;
  status?: VideoStatus[];
  limit?: number;
  offset?: number;
}

// ========== FORM TYPES ==========

export interface VideoGenerationFormData {
  prompt: string;
  duration: number;
  aspect_ratio: AspectRatio;
  enhance_prompt: boolean;
  image?: File | null;
}

// Enhanced form with additional UI fields
export interface EnhancedVideoGenerationFormData extends VideoGenerationRequest {
  // UI-specific fields that get stored in metadata
  style?: string;
  category?: string;
  costTier?: string;
  qualityLevel?: string;
  industry?: string;
  sceneType?: string;
  negative_prompt?: string;
  cameraMovement?: string;
  characterDNA?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
  organisation?: string;
}

// ========== API CLIENT TYPES ==========

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
  request_id?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// ========== POLLING TYPES ==========

export interface PollingConfig {
  interval: number;           // milliseconds between polls
  maxDuration: number;        // max polling duration in ms
  backoffMultiplier: number;  // backoff when server busy
  maxInterval: number;        // max interval during backoff
}

export interface GenerationJob {
  generation_id: string;
  status: VideoStatus;
  progress?: number;
  startTime: number;
  lastPoll: number;
  pollCount: number;
  abortController?: AbortController;
}

// ========== STORE TYPES ==========

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface VideoState {
  generations: Record<string, VideoStatusResponse>;
  activeJobs: Record<string, GenerationJob>;
  history: VideoStatusResponse[];
  stats: GenerationStats | null;
  loading: boolean;
  error: string | null;
}

// ========== UTILITY TYPES ==========

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: RequestStatus;
  error: string | null;
  lastUpdated?: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ========== BATCH GENERATION ==========

export interface BatchGenerationRequest {
  requests: VideoGenerationRequest[];
  batch_name?: string;
  webhook_url?: string | null;
  priority?: number;
}

export interface BatchGenerationResponse {
  batch_id: string;
  total_requests: number;
  status: VideoStatus;
  created_at: string;
  generation_ids: string[];
}

// ========== TEMPLATES ==========

export interface TemplateResponse {
  id: string;
  name: string;
  description: string;
  prompt_template: string;
  category: string;
  tags: string[];
  aspect_ratio: AspectRatio;
  duration: number;
  model: VideoModel;
  preview_url?: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateListParams extends PaginationParams {
  category?: string;
  search?: string;
  tags?: string[];
  featured?: boolean;
  limit?: number;
  offset?: number;
}

// ========== STATS & ANALYTICS ==========

export interface StatsParams {
  date_from?: string;
  date_to?: string;
  group_by?: 'day' | 'week' | 'month';
  days?: number;
}

export interface UserStats {
  total_videos: number;
  completed_videos: number;
  processing_videos: number;
  failed_videos: number;
  quota_used: number;
  quota_remaining: number;
  last_generation_date?: string;
}

// ========== FILE UPLOAD ==========

export interface ImageUploadRequest {
  file: File;
  metadata?: object;
}

export interface ProgressEvent {
  type: 'upload' | 'generation' | 'processing';
  loaded: number;
  total: number;
  percentage: number;
  rate?: number;
  estimated_time?: number;
  generation_id?: string;
  status?: VideoStatus;
  progress?: number;
  message?: string;
  timestamp?: string;
}

// ========== ADDITIONAL ALIASES FOR COMPATIBILITY ==========

export type FileUploadProgress = UploadProgress;
export type LoginCredentials = UserLogin;
export type RegisterData = RegisterFormData;
export type AuthTokenResponse = TokenResponse;
/**
 * Comprehensive Error Handling Utilities
 * Provides error classification, formatting, and reporting for Veo3 Video Generator
 */

import { ApiClientError } from '../api/client';

// === Error Types ===

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  GENERATION_FAILED = 'GENERATION_FAILED',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorDetails {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
  requestId?: string;
  timestamp: string;
  context?: Record<string, any>;
  recoveryActions?: ErrorRecoveryAction[];
}

export interface ErrorRecoveryAction {
  label: string;
  action: 'retry' | 'refresh' | 'logout' | 'contact_support' | 'custom';
  handler?: () => void | Promise<void>;
  data?: any;
}

// === Error Classification ===

export class ErrorClassifier {
  static classifyError(error: unknown): ErrorDetails {
    const timestamp = new Date().toISOString();
    
    // Handle ApiClientError (from our API client)
    if (error instanceof ApiClientError) {
      return this.classifyApiError(error, timestamp);
    }
    
    // Handle standard Error objects
    if (error instanceof Error) {
      return this.classifyStandardError(error, timestamp);
    }
    
    // Handle string errors
    if (typeof error === 'string') {
      return this.classifyStringError(error, timestamp);
    }
    
    // Handle unknown error types
    return this.classifyUnknownError(error, timestamp);
  }
  
  private static classifyApiError(error: ApiClientError, timestamp: string): ErrorDetails {
    const status = error.status || 0;
    const code = error.code || 'UNKNOWN';
    
    // Network errors
    if (status === 0 || code === 'NETWORK_ERROR') {
      return {
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.HIGH,
        message: error.message,
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        code,
        requestId: error.request_id,
        timestamp,
        recoveryActions: [
          { label: 'Retry', action: 'retry' },
          { label: 'Refresh Page', action: 'refresh' }
        ]
      };
    }
    
    // Authentication errors
    if (status === 401) {
      return {
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        message: error.message,
        userMessage: 'Your session has expired. Please log in again.',
        code,
        requestId: error.request_id,
        timestamp,
        recoveryActions: [
          { label: 'Log In', action: 'logout' }
        ]
      };
    }
    
    // Authorization errors
    if (status === 403) {
      return {
        type: ErrorType.AUTHORIZATION,
        severity: ErrorSeverity.MEDIUM,
        message: error.message,
        userMessage: 'You do not have permission to perform this action.',
        code,
        requestId: error.request_id,
        timestamp,
        recoveryActions: [
          { label: 'Contact Support', action: 'contact_support' }
        ]
      };
    }
    
    // Validation errors
    if (status === 422 || code === 'VALIDATION_ERROR') {
      return {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.LOW,
        message: error.message,
        userMessage: this.formatValidationMessage(error.message),
        code,
        details: error.details,
        requestId: error.request_id,
        timestamp,
        recoveryActions: [
          { label: 'Fix Input', action: 'custom' }
        ]
      };
    }
    
    // Rate limiting
    if (status === 429) {
      return {
        type: ErrorType.RATE_LIMIT,
        severity: ErrorSeverity.MEDIUM,
        message: error.message,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        code,
        requestId: error.request_id,
        timestamp,
        recoveryActions: [
          { label: 'Wait and Retry', action: 'retry' }
        ]
      };
    }
    
    // Server errors
    if (status >= 500) {
      return {
        type: ErrorType.SERVER,
        severity: ErrorSeverity.HIGH,
        message: error.message,
        userMessage: 'Server error occurred. Our team has been notified.',
        code,
        requestId: error.request_id,
        timestamp,
        recoveryActions: [
          { label: 'Retry', action: 'retry' },
          { label: 'Contact Support', action: 'contact_support' }
        ]
      };
    }
    
    // Client errors (4xx)
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: error.message,
      userMessage: 'An error occurred while processing your request.',
      code,
      requestId: error.request_id,
      timestamp,
      recoveryActions: [
        { label: 'Retry', action: 'retry' }
      ]
    };
  }
  
  private static classifyStandardError(error: Error, timestamp: string): ErrorDetails {
    const message = error.message.toLowerCase();
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('aborted')) {
      return {
        type: ErrorType.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        message: error.message,
        userMessage: 'The request timed out. Please try again.',
        timestamp,
        recoveryActions: [
          { label: 'Retry', action: 'retry' }
        ]
      };
    }
    
    // File size errors
    if (message.includes('file too large') || message.includes('size limit')) {
      return {
        type: ErrorType.FILE_TOO_LARGE,
        severity: ErrorSeverity.LOW,
        message: error.message,
        userMessage: 'File is too large. Please use a smaller file.',
        timestamp,
        recoveryActions: [
          { label: 'Choose Different File', action: 'custom' }
        ]
      };
    }
    
    // Unsupported format errors
    if (message.includes('unsupported') || message.includes('invalid format')) {
      return {
        type: ErrorType.UNSUPPORTED_FORMAT,
        severity: ErrorSeverity.LOW,
        message: error.message,
        userMessage: 'File format is not supported. Please use a different format.',
        timestamp,
        recoveryActions: [
          { label: 'Choose Different File', action: 'custom' }
        ]
      };
    }
    
    // Generation errors
    if (message.includes('generation') || message.includes('video creation')) {
      return {
        type: ErrorType.GENERATION_FAILED,
        severity: ErrorSeverity.MEDIUM,
        message: error.message,
        userMessage: 'Video generation failed. Please try again with different settings.',
        timestamp,
        recoveryActions: [
          { label: 'Retry', action: 'retry' },
          { label: 'Modify Settings', action: 'custom' }
        ]
      };
    }
    
    // Generic error
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again.',
      timestamp,
      recoveryActions: [
        { label: 'Retry', action: 'retry' }
      ]
    };
  }
  
  private static classifyStringError(error: string, timestamp: string): ErrorDetails {
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.LOW,
      message: error,
      userMessage: error,
      timestamp,
      recoveryActions: [
        { label: 'Retry', action: 'retry' }
      ]
    };
  }
  
  private static classifyUnknownError(error: unknown, timestamp: string): ErrorDetails {
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      timestamp,
      details: error,
      recoveryActions: [
        { label: 'Retry', action: 'retry' },
        { label: 'Refresh Page', action: 'refresh' }
      ]
    };
  }
  
  private static formatValidationMessage(message: string): string {
    // Clean up technical validation messages for users
    return message
      .replace(/validation error: /i, '')
      .replace(/field required/i, 'This field is required')
      .replace(/invalid/i, 'Invalid')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .charAt(0).toUpperCase() + message.slice(1);
  }
}

// === Error Reporter ===

export interface ErrorReportOptions {
  context?: Record<string, any>;
  skipToast?: boolean;
  skipLogging?: boolean;
  customHandler?: (error: ErrorDetails) => void;
}

export class ErrorReporter {
  private static listeners: Set<(error: ErrorDetails) => void> = new Set();
  
  static addListener(listener: (error: ErrorDetails) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  static report(error: unknown, options: ErrorReportOptions = {}): ErrorDetails {
    const errorDetails = ErrorClassifier.classifyError(error);
    
    // Add context
    if (options.context) {
      errorDetails.context = { ...errorDetails.context, ...options.context };
    }
    
    // Log to console (can be replaced with proper logging service)
    if (!options.skipLogging) {
      this.logError(errorDetails);
    }
    
    // Notify listeners (including toast notifications)
    if (!options.skipToast) {
      this.listeners.forEach(listener => {
        try {
          listener(errorDetails);
        } catch (listenerError) {
          console.error('Error in error listener:', listenerError);
        }
      });
    }
    
    // Custom handler
    if (options.customHandler) {
      options.customHandler(errorDetails);
    }
    
    return errorDetails;
  }
  
  private static logError(error: ErrorDetails): void {
    const logLevel = this.getLogLevel(error.severity);
    const logData = {
      type: error.type,
      severity: error.severity,
      message: error.message,
      userMessage: error.userMessage,
      code: error.code,
      requestId: error.requestId,
      timestamp: error.timestamp,
      context: error.context,
      details: error.details
    };
    
    console[logLevel](`[${error.type}] ${error.message}`, logData);
    
    // In production, send to error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production' && error.severity === ErrorSeverity.CRITICAL) {
      // Send to error tracking service
      this.sendToErrorService(error);
    }
  }
  
  private static getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'warn';
    }
  }
  
  private static sendToErrorService(error: ErrorDetails): void {
    // Placeholder for error tracking service integration
    // Example: Sentry.captureException(error)
    console.warn('Would send to error tracking service:', error);
  }
}

// === Retry Logic ===

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

export class RetryManager {
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      jitter = true,
      onRetry
    } = options;
    
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          break;
        }
        
        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          break;
        }
        
        // Calculate delay
        const delay = this.calculateDelay(attempt, baseDelay, maxDelay, backoffFactor, jitter);
        
        // Notify retry callback
        if (onRetry) {
          onRetry(attempt, error);
        }
        
        // Wait before retry
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }
  
  private static isRetryableError(error: unknown): boolean {
    if (error instanceof ApiClientError) {
      const status = error.status;
      // Retry on network errors, timeouts, and specific server errors
      return !status || status === 0 || status === 408 || status === 429 || status >= 500;
    }
    
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('timeout') || 
             message.includes('network') || 
             message.includes('connection');
    }
    
    return false;
  }
  
  private static calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    backoffFactor: number,
    jitter: boolean
  ): number {
    let delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
    
    if (jitter) {
      // Add 10% jitter
      const jitterAmount = delay * 0.1;
      delay += (Math.random() * 2 - 1) * jitterAmount;
    }
    
    return Math.min(delay, maxDelay);
  }
  
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// === Error Context Hook ===

export interface ErrorContextValue {
  reportError: (error: unknown, options?: ErrorReportOptions) => ErrorDetails;
  withRetry: <T>(fn: () => Promise<T>, options?: RetryOptions) => Promise<T>;
  clearErrors: () => void;
}

// === Utility Functions ===

export function getErrorIcon(type: ErrorType): string {
  switch (type) {
    case ErrorType.NETWORK:
      return '🌐';
    case ErrorType.AUTHENTICATION:
      return '🔐';
    case ErrorType.AUTHORIZATION:
      return '🚫';
    case ErrorType.VALIDATION:
      return '⚠️';
    case ErrorType.RATE_LIMIT:
      return '⏱️';
    case ErrorType.SERVER:
      return '🔧';
    case ErrorType.TIMEOUT:
      return '⏰';
    case ErrorType.QUOTA_EXCEEDED:
      return '📊';
    case ErrorType.FILE_TOO_LARGE:
      return '📁';
    case ErrorType.UNSUPPORTED_FORMAT:
      return '🔧';
    case ErrorType.GENERATION_FAILED:
      return '🎬';
    default:
      return '❌';
  }
}

export function getSeverityColor(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.LOW:
      return '#F59E0B'; // warning yellow
    case ErrorSeverity.MEDIUM:
      return '#EF4444'; // error red
    case ErrorSeverity.HIGH:
      return '#DC2626'; // high error red
    case ErrorSeverity.CRITICAL:
      return '#991B1B'; // critical red
    default:
      return '#6B7280'; // gray
  }
}

export function isClientError(error: unknown): boolean {
  return error instanceof ApiClientError && 
         error.status !== undefined && 
         error.status >= 400 && 
         error.status < 500;
}

export function isServerError(error: unknown): boolean {
  return error instanceof ApiClientError && 
         error.status !== undefined && 
         error.status >= 500;
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiClientError && 
         (error.status === 0 || error.code === 'NETWORK_ERROR');
}
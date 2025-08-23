/**
 * Error Handler Hook
 * Comprehensive error handling hook with toast integration and recovery
 */

import React, { useCallback, useEffect } from 'react';
import { ErrorReporter, ErrorDetails, ErrorClassifier, RetryManager, RetryOptions } from '../utils/errors';
import { useToast } from '../components/ui/ToastNotification';
import { useErrorModal } from '../components/ui/ErrorModal';

// === Types ===

export interface ErrorHandlerOptions {
  showToast?: boolean;
  showModal?: boolean;
  autoRetry?: boolean;
  retryOptions?: RetryOptions;
  onError?: (error: ErrorDetails) => void;
  context?: Record<string, any>;
}

export interface UseErrorHandlerReturn {
  reportError: (error: unknown, options?: Partial<ErrorHandlerOptions>) => ErrorDetails;
  reportErrorWithToast: (error: unknown, message?: string) => ErrorDetails;
  reportErrorWithModal: (error: unknown) => ErrorDetails;
  withErrorHandler: <T>(
    fn: () => Promise<T>,
    options?: Partial<ErrorHandlerOptions>
  ) => Promise<T>;
  withRetry: <T>(
    fn: () => Promise<T>,
    retryOptions?: RetryOptions
  ) => Promise<T>;
  clearErrors: () => void;
  isOnline: boolean;
}

// === Main Hook ===

export function useErrorHandler(
  defaultOptions: Partial<ErrorHandlerOptions> = {}
): UseErrorHandlerReturn {
  const toast = useToast();
  const errorModal = useErrorModal();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Setup global error listeners
  useEffect(() => {
    const removeErrorListener = ErrorReporter.addListener((error) => {
      // Default behavior: show toast for most errors
      if (defaultOptions.showToast !== false) {
        toast.fromError(error);
      }
    });

    return removeErrorListener;
  }, [toast, defaultOptions.showToast]);

  // Report error with full configuration
  const reportError = useCallback((
    error: unknown,
    options: Partial<ErrorHandlerOptions> = {}
  ): ErrorDetails => {
    const mergedOptions = { ...defaultOptions, ...options };
    const errorDetails = ErrorClassifier.classifyError(error);

    // Add context
    if (mergedOptions.context) {
      errorDetails.context = { ...errorDetails.context, ...mergedOptions.context };
    }

    // Add network status to context
    errorDetails.context = {
      ...errorDetails.context,
      isOnline,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Report through ErrorReporter
    const reportedError = ErrorReporter.report(errorDetails, {
      skipToast: !mergedOptions.showToast,
      context: mergedOptions.context
    });

    // Show modal if requested
    if (mergedOptions.showModal) {
      errorModal.showError(reportedError);
    }

    // Call custom error handler
    if (mergedOptions.onError) {
      mergedOptions.onError(reportedError);
    }

    // Auto-retry for retryable errors
    if (mergedOptions.autoRetry && reportedError.recoveryActions?.some(action => action.action === 'retry')) {
      console.log('Auto-retry would be triggered here');
      // Implementation would depend on the specific retry mechanism
    }

    return reportedError;
  }, [defaultOptions, isOnline, toast, errorModal]);

  // Convenience method for toast-only errors
  const reportErrorWithToast = useCallback((
    error: unknown,
    customMessage?: string
  ): ErrorDetails => {
    const errorDetails = reportError(error, { showToast: true, showModal: false });
    
    if (customMessage) {
      toast.error(customMessage);
    }
    
    return errorDetails;
  }, [reportError, toast]);

  // Convenience method for modal-only errors
  const reportErrorWithModal = useCallback((error: unknown): ErrorDetails => {
    return reportError(error, { showToast: false, showModal: true });
  }, [reportError]);

  // Wrapper for functions with error handling
  const withErrorHandler = useCallback(async <T>(
    fn: () => Promise<T>,
    options: Partial<ErrorHandlerOptions> = {}
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      reportError(error, options);
      throw error; // Re-throw for caller to handle if needed
    }
  }, [reportError]);

  // Wrapper for functions with retry logic
  const withRetry = useCallback(async <T>(
    fn: () => Promise<T>,
    retryOptions: RetryOptions = {}
  ): Promise<T> => {
    return RetryManager.withRetry(fn, {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt}:`, error);
        
        // Show toast for retry attempts
        if (attempt === 1) {
          toast.warning(`Request failed, retrying... (${attempt}/3)`);
        }
      },
      ...retryOptions
    });
  }, [toast]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    toast.dismissAll();
    errorModal.hideError();
  }, [toast, errorModal]);

  return {
    reportError,
    reportErrorWithToast,
    reportErrorWithModal,
    withErrorHandler,
    withRetry,
    clearErrors,
    isOnline
  };
}

// === Specialized Hooks ===

// Hook for API error handling
export function useApiErrorHandler() {
  const errorHandler = useErrorHandler({
    showToast: true,
    showModal: false,
    context: { source: 'api' }
  });

  const handleApiError = useCallback((error: unknown, operation?: string) => {
    return errorHandler.reportError(error, {
      context: { 
        operation,
        source: 'api',
        timestamp: new Date().toISOString()
      }
    });
  }, [errorHandler]);

  const withApiErrorHandler = useCallback(async <T>(
    apiCall: () => Promise<T>,
    operation?: string
  ): Promise<T> => {
    try {
      return await errorHandler.withRetry(apiCall);
    } catch (error) {
      handleApiError(error, operation);
      throw error;
    }
  }, [errorHandler, handleApiError]);

  return {
    ...errorHandler,
    handleApiError,
    withApiErrorHandler
  };
}

// Hook for form error handling
export function useFormErrorHandler() {
  const errorHandler = useErrorHandler({
    showToast: false, // Forms usually show inline errors
    showModal: false,
    context: { source: 'form' }
  });

  const handleValidationError = useCallback((error: unknown, fieldName?: string) => {
    return errorHandler.reportError(error, {
      context: { 
        fieldName,
        source: 'form_validation',
        timestamp: new Date().toISOString()
      }
    });
  }, [errorHandler]);

  const handleSubmissionError = useCallback((error: unknown, formData?: any) => {
    return errorHandler.reportError(error, {
      showToast: true, // Show toast for submission errors
      context: { 
        formData: formData ? Object.keys(formData) : undefined,
        source: 'form_submission',
        timestamp: new Date().toISOString()
      }
    });
  }, [errorHandler]);

  return {
    ...errorHandler,
    handleValidationError,
    handleSubmissionError
  };
}

// Hook for file upload error handling
export function useUploadErrorHandler() {
  const errorHandler = useErrorHandler({
    showToast: true,
    showModal: false,
    context: { source: 'upload' }
  });

  const handleUploadError = useCallback((
    error: unknown, 
    fileName?: string, 
    fileSize?: number
  ) => {
    return errorHandler.reportError(error, {
      context: { 
        fileName,
        fileSize,
        source: 'file_upload',
        timestamp: new Date().toISOString()
      }
    });
  }, [errorHandler]);

  const withUploadErrorHandler = useCallback(async <T>(
    uploadFn: () => Promise<T>,
    fileName?: string,
    fileSize?: number
  ): Promise<T> => {
    try {
      return await uploadFn();
    } catch (error) {
      handleUploadError(error, fileName, fileSize);
      throw error;
    }
  }, [handleUploadError]);

  return {
    ...errorHandler,
    handleUploadError,
    withUploadErrorHandler
  };
}

// Hook for global error boundary
export function useGlobalErrorHandler() {
  const errorHandler = useErrorHandler({
    showToast: true,
    showModal: true,
    context: { source: 'global' }
  });

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      errorHandler.reportError(event.error || event.message, {
        context: {
          source: 'global_error_event',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: new Date().toISOString()
        }
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorHandler.reportError(event.reason, {
        context: {
          source: 'unhandled_promise_rejection',
          timestamp: new Date().toISOString()
        }
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [errorHandler]);

  return errorHandler;
}

export default useErrorHandler;
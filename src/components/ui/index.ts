/**
 * UI Components Index
 * Exports all error handling and UX polish components
 */

// Error Handling Components
export { default as ErrorBoundary, withErrorBoundary, AsyncErrorBoundary, useErrorHandler as useErrorBoundaryHandler } from './ErrorBoundary';
export { default as ToastProvider, useToast, toast } from './ToastNotification';
export { default as ErrorModal, useErrorModal } from './ErrorModal';
export { default as RetryButton, useRetry } from './RetryButton';
export { default as NetworkStatus, useNetworkStatus } from './NetworkStatus';
export { default as ValidationErrors, FieldError, InlineError, FormErrorSummary, useValidation, errorsFromApiError } from './ValidationErrors';

// Loading Components
export { 
  default as LoadingSpinner, 
  Skeleton, 
  LoadingState, 
  TextSkeleton, 
  CardSkeleton, 
  ListSkeleton, 
  VideoCardSkeleton,
  useLoadingState 
} from './LoadingSpinner';

// Component Types
export type {
  ToastOptions,
  ToastAction,
  ToastType,
  ToastPosition
} from './ToastNotification';

export type {
  ErrorModalProps
} from './ErrorModal';

export type {
  RetryButtonProps
} from './RetryButton';

export type {
  NetworkStatusProps
} from './NetworkStatus';

export type {
  ValidationError,
  ValidationErrorsProps,
  FieldErrorProps,
  InlineErrorProps,
  FormErrorSummaryProps
} from './ValidationErrors';

export type {
  LoadingSpinnerProps,
  SkeletonProps,
  LoadingStateProps
} from './LoadingSpinner';
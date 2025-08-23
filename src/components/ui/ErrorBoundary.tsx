/**
 * React Error Boundary Component
 * Catches and handles React component errors with neural-themed fallback UI
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorReporter } from '../../utils/errors';

// === Types ===

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

// === Error Boundary Component ===

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report error through our error reporting system
    const errorDetails = ErrorReporter.report(error, {
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        props: this.props.resetKeys,
        timestamp: new Date().toISOString()
      },
      skipToast: false // Show toast for component errors
    });

    this.setState({
      errorInfo,
      eventId: errorDetails.requestId || null
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys = [], resetOnPropsChange = true } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetOnPropsChange) {
        // Check if any reset keys changed
        const hasResetKeyChanged = resetKeys.some((key, index) => 
          prevProps.resetKeys?.[index] !== key
        );

        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleReportProblem = () => {
    // Open support or feedback form
    const { error, errorInfo, eventId } = this.state;
    const errorReport = {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      eventId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Copy to clipboard or open support page
    navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error details copied to clipboard. Please include this when contacting support.');
      })
      .catch(() => {
        alert('Unable to copy error details. Please contact support and mention the error ID: ' + eventId);
      });
  };

  render() {
    const { hasError, error, errorInfo, eventId } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      // Custom fallback UI provided
      if (fallback) {
        return fallback;
      }

      // Default neural-themed error UI
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-bg-secondary border border-neural-cyan/20 rounded-lg p-6 text-center">
            {/* Error Icon */}
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-red-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <h2 className="text-xl font-bold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-300 mb-6">
              An unexpected error occurred in this part of the application. 
              We apologize for the inconvenience.
            </p>

            {/* Error ID */}
            {eventId && (
              <div className="bg-bg-tertiary rounded-lg p-3 mb-4 text-sm">
                <span className="text-gray-400">Error ID: </span>
                <span className="text-neural-cyan font-mono">{eventId}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-neural-cyan hover:bg-neural-dark text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-neural-cyan focus:ring-offset-2 focus:ring-offset-bg-secondary"
              >
                Try Again
              </button>
              <button
                onClick={this.handleRefresh}
                className="flex-1 bg-bg-tertiary hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-bg-secondary"
              >
                Refresh Page
              </button>
            </div>

            {/* Report Problem */}
            <button
              onClick={this.handleReportProblem}
              className="text-neural-cyan hover:text-neural-light text-sm underline focus:outline-none focus:ring-2 focus:ring-neural-cyan focus:ring-offset-2 focus:ring-offset-bg-secondary rounded"
            >
              Report this problem
            </button>

            {/* Error Details (Development/Debug Mode) */}
            {showDetails && error && (
              <details className="mt-6 text-left">
                <summary className="text-neural-cyan cursor-pointer hover:text-neural-light mb-2">
                  Show error details
                </summary>
                <div className="bg-bg-primary rounded-lg p-4 text-xs font-mono">
                  <div className="text-red-400 mb-2">
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div className="text-gray-400 mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div className="text-gray-400">
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

// === HOC for easier usage ===

export interface WithErrorBoundaryOptions extends Omit<ErrorBoundaryProps, 'children'> {
  name?: string;
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${options.name || Component.displayName || Component.name})`;

  return WrappedComponent;
}

// === Hook for manual error reporting ===

export function useErrorHandler() {
  const reportError = React.useCallback((error: unknown, context?: Record<string, any>) => {
    return ErrorReporter.report(error, { context });
  }, []);

  return { reportError };
}

// === Async Error Boundary for async operations ===

interface AsyncErrorBoundaryProps extends ErrorBoundaryProps {
  onAsyncError?: (error: Error) => void;
}

export function AsyncErrorBoundary({ children, onAsyncError, ...props }: AsyncErrorBoundaryProps) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      
      ErrorReporter.report(error, {
        context: {
          asyncError: true,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      });

      if (onAsyncError) {
        onAsyncError(error);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onAsyncError]);

  return <ErrorBoundary {...props}>{children}</ErrorBoundary>;
}

export default ErrorBoundary;
/**
 * Error Modal Component
 * Detailed error information modal with recovery options and neural theme
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorDetails, getErrorIcon, getSeverityColor } from '../../utils/errors';

// === Types ===

export interface ErrorModalProps {
  isOpen: boolean;
  error: ErrorDetails | null;
  onClose: () => void;
  onRetry?: () => void | Promise<void>;
  onContactSupport?: () => void;
  showTechnicalDetails?: boolean;
  className?: string;
}

// === Error Modal Component ===

export function ErrorModal({
  isOpen,
  error,
  onClose,
  onRetry,
  onContactSupport,
  showTechnicalDetails = false,
  className = ''
}: ErrorModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Focus management
  const modalRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle recovery actions
  const handleRecoveryAction = async (action: string, handler?: () => void | Promise<void>) => {
    try {
      switch (action) {
        case 'retry':
          if (onRetry) {
            await onRetry();
          } else if (handler) {
            await handler();
          }
          onClose();
          break;
        case 'refresh':
          window.location.reload();
          break;
        case 'logout':
          // Clear auth and redirect to login
          localStorage.removeItem('veo_auth_token');
          window.location.href = '/auth';
          break;
        case 'contact_support':
          if (onContactSupport) {
            onContactSupport();
          } else {
            // Default support action
            window.open('mailto:support@lostmindai.com?subject=Error Report&body=' + 
              encodeURIComponent(`Error ID: ${error?.requestId}\nTimestamp: ${error?.timestamp}\nMessage: ${error?.message}`));
          }
          break;
        case 'custom':
          if (handler) {
            await handler();
          }
          onClose();
          break;
        default:
          if (handler) {
            await handler();
          }
          onClose();
      }
    } catch (actionError) {
      console.error('Recovery action failed:', actionError);
    }
  };

  const copyErrorDetails = async () => {
    if (!error) return;

    const errorDetails = {
      type: error.type,
      severity: error.severity,
      message: error.message,
      userMessage: error.userMessage,
      code: error.code,
      requestId: error.requestId,
      timestamp: error.timestamp,
      context: error.context,
      details: error.details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      // You could show a toast here if available
      console.log('Error details copied to clipboard');
    } catch (clipboardError) {
      console.error('Failed to copy error details:', clipboardError);
      // Fallback: show in alert
      alert('Error details:\n' + JSON.stringify(errorDetails, null, 2));
    }
  };

  if (!isOpen || !error) return null;

  const severityColor = getSeverityColor(error.severity);
  const errorIcon = getErrorIcon(error.type);

  const modal = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={`
              relative bg-bg-secondary border border-neural-cyan/20 rounded-lg shadow-xl 
              max-w-md w-full max-h-[90vh] overflow-hidden ${className}
            `}
            role="dialog"
            aria-modal="true"
            aria-labelledby="error-modal-title"
            aria-describedby="error-modal-description"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                {/* Error Icon */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${severityColor}20` }}
                >
                  <span 
                    className="text-lg"
                    style={{ color: severityColor }}
                    aria-hidden="true"
                  >
                    {errorIcon}
                  </span>
                </div>

                <div>
                  <h2 id="error-modal-title" className="text-lg font-semibold text-white">
                    {error.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </h2>
                  <p className="text-sm text-gray-400 capitalize">
                    {error.severity.toLowerCase()} severity
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-neural-cyan focus:ring-offset-2 focus:ring-offset-bg-secondary rounded p-1"
                aria-label="Close error dialog"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {/* User Message */}
              <div className="mb-6">
                <p id="error-modal-description" className="text-gray-300 leading-relaxed">
                  {error.userMessage}
                </p>
              </div>

              {/* Error ID */}
              {error.requestId && (
                <div className="mb-4 p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Error ID</p>
                      <p className="text-sm font-mono text-neural-cyan">{error.requestId}</p>
                    </div>
                    <button
                      onClick={copyErrorDetails}
                      className="text-xs text-gray-400 hover:text-white underline focus:outline-none focus:ring-2 focus:ring-neural-cyan focus:ring-offset-1 focus:ring-offset-bg-tertiary rounded px-1"
                      title="Copy error details"
                    >
                      Copy Details
                    </button>
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="mb-4 text-xs text-gray-500">
                Occurred at {new Date(error.timestamp).toLocaleString()}
              </div>

              {/* Technical Details (collapsible) */}
              {showTechnicalDetails && (error.details || error.context) && (
                <details className="mb-4">
                  <summary className="text-sm text-neural-cyan cursor-pointer hover:text-neural-light mb-2 focus:outline-none focus:ring-2 focus:ring-neural-cyan focus:ring-offset-1 focus:ring-offset-bg-secondary rounded px-1">
                    Technical Details
                  </summary>
                  <div className="bg-bg-primary rounded-lg p-3 text-xs font-mono max-h-40 overflow-y-auto">
                    {error.details && (
                      <div className="mb-2">
                        <strong className="text-gray-400">Details:</strong>
                        <pre className="text-gray-300 whitespace-pre-wrap mt-1">
                          {typeof error.details === 'string' 
                            ? error.details 
                            : JSON.stringify(error.details, null, 2)
                          }
                        </pre>
                      </div>
                    )}
                    {error.context && (
                      <div>
                        <strong className="text-gray-400">Context:</strong>
                        <pre className="text-gray-300 whitespace-pre-wrap mt-1">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Recovery Actions */}
              {error.recoveryActions && error.recoveryActions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Available Actions</h3>
                  <div className="space-y-2">
                    {error.recoveryActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecoveryAction(action.action, action.handler)}
                        className={`
                          w-full text-left px-4 py-3 rounded-lg border transition-colors
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-secondary
                          ${action.action === 'retry' 
                            ? 'bg-neural-cyan hover:bg-neural-dark text-white border-neural-cyan focus:ring-neural-cyan'
                            : 'bg-bg-tertiary hover:bg-gray-600 text-gray-300 border-gray-600 focus:ring-gray-500'
                          }
                        `}
                      >
                        <span className="font-medium">{action.label}</span>
                        {action.action === 'retry' && (
                          <p className="text-xs opacity-80 mt-1">
                            Attempt the operation again
                          </p>
                        )}
                        {action.action === 'refresh' && (
                          <p className="text-xs opacity-80 mt-1">
                            Reload the page to reset the application state
                          </p>
                        )}
                        {action.action === 'contact_support' && (
                          <p className="text-xs opacity-80 mt-1">
                            Get help from our support team
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-bg-tertiary border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-transparent border border-gray-600 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-bg-tertiary transition-colors"
              >
                Close
              </button>
              
              {error.recoveryActions?.find(action => action.action === 'retry') && (
                <button
                  onClick={() => handleRecoveryAction('retry')}
                  className="px-4 py-2 text-sm font-medium text-white bg-neural-cyan hover:bg-neural-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-neural-cyan focus:ring-offset-2 focus:ring-offset-bg-tertiary transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );

  // Render in portal
  const container = document.getElementById('modal-container') || document.body;
  return createPortal(modal, container);
}

// === Hook for Error Modal ===

export function useErrorModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [error, setError] = React.useState<ErrorDetails | null>(null);

  const showError = React.useCallback((errorDetails: ErrorDetails) => {
    setError(errorDetails);
    setIsOpen(true);
  }, []);

  const hideError = React.useCallback(() => {
    setIsOpen(false);
    // Clear error after animation completes
    setTimeout(() => setError(null), 200);
  }, []);

  return {
    isOpen,
    error,
    showError,
    hideError
  };
}

export default ErrorModal;
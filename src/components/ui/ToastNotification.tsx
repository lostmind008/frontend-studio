/**
 * Toast Notification System
 * Neural-themed toast notifications with accessibility and error integration
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorDetails, ErrorType, ErrorSeverity } from '../../utils/errors';

// === Types ===

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
  onClose?: () => void;
  onAction?: (actionId: string) => void;
  dismissible?: boolean;
  position?: ToastPosition;
}

export interface ToastAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  handler?: () => void | Promise<void>;
}

export type ToastPosition = 
  | 'top-right' 
  | 'top-left' 
  | 'top-center' 
  | 'bottom-right' 
  | 'bottom-left' 
  | 'bottom-center';

interface Toast extends ToastOptions {
  id: string;
  timestamp: number;
  visible: boolean;
}

// === Toast Context ===

interface ToastContextValue {
  toasts: Toast[];
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  dismissAll: () => void;
  success: (message: string, options?: Partial<ToastOptions>) => string;
  error: (message: string, options?: Partial<ToastOptions>) => string;
  warning: (message: string, options?: Partial<ToastOptions>) => string;
  info: (message: string, options?: Partial<ToastOptions>) => string;
  loading: (message: string, options?: Partial<ToastOptions>) => string;
  fromError: (error: ErrorDetails, options?: Partial<ToastOptions>) => string;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

// === Toast Manager ===

class ToastManager {
  private static instance: ToastManager;
  private listeners: Set<(toasts: Toast[]) => void> = new Set();
  private toasts: Toast[] = [];
  private nextId = 1;

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  addToast(options: ToastOptions): string {
    const id = options.id || `toast-${this.nextId++}`;
    const toast: Toast = {
      ...options,
      id,
      timestamp: Date.now(),
      visible: true,
      duration: options.duration ?? (options.type === 'error' ? 8000 : 5000),
      dismissible: options.dismissible ?? true,
      position: options.position ?? 'top-right'
    };

    // Remove existing toast with same ID
    this.toasts = this.toasts.filter(t => t.id !== id);
    
    // Add new toast
    this.toasts.push(toast);
    this.notify();

    // Auto-remove if not persistent
    if (!toast.persistent && toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, toast.duration);
    }

    return id;
  }

  removeToast(id: string): void {
    const toastIndex = this.toasts.findIndex(t => t.id === id);
    if (toastIndex >= 0) {
      const toast = this.toasts[toastIndex];
      
      // Mark as not visible first for animation
      this.toasts[toastIndex] = { ...toast, visible: false };
      this.notify();

      // Remove after animation
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.notify();
        
        // Call onClose callback
        if (toast.onClose) {
          toast.onClose();
        }
      }, 300);
    }
  }

  clearAll(): void {
    this.toasts.forEach(toast => {
      if (toast.onClose) {
        toast.onClose();
      }
    });
    this.toasts = [];
    this.notify();
  }

  updateToast(id: string, updates: Partial<ToastOptions>): void {
    const toastIndex = this.toasts.findIndex(t => t.id === id);
    if (toastIndex >= 0) {
      this.toasts[toastIndex] = { ...this.toasts[toastIndex], ...updates };
      this.notify();
    }
  }

  // Convenience methods
  success(message: string, options: Partial<ToastOptions> = {}): string {
    return this.addToast({ ...options, message, type: 'success' });
  }

  error(message: string, options: Partial<ToastOptions> = {}): string {
    return this.addToast({ ...options, message, type: 'error', duration: 8000 });
  }

  warning(message: string, options: Partial<ToastOptions> = {}): string {
    return this.addToast({ ...options, message, type: 'warning' });
  }

  info(message: string, options: Partial<ToastOptions> = {}): string {
    return this.addToast({ ...options, message, type: 'info' });
  }

  loading(message: string, options: Partial<ToastOptions> = {}): string {
    return this.addToast({ 
      ...options, 
      message, 
      type: 'loading', 
      persistent: true,
      dismissible: false 
    });
  }

  fromError(error: ErrorDetails, options: Partial<ToastOptions> = {}): string {
    const actions: ToastAction[] = error.recoveryActions?.map(action => ({
      id: action.action,
      label: action.label,
      variant: action.action === 'retry' ? 'primary' : 'secondary',
      handler: action.handler
    })) || [];

    return this.addToast({
      ...options,
      type: 'error',
      title: this.getErrorTitle(error.type),
      message: error.userMessage,
      duration: error.severity === ErrorSeverity.CRITICAL ? 0 : 8000, // Critical errors don't auto-dismiss
      persistent: error.severity === ErrorSeverity.CRITICAL,
      actions
    });
  }

  private getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Connection Problem';
      case ErrorType.AUTHENTICATION:
        return 'Authentication Required';
      case ErrorType.AUTHORIZATION:
        return 'Access Denied';
      case ErrorType.VALIDATION:
        return 'Input Error';
      case ErrorType.RATE_LIMIT:
        return 'Rate Limited';
      case ErrorType.SERVER:
        return 'Server Error';
      case ErrorType.TIMEOUT:
        return 'Request Timeout';
      case ErrorType.QUOTA_EXCEEDED:
        return 'Quota Exceeded';
      case ErrorType.FILE_TOO_LARGE:
        return 'File Too Large';
      case ErrorType.UNSUPPORTED_FORMAT:
        return 'Unsupported Format';
      case ErrorType.GENERATION_FAILED:
        return 'Generation Failed';
      default:
        return 'Error';
    }
  }
}

// === Toast Provider ===

interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export function ToastProvider({ children, position = 'top-right', maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const manager = ToastManager.getInstance();

  useEffect(() => {
    return manager.subscribe(setToasts);
  }, [manager]);

  const contextValue: ToastContextValue = {
    toasts,
    addToast: (options) => manager.addToast({ ...options, position }),
    removeToast: (id) => manager.removeToast(id),
    clearAll: () => manager.clearAll(),
    dismissAll: () => manager.clearAll(),
    success: (message, options) => manager.success(message, { ...options, position }),
    error: (message, options) => manager.error(message, { ...options, position }),
    warning: (message, options) => manager.warning(message, { ...options, position }),
    info: (message, options) => manager.info(message, { ...options, position }),
    loading: (message, options) => manager.loading(message, { ...options, position }),
    fromError: (error, options) => manager.fromError(error, { ...options, position })
  };

  // Limit number of visible toasts
  const visibleToasts = toasts.slice(-maxToasts);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={visibleToasts} position={position} />
    </ToastContext.Provider>
  );
}

// === Toast Container ===

interface ToastContainerProps {
  toasts: Toast[];
  position: ToastPosition;
}

function ToastContainer({ toasts, position }: ToastContainerProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let element = document.getElementById('toast-container');
    if (!element) {
      element = document.createElement('div');
      element.id = 'toast-container';
      document.body.appendChild(element);
    }
    setContainer(element);

    return () => {
      if (element && element.childNodes.length === 0) {
        document.body.removeChild(element);
      }
    };
  }, []);

  if (!container) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return createPortal(
    <div 
      className={`fixed z-50 pointer-events-none ${positionClasses[position]} max-w-sm w-full`}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>,
    container
  );
}

// === Toast Item Component ===

interface ToastItemProps {
  toast: Toast;
}

function ToastItem({ toast }: ToastItemProps) {
  const manager = ToastManager.getInstance();

  const typeConfig = {
    success: {
      icon: '✓',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-400',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400'
    },
    error: {
      icon: '✕',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-400',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400'
    },
    warning: {
      icon: '⚠',
      bgColor: 'bg-yellow-500',
      borderColor: 'border-yellow-400',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400'
    },
    info: {
      icon: 'ℹ',
      bgColor: 'bg-neural-cyan',
      borderColor: 'border-neural-cyan',
      iconBg: 'bg-neural-cyan/20',
      iconColor: 'text-neural-cyan'
    },
    loading: {
      icon: '⟳',
      bgColor: 'bg-neural-cyan',
      borderColor: 'border-neural-cyan',
      iconBg: 'bg-neural-cyan/20',
      iconColor: 'text-neural-cyan'
    }
  };

  const config = typeConfig[toast.type || 'info'];

  const handleAction = async (action: ToastAction) => {
    if (action.handler) {
      try {
        await action.handler();
      } catch (error) {
        console.error('Toast action failed:', error);
      }
    }
    
    if (toast.onAction) {
      toast.onAction(action.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: toast.visible ? 1 : 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="pointer-events-auto mb-3"
    >
      <div 
        className={`
          bg-bg-secondary border ${config.borderColor} rounded-lg shadow-lg 
          backdrop-blur-sm p-4 max-w-sm w-full
        `}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-6 h-6 rounded-full ${config.iconBg} flex items-center justify-center`}>
            {toast.type === 'loading' ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className={`w-4 h-4 ${config.iconColor}`}
              >
                {config.icon}
              </motion.div>
            ) : (
              <span className={`text-sm ${config.iconColor}`}>
                {config.icon}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="text-sm font-medium text-white mb-1">
                {toast.title}
              </h4>
            )}
            <p className="text-sm text-gray-300">
              {toast.message}
            </p>

            {/* Actions */}
            {toast.actions && toast.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {toast.actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    className={`
                      px-3 py-1 text-xs font-medium rounded transition-colors
                      focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-bg-secondary
                      ${action.variant === 'primary' 
                        ? `${config.bgColor} text-white hover:opacity-90 focus:ring-white`
                        : action.variant === 'ghost'
                        ? `text-gray-300 hover:text-white focus:ring-gray-400`
                        : `bg-bg-tertiary text-gray-300 hover:bg-gray-600 hover:text-white focus:ring-gray-400`
                      }
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          {toast.dismissible && (
            <button
              onClick={() => manager.removeToast(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 focus:ring-offset-bg-secondary rounded p-1"
              aria-label="Dismiss notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// === Hooks ===

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// === Standalone Toast Functions (can be used without context) ===

const globalManager = ToastManager.getInstance();

export const toast = {
  success: (message: string, options?: Partial<ToastOptions>) => 
    globalManager.success(message, options),
  error: (message: string, options?: Partial<ToastOptions>) => 
    globalManager.error(message, options),
  warning: (message: string, options?: Partial<ToastOptions>) => 
    globalManager.warning(message, options),
  info: (message: string, options?: Partial<ToastOptions>) => 
    globalManager.info(message, options),
  loading: (message: string, options?: Partial<ToastOptions>) => 
    globalManager.loading(message, options),
  fromError: (error: ErrorDetails, options?: Partial<ToastOptions>) => 
    globalManager.fromError(error, options),
  dismiss: (id: string) => globalManager.removeToast(id),
  dismissAll: () => globalManager.clearAll()
};

export default ToastProvider;
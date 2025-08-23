/**
 * Retry Button Component
 * Intelligent retry button with exponential backoff and loading states
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RetryManager, RetryOptions } from '../../utils/errors';

// === Types ===

export interface RetryButtonProps {
  onRetry: () => Promise<void> | void;
  children?: React.ReactNode;
  retryOptions?: RetryOptions;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showAttempts?: boolean;
  cooldownMessage?: string;
  maxVisibleAttempts?: number;
}

// === Retry Button Component ===

export function RetryButton({
  onRetry,
  children = 'Retry',
  retryOptions = {},
  disabled = false,
  className = '',
  variant = 'primary',
  size = 'md',
  showAttempts = true,
  cooldownMessage = 'Please wait before retrying...',
  maxVisibleAttempts = 3
}: RetryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // Countdown timer for cooldown
  React.useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  const handleRetry = useCallback(async () => {
    if (isLoading || cooldownTime > 0 || disabled) return;

    setIsLoading(true);
    setLastError(null);

    try {
      const retryFn = async () => {
        const result = onRetry();
        if (result instanceof Promise) {
          await result;
        }
      };

      await RetryManager.withRetry(retryFn, {
        maxAttempts: retryOptions.maxAttempts || 3,
        baseDelay: retryOptions.baseDelay || 1000,
        maxDelay: retryOptions.maxDelay || 30000,
        backoffFactor: retryOptions.backoffFactor || 2,
        jitter: retryOptions.jitter !== false,
        onRetry: (attempt, error) => {
          setAttempts(attempt);
          if (retryOptions.onRetry) {
            retryOptions.onRetry(attempt, error);
          }
        }
      });

      // Success - reset attempts
      setAttempts(0);
      
    } catch (error) {
      // Failed after all retries
      const maxAttempts = retryOptions.maxAttempts || 3;
      setAttempts(maxAttempts);
      setLastError(error instanceof Error ? error.message : 'Retry failed');
      
      // Set cooldown period (exponential backoff)
      const cooldown = Math.min(
        (retryOptions.baseDelay || 1000) * Math.pow(retryOptions.backoffFactor || 2, maxAttempts),
        retryOptions.maxDelay || 30000
      );
      setCooldownTime(Math.ceil(cooldown / 1000));
      
    } finally {
      setIsLoading(false);
    }
  }, [onRetry, retryOptions, isLoading, cooldownTime, disabled]);

  // Reset attempts after a period of inactivity
  React.useEffect(() => {
    if (attempts > 0 && !isLoading && cooldownTime === 0) {
      const resetTimer = setTimeout(() => {
        setAttempts(0);
        setLastError(null);
      }, 60000); // Reset after 1 minute of inactivity
      
      return () => clearTimeout(resetTimer);
    }
  }, [attempts, isLoading, cooldownTime]);

  // Variant styles
  const variantStyles = {
    primary: {
      base: 'bg-neural-cyan hover:bg-neural-dark text-white border-neural-cyan',
      disabled: 'bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed',
      focus: 'focus:ring-neural-cyan'
    },
    secondary: {
      base: 'bg-bg-tertiary hover:bg-gray-600 text-gray-300 border-gray-600 hover:text-white',
      disabled: 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed',
      focus: 'focus:ring-gray-500'
    },
    ghost: {
      base: 'bg-transparent hover:bg-bg-tertiary text-gray-300 border-transparent hover:text-white',
      disabled: 'bg-transparent text-gray-600 border-transparent cursor-not-allowed',
      focus: 'focus:ring-gray-500'
    }
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const isDisabled = disabled || isLoading || cooldownTime > 0;
  const currentVariant = variantStyles[variant];
  const buttonClasses = `
    ${currentVariant[isDisabled ? 'disabled' : 'base']}
    ${sizeStyles[size]}
    ${currentVariant.focus}
    border rounded-lg font-medium transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-secondary
    flex items-center gap-2 relative overflow-hidden
    ${className}
  `;

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleRetry}
        disabled={isDisabled}
        className={buttonClasses}
        aria-label={
          cooldownTime > 0 
            ? `Retry in ${cooldownTime} seconds`
            : attempts > 0 
            ? `Retry (attempt ${attempts + 1})`
            : 'Retry operation'
        }
      >
        {/* Loading/Retry Icon */}
        {isLoading ? (
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </motion.svg>
        ) : cooldownTime > 0 ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        )}

        {/* Button Text */}
        <span>
          {isLoading 
            ? 'Retrying...'
            : cooldownTime > 0
            ? `Wait ${cooldownTime}s`
            : children
          }
        </span>

        {/* Attempt Counter */}
        {showAttempts && attempts > 0 && attempts <= maxVisibleAttempts && (
          <span className="text-xs opacity-75">
            ({attempts}/{retryOptions.maxAttempts || 3})
          </span>
        )}

        {/* Loading Progress Bar */}
        {isLoading && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-white/30"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ 
              duration: (retryOptions.baseDelay || 1000) / 1000,
              ease: "easeInOut" 
            }}
          />
        )}
      </button>

      {/* Status Messages */}
      <div className="min-h-[1.25rem] text-xs">
        {cooldownTime > 0 && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-yellow-400"
          >
            {cooldownMessage}
          </motion.p>
        )}
        
        {lastError && cooldownTime === 0 && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400"
          >
            {lastError}
          </motion.p>
        )}
        
        {attempts > 0 && !isLoading && cooldownTime === 0 && !lastError && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-gray-400"
          >
            {attempts === (retryOptions.maxAttempts || 3) 
              ? 'All retry attempts used'
              : `${attempts} attempt${attempts > 1 ? 's' : ''} made`
            }
          </motion.p>
        )}
      </div>
    </div>
  );
}

// === Smart Retry Hook ===

export interface UseRetryOptions extends RetryOptions {
  autoReset?: boolean;
  resetDelay?: number;
}

export function useRetry(
  operation: () => Promise<void> | void,
  options: UseRetryOptions = {}
) {
  const [state, setState] = useState({
    isLoading: false,
    attempts: 0,
    lastError: null as string | null,
    cooldownTime: 0
  });

  const retry = useCallback(async () => {
    if (state.isLoading || state.cooldownTime > 0) return;

    setState(prev => ({ ...prev, isLoading: true, lastError: null }));

    try {
      const retryFn = async () => {
        const result = operation();
        if (result instanceof Promise) {
          await result;
        }
      };

      await RetryManager.withRetry(retryFn, {
        maxAttempts: options.maxAttempts || 3,
        baseDelay: options.baseDelay || 1000,
        maxDelay: options.maxDelay || 30000,
        backoffFactor: options.backoffFactor || 2,
        jitter: options.jitter !== false,
        onRetry: (attempt, error) => {
          setState(prev => ({ ...prev, attempts: attempt }));
          if (options.onRetry) {
            options.onRetry(attempt, error);
          }
        }
      });

      // Success - reset attempts
      setState(prev => ({ ...prev, attempts: 0, isLoading: false }));
      
    } catch (error) {
      // Failed after all retries
      const maxAttempts = options.maxAttempts || 3;
      const errorMessage = error instanceof Error ? error.message : 'Operation failed';
      
      setState(prev => ({
        ...prev,
        attempts: maxAttempts,
        lastError: errorMessage,
        isLoading: false
      }));
      
      // Set cooldown period
      const cooldown = Math.min(
        (options.baseDelay || 1000) * Math.pow(options.backoffFactor || 2, maxAttempts),
        options.maxDelay || 30000
      );
      
      setState(prev => ({ ...prev, cooldownTime: Math.ceil(cooldown / 1000) }));
    }
  }, [operation, options, state.isLoading, state.cooldownTime]);

  const reset = useCallback(() => {
    setState({ isLoading: false, attempts: 0, lastError: null, cooldownTime: 0 });
  }, []);

  // Cooldown countdown
  React.useEffect(() => {
    if (state.cooldownTime > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, cooldownTime: prev.cooldownTime - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.cooldownTime]);

  // Auto reset
  React.useEffect(() => {
    if (options.autoReset && state.attempts > 0 && !state.isLoading && state.cooldownTime === 0) {
      const resetTimer = setTimeout(() => {
        reset();
      }, options.resetDelay || 60000);
      
      return () => clearTimeout(resetTimer);
    }
  }, [options.autoReset, options.resetDelay, state.attempts, state.isLoading, state.cooldownTime, reset]);

  return {
    ...state,
    retry,
    reset,
    canRetry: !state.isLoading && state.cooldownTime === 0
  };
}

export default RetryButton;
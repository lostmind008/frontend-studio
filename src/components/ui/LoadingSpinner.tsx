/**
 * Loading Spinner and Skeleton Components
 * Neural-themed loading states with accessibility support
 */

import React from 'react';
import { motion } from 'framer-motion';

// === Types ===

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'neural' | 'bars';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  label?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number;
}

export interface LoadingStateProps {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  minDuration?: number;
  className?: string;
}

// === Loading Spinner Component ===

export function LoadingSpinner({
  size = 'md',
  variant = 'neural',
  color = 'primary',
  className = '',
  label = 'Loading...',
  fullScreen = false,
  overlay = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-neural-cyan',
    secondary: 'text-gray-400',
    white: 'text-white',
    gray: 'text-gray-600'
  };

  const spinnerSize = sizeClasses[size];
  const spinnerColor = colorClasses[color];

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className={`${spinnerSize} ${spinnerColor}`}
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              className="opacity-75"
            />
          </motion.svg>
        );

      case 'dots':
        return (
          <div className={`flex space-x-1 ${className}`}>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2
                }}
                className={`w-2 h-2 ${spinnerColor} bg-current rounded-full`}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`${spinnerSize} ${spinnerColor} bg-current rounded-full`}
          />
        );

      case 'neural':
        return (
          <div className={`relative ${spinnerSize}`}>
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <svg
                className="w-full h-full"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="20 10"
                  className={`${spinnerColor} opacity-60`}
                />
              </svg>
            </motion.div>
            
            {/* Inner ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2"
            >
              <svg
                className="w-full h-full"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="15 5"
                  className={spinnerColor}
                />
              </svg>
            </motion.div>
            
            {/* Center dot */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute inset-0 m-auto w-2 h-2 ${spinnerColor} bg-current rounded-full`}
            />
          </div>
        );

      case 'bars':
        return (
          <div className={`flex space-x-1 ${className}`}>
            {[0, 1, 2, 3].map((index) => (
              <motion.div
                key={index}
                animate={{
                  scaleY: [1, 2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.1
                }}
                className={`w-1 h-4 ${spinnerColor} bg-current rounded-full`}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const spinner = (
    <div 
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {renderSpinner()}
      {label && (
        <span className="mt-2 text-sm text-gray-400 sr-only">
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-primary flex items-center justify-center">
        {overlay && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        )}
        <div className="relative">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}

// === Skeleton Component ===

export function Skeleton({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'rectangular',
  animation = 'pulse',
  lines = 1
}: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse-slow',
    none: ''
  };

  const skeletonClasses = `
    ${baseClasses} 
    ${variantClasses[variant]} 
    ${animationClasses[animation]} 
    ${className}
  `;

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={`${skeletonClasses} ${index === lines - 1 ? 'w-3/4' : ''}`}
            style={index === lines - 1 ? { ...style, width: '75%' } : style}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={skeletonClasses}
      style={style}
      aria-hidden="true"
    />
  );
}

// === Loading State Wrapper ===

export function LoadingState({
  loading,
  children,
  fallback,
  delay = 0,
  minDuration = 0,
  className = ''
}: LoadingStateProps) {
  const [showLoading, setShowLoading] = React.useState(loading && delay === 0);
  const [startTime, setStartTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    let delayTimer: number;
    let minDurationTimer: number;

    if (loading) {
      setStartTime(Date.now());
      
      if (delay > 0) {
        delayTimer = window.setTimeout(() => {
          setShowLoading(true);
        }, delay);
      } else {
        setShowLoading(true);
      }
    } else {
      if (startTime && minDuration > 0) {
        const elapsed = Date.now() - startTime;
        const remaining = minDuration - elapsed;
        
        if (remaining > 0) {
          minDurationTimer = window.setTimeout(() => {
            setShowLoading(false);
          }, remaining);
        } else {
          setShowLoading(false);
        }
      } else {
        setShowLoading(false);
      }
    }

    return () => {
      window.clearTimeout(delayTimer);
      window.clearTimeout(minDurationTimer);
    };
  }, [loading, delay, minDuration, startTime]);

  if (showLoading) {
    return (
      <div className={className}>
        {fallback || <LoadingSpinner />}
      </div>
    );
  }

  return <>{children}</>;
}

// === Skeleton Presets ===

export function TextSkeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <Skeleton
      variant="text"
      height="1rem"
      lines={lines}
      className={className}
    />
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border border-gray-700 rounded-lg bg-bg-secondary ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton width="60%" height="1rem" className="mb-2" />
          <Skeleton width="40%" height="0.75rem" />
        </div>
      </div>
      <TextSkeleton lines={2} />
    </div>
  );
}

export function ListSkeleton({ 
  items = 3, 
  className = '' 
}: { 
  items?: number; 
  className?: string; 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className="flex items-center space-x-3">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex-1">
            <Skeleton width="70%" height="1rem" className="mb-1" />
            <Skeleton width="40%" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VideoCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-bg-secondary border border-gray-700 rounded-lg overflow-hidden ${className}`}>
      <Skeleton variant="rectangular" height={200} className="rounded-none" />
      <div className="p-4">
        <Skeleton width="80%" height="1.25rem" className="mb-2" />
        <div className="flex items-center justify-between">
          <Skeleton width="30%" height="0.875rem" />
          <Skeleton width="20%" height="0.875rem" />
        </div>
      </div>
    </div>
  );
}

// === Hooks ===

export function useLoadingState(initialLoading = false) {
  const [loading, setLoading] = React.useState(initialLoading);

  const withLoading = React.useCallback(async <T,>(
    promise: Promise<T>
  ): Promise<T> => {
    setLoading(true);
    try {
      const result = await promise;
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    setLoading,
    withLoading
  };
}

export default LoadingSpinner;
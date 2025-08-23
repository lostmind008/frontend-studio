/**
 * Sentry Error Reporting Configuration
 * Features: Error boundaries, PII scrubbing, release tracking
 */

import React from 'react';
import * as Sentry from '@sentry/react';

// Sentry Configuration
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'development';
const RELEASE = import.meta.env.VITE_APP_VERSION || '1.0.0';

// Initialize Sentry
export const initializeSentry = (): void => {
  if (typeof window === 'undefined' || !SENTRY_DSN) {
    console.log('Sentry: Skipping initialization (missing DSN or server-side)');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `lostmind-video-studio@${RELEASE}`,
    
    // Performance Monitoring (simplified)
    integrations: [],

    // Performance Sampling
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Session Tracking (handled automatically by Sentry)
    
    // Error Sampling
    sampleRate: 1.0, // Capture all errors
    
    // Privacy and Security
    beforeSend(event, hint) {
      // Scrub PII from error events
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      
      // Scrub sensitive data from URLs and form data
      if (event.request?.url) {
        event.request.url = event.request.url.replace(
          /([?&])(token|key|password|secret)=([^&]*)/gi,
          '$1$2=[FILTERED]'
        );
      }
      
      // Filter out network errors that are not actionable
      if (hint.originalException && typeof hint.originalException === 'object') {
        const error = hint.originalException as any;
        if (error.code === 'NETWORK_ERROR' && error.message?.includes('ERR_INTERNET_DISCONNECTED')) {
          return null; // Don't send connection errors
        }
      }
      
      return event;
    },

    // Additional filtering
    beforeBreadcrumb(breadcrumb) {
      // Don't log console messages in production
      if (breadcrumb.category === 'console' && ENVIRONMENT === 'production') {
        return null;
      }
      
      // Scrub sensitive data from breadcrumbs
      if (breadcrumb.data && typeof breadcrumb.data === 'object') {
        const data = { ...breadcrumb.data };
        Object.keys(data).forEach(key => {
          if (/token|key|password|secret|auth/i.test(key)) {
            data[key] = '[FILTERED]';
          }
        });
        breadcrumb.data = data;
      }
      
      return breadcrumb;
    },

    // Custom tags
    initialScope: {
      tags: {
        component: 'frontend',
        platform: 'web'
      },
      contexts: {
        app: {
          name: 'LostMind AI Video Studio',
          version: RELEASE
        }
      }
    }
  });

  console.log('Sentry: Initialized for environment:', ENVIRONMENT);
};

// User Context Management
export const setSentryUser = (user: {
  id: string;
  email?: string;
  tier?: string;
  is_admin?: boolean;
}): void => {
  Sentry.setUser({
    id: user.id,
    email: user.email, // This is okay for our use case, but consider hashing in stricter environments
    tier: user.tier,
    is_admin: user.is_admin
  });
};

export const clearSentryUser = (): void => {
  Sentry.setUser(null);
};

// Custom Error Reporting
export const reportError = (
  error: Error,
  context: {
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    fingerprint?: string[];
  } = {}
): void => {
  Sentry.withScope(scope => {
    // Set level
    scope.setLevel(context.level || 'error');
    
    // Add tags
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    // Add extra context
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    // Set fingerprint for grouping
    if (context.fingerprint) {
      scope.setFingerprint(context.fingerprint);
    }
    
    Sentry.captureException(error);
  });
};

// Capture Messages (for non-error events)
export const captureMessage = (
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  extra?: Record<string, any>
): void => {
  Sentry.withScope(scope => {
    scope.setLevel(level);
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureMessage(message);
  });
};

// Performance Monitoring
export const startTransaction = (name: string, operation = 'navigation') => {
  // Using the newer transaction API
  return Sentry.startSpan({
    name,
    op: operation,
  }, () => {});
};

// React Error Boundary
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Higher-order component for automatic error boundary
export const withSentryErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    showDialog?: boolean;
  }
) => {
  return Sentry.withErrorBoundary(Component, {
    fallback: () => React.createElement('div', { 
      style: { padding: '20px', textAlign: 'center', color: 'white', background: '#1a1a1b' } 
    }, 'Something went wrong. Please refresh the page.'),
    showDialog: options?.showDialog || false,
  });
};

// Utility to check if Sentry is initialized
export const isSentryInitialized = (): boolean => {
  return !!Sentry.getClient();
};

// Re-export commonly used Sentry functions
export {
  Sentry,
  Sentry as SentryClient
};
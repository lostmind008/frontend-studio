/**
 * Google Analytics 4 (GA4) Implementation
 * Events: generate_start/complete, retry_503, error_toast, upgrade_click
 */

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
    dataLayer: any[];
  }
}

// GA4 Configuration
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX';

// Initialize GA4
export const initializeGA4 = (): void => {
  if (typeof window === 'undefined' || !GA4_MEASUREMENT_ID || GA4_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    console.log('GA4: Skipping initialization (missing measurement ID or server-side)');
    return;
  }

  // Create dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(...args) {
    window.dataLayer.push(args);
  };

  // Configure GA4
  window.gtag('js', new Date().toISOString());
  window.gtag('config', GA4_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
    anonymize_ip: true,
    allow_google_signals: false,
    send_page_view: true
  });

  // Load GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  console.log('GA4: Initialized with measurement ID:', GA4_MEASUREMENT_ID);
};

// Event Types
interface BaseEvent {
  event_category: string;
  event_label?: string;
  value?: number;
}

interface GenerateStartEvent extends BaseEvent {
  event_category: 'video_generation';
  event_label: 'generate_start';
  prompt_length?: number;
  duration?: number;
  has_image?: boolean;
}

interface GenerateCompleteEvent extends BaseEvent {
  event_category: 'video_generation';
  event_label: 'generate_complete';
  generation_time?: number;
  file_size?: number;
  success?: boolean;
}

interface RetryEvent extends BaseEvent {
  event_category: 'errors';
  event_label: 'retry_503';
  retry_attempt?: number;
  endpoint?: string;
}

interface ErrorToastEvent extends BaseEvent {
  event_category: 'errors';
  event_label: 'error_toast';
  error_type?: string;
  error_code?: string;
}

interface UpgradeClickEvent extends BaseEvent {
  event_category: 'conversion';
  event_label: 'upgrade_click';
  current_tier?: string;
  target_tier?: string;
}

// Event Tracking Functions
export const trackEvent = (eventName: string, parameters: any = {}): void => {
  if (typeof window === 'undefined' || !window.gtag) {
    console.log('GA4: Event tracking skipped (not initialized):', eventName);
    return;
  }

  window.gtag('event', eventName, {
    event_category: parameters.event_category || 'general',
    event_label: parameters.event_label,
    value: parameters.value,
    custom_parameter_1: parameters.custom_parameter_1,
    custom_parameter_2: parameters.custom_parameter_2,
    custom_parameter_3: parameters.custom_parameter_3,
    ...parameters
  });

  console.log('GA4: Event tracked:', eventName, parameters);
};

export const trackGenerateStart = (params: {
  prompt: string;
  duration?: number;
  hasImage?: boolean;
}): void => {
  const event: GenerateStartEvent = {
    event_category: 'video_generation',
    event_label: 'generate_start',
    prompt_length: params.prompt.length,
    duration: params.duration,
    has_image: params.hasImage,
    value: 1
  };

  trackEvent('generate_start', event);
};

export const trackGenerateComplete = (params: {
  success: boolean;
  generationTime?: number;
  fileSize?: number;
  generationId?: string;
}): void => {
  const event: GenerateCompleteEvent = {
    event_category: 'video_generation', 
    event_label: 'generate_complete',
    success: params.success,
    generation_time: params.generationTime,
    file_size: params.fileSize,
    value: params.success ? 1 : 0
  };

  trackEvent('generate_complete', event);
};

export const trackRetry503 = (params: {
  endpoint: string;
  retryAttempt: number;
}): void => {
  const event: RetryEvent = {
    event_category: 'errors',
    event_label: 'retry_503',
    endpoint: params.endpoint,
    retry_attempt: params.retryAttempt,
    value: params.retryAttempt
  };

  trackEvent('retry_503', event);
};

export const trackErrorToast = (params: {
  errorType: string;
  errorCode?: string;
  errorMessage?: string;
}): void => {
  const event: ErrorToastEvent = {
    event_category: 'errors',
    event_label: 'error_toast',
    error_type: params.errorType,
    error_code: params.errorCode,
    value: 1
  };

  trackEvent('error_toast', event);
};

export const trackUpgradeClick = (params: {
  currentTier: string;
  targetTier: string;
  location?: string;
}): void => {
  const event: UpgradeClickEvent = {
    event_category: 'conversion',
    event_label: 'upgrade_click',
    current_tier: params.currentTier,
    target_tier: params.targetTier,
    value: 1
  };

  trackEvent('upgrade_click', event);
};

// Page View Tracking
export const trackPageView = (params: {
  page_title?: string;
  page_location?: string;
  page_path?: string;
}): void => {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('config', GA4_MEASUREMENT_ID, {
    page_title: params.page_title || document.title,
    page_location: params.page_location || window.location.href,
    page_path: params.page_path || window.location.pathname
  });
};

// User Properties
export const setUserProperty = (property: string, value: string): void => {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('config', GA4_MEASUREMENT_ID, {
    custom_map: {
      [property]: value
    }
  });
};

// Export for debugging
export const isGA4Initialized = (): boolean => {
  return typeof window !== 'undefined' && !!window.gtag;
};
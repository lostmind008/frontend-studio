import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_API_URL: 'https://api.lostmindai.com',
  VITE_APP_NAME: 'LostMind AI Video Studio',
  VITE_GA4_MEASUREMENT_ID: 'G-TEST123',
  VITE_SENTRY_DSN: 'https://test@sentry.io/test',
  VITE_ENVIRONMENT: 'test',
  MODE: 'test',
  DEV: false,
  PROD: false,
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  get root() { return null; }
  get rootMargin() { return '0px'; }
  get thresholds() { return [0]; }
  takeRecords() { return []; }
};

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Canvas and 2D Context for neural background
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId: string) => {
  if (contextId === '2d') {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Array(4) })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Array(4) })),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      canvas: null as any,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      isPointInPath: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('sessionStorage', sessionStorageMock);

// Mock EventSource for SSE
class MockEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;
  
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  close = vi.fn();
  readyState = 1;
}

global.EventSource = MockEventSource as any;

// Mock fetch
global.fetch = vi.fn();

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});
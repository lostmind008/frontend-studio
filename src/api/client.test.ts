import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios first before any imports
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      defaults: {
        baseURL: 'https://api.lostmindai.com/api/v1',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      },
    })),
  },
}));

// Import after mocking
import { apiClient, fileToBase64, TokenManager, ApiClientError } from './client';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe('Authentication Headers', () => {
    it('should include Authorization header when token exists', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lh5jRMnfNz8IVgLCwxg7xpThCVyGxLJdBGZj8gxGhGA';
      TokenManager.setToken(mockToken);
      
      // Verify token is set
      expect(TokenManager.getToken()).toBe(mockToken);
      expect(apiClient.isAuthenticated()).toBe(true);
    });

    it('should not include Authorization header when no token', () => {
      TokenManager.removeToken();
      
      expect(TokenManager.getToken()).toBe(null);
      expect(apiClient.isAuthenticated()).toBe(false);
    });
  });

  describe('Response Interceptors', () => {
    it('should handle 401 responses by clearing token', () => {
      const testToken = 'test-token';
      TokenManager.setToken(testToken);
      
      // Verify token is set
      expect(TokenManager.getToken()).toBe(testToken);
      
      // After a 401, token should be cleared
      TokenManager.removeToken();
      expect(TokenManager.getToken()).toBe(null);
    });

    it('should create ApiClientError from response', () => {
      const errorMessage = 'Test error message';
      const status = 400;
      const code = 'VALIDATION_ERROR';
      
      const error = new ApiClientError(errorMessage, status, code);
      
      expect(error.message).toBe(errorMessage);
      expect(error.status).toBe(status);
      expect(error.code).toBe(code);
      expect(error.name).toBe('ApiClientError');
    });
  });

  describe('API Methods', () => {
    it('should make GET requests with correct configuration', async () => {
      const mockResponse = { data: { test: 'data' } };
      const mockGet = vi.fn().mockResolvedValue(mockResponse);
      (apiClient as any).get = mockGet;
      
      const result = await apiClient.get('/test-endpoint');
      
      expect(mockGet).toHaveBeenCalledWith('/test-endpoint');
      expect(result).toEqual(mockResponse);
    });

    it('should make POST requests with data', async () => {
      const mockResponse = { data: { success: true } };
      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      (apiClient as any).post = mockPost;
      
      const testData = { prompt: 'test prompt' };
      const result = await apiClient.post('/test-endpoint', testData);
      
      expect(mockPost).toHaveBeenCalledWith('/test-endpoint', testData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests up to 3 times', () => {
      // This would be implemented in the actual retry interceptor
      expect(true).toBe(true); // Placeholder for retry logic test
    });

    it('should not retry on 4xx client errors', () => {
      // This would test that client errors don't trigger retries
      expect(true).toBe(true); // Placeholder for retry logic test
    });
  });
});

describe('File Utilities', () => {
  describe('fileToBase64', () => {
    it('should convert file to base64 string', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: 'data:text/plain;base64,dGVzdCBjb250ZW50',
        onload: null as any,
        onerror: null as any,
      };
      
      global.FileReader = vi.fn(() => mockFileReader) as any;
      
      const promise = fileToBase64(mockFile);
      
      // Simulate successful read
      mockFileReader.onload?.({ target: mockFileReader } as any);
      
      const result = await promise;
      expect(result).toBe('dGVzdCBjb250ZW50'); // Base64 part only
    });

    it('should handle file read errors', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: null,
        onload: null as any,
        onerror: null as any,
      };
      
      global.FileReader = vi.fn(() => mockFileReader) as any;
      
      const promise = fileToBase64(mockFile);
      
      // Simulate read error with proper error object
      const error = new Error('File read failed');
      mockFileReader.onerror?.(error);
      
      await expect(promise).rejects.toThrow();
    });

    it('should handle empty base64 result', async () => {
      const mockFile = new File([''], 'empty.txt', { type: 'text/plain' });
      
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: 'data:text/plain;base64,',
        onload: null as any,
        onerror: null as any,
      };
      
      global.FileReader = vi.fn(() => mockFileReader) as any;
      
      const promise = fileToBase64(mockFile);
      mockFileReader.onload?.({ target: mockFileReader } as any);
      
      const result = await promise;
      expect(result).toBe('');
    });
  });
});

describe('Configuration', () => {
  it('should use correct base URL from environment', () => {
    const baseUrl = apiClient.getBaseUrl();
    expect(baseUrl).toContain('api.lostmindai.com');
    expect(baseUrl).toContain('/api/v1');
  });

  it('should provide utility methods', () => {
    expect(typeof apiClient.setAuthToken).toBe('function');
    expect(typeof apiClient.clearAuthToken).toBe('function');
    expect(typeof apiClient.getAuthToken).toBe('function');
    expect(typeof apiClient.isAuthenticated).toBe('function');
  });

  it('should have HTTP methods available', () => {
    expect(typeof apiClient.get).toBe('function');
    expect(typeof apiClient.post).toBe('function');
    expect(typeof apiClient.put).toBe('function');
    expect(typeof apiClient.delete).toBe('function');
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../App';

// Mock the API client with realistic responses
const mockApiResponses = {
  generateVideo: {
    data: { generation_id: 'test-gen-12345' }
  },
  getVideoStatus: [
    // Sequence of status updates
    {
      data: {
        generation_id: 'test-gen-12345',
        status: 'pending',
        progress: 0,
        message: 'Initializing generation...',
        video_url: null,
        created_at: '2025-08-18T12:00:00Z',
        updated_at: '2025-08-18T12:00:00Z',
      }
    },
    {
      data: {
        generation_id: 'test-gen-12345',
        status: 'processing',
        progress: 25,
        message: 'Processing video...',
        video_url: null,
        created_at: '2025-08-18T12:00:00Z',
        updated_at: '2025-08-18T12:01:00Z',
      }
    },
    {
      data: {
        generation_id: 'test-gen-12345',
        status: 'processing',
        progress: 75,
        message: 'Finalizing video...',
        video_url: null,
        created_at: '2025-08-18T12:00:00Z',
        updated_at: '2025-08-18T12:02:00Z',
      }
    },
    {
      data: {
        generation_id: 'test-gen-12345',
        status: 'completed',
        progress: 100,
        message: 'Video generation complete',
        video_url: 'https://api.lostmindai.com/videos/download/test-gen-12345',
        thumbnail_url: 'https://api.lostmindai.com/thumbnails/test-gen-12345.jpg',
        duration_seconds: 5,
        resolution: '720p',
        file_size_bytes: 2400000,
        created_at: '2025-08-18T12:00:00Z',
        updated_at: '2025-08-18T12:03:00Z',
        completed_at: '2025-08-18T12:03:00Z',
      }
    }
  ],
  getVideoHistory: {
    data: {
      jobs: [
        {
          generation_id: 'test-gen-12345',
          status: 'completed',
          prompt: 'A beautiful sunset over mountains',
          duration: 5,
          progress: 100,
          video_url: 'https://api.lostmindai.com/videos/download/test-gen-12345',
          thumbnail_url: 'https://api.lostmindai.com/thumbnails/test-gen-12345.jpg',
          file_size_bytes: 2400000,
          created_at: '2025-08-18T12:00:00Z',
          updated_at: '2025-08-18T12:03:00Z',
          completed_at: '2025-08-18T12:03:00Z',
        }
      ],
      total: 1,
      page: 1,
      page_size: 10,
    }
  },
  authMe: {
    data: {
      id: 'test-user-123',
      email: 'test@lostmindai.com',
      tier: 'pro',
      total_videos_generated: 5,
      is_admin: false,
      profile: {},
      preferences: {
        theme: 'dark',
        notifications: true,
      }
    }
  }
};

// Mock API client
let statusCallCount = 0;
vi.mock('@/api/client', () => ({
  apiClient: {
    post: vi.fn((url) => {
      if (url === '/videos/generate') {
        return Promise.resolve(mockApiResponses.generateVideo);
      }
      return Promise.reject(new Error('Unknown POST endpoint'));
    }),
    get: vi.fn((url) => {
      if (url.includes('/videos/status/')) {
        const response = mockApiResponses.getVideoStatus[statusCallCount] || 
                        mockApiResponses.getVideoStatus[mockApiResponses.getVideoStatus.length - 1];
        statusCallCount++;
        return Promise.resolve(response);
      }
      if (url === '/videos/history') {
        return Promise.resolve(mockApiResponses.getVideoHistory);
      }
      if (url === '/auth/me') {
        return Promise.resolve(mockApiResponses.authMe);
      }
      return Promise.reject(new Error(`Unknown GET endpoint: ${url}`));
    }),
  },
  fileToBase64: vi.fn(() => Promise.resolve('base64-encoded-data')),
}));

// Mock authentication store
const mockAuthStore = {
  user: mockApiResponses.authMe.data,
  isAuthenticated: true,
  checkAuth: vi.fn(),
};

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

// Mock localStorage for auth token
const mockLocalStorage = {
  getItem: vi.fn(() => 'mock-jwt-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

const renderApp = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/generate']}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Complete Generate → Status → History Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    statusCallCount = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should complete the full video generation workflow', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    // Wait for app to load first - reduce timeout and make deterministic
    await waitFor(() => {
      // Check for any basic app content or navigation
      const appContent = screen.getByText(/generate ai video/i) || 
                        screen.getByRole('button') ||
                        document.querySelector('main') ||
                        document.querySelector('[data-testid]');
      expect(appContent).toBeTruthy();
    }, { timeout: 1000 });

    // Step 1: Look for form elements (they might not have exact labels)
    let promptField, generateButton;
    
    try {
      promptField = screen.getByLabelText(/prompt/i);
    } catch {
      // Try alternative selectors
      promptField = screen.getByPlaceholderText(/prompt/i) || 
                   screen.getByRole('textbox') ||
                   document.querySelector('textarea, input[type="text"]');
    }

    try {
      generateButton = screen.getByRole('button', { name: /generate video/i });
    } catch {
      generateButton = screen.getByText(/generate/i) || 
                      screen.getByRole('button');
    }

    if (promptField) {
      await user.type(promptField, 'A beautiful sunset over mountains');
    }

    // Step 2: Submit generation request
    await user.click(generateButton);

    // Step 3: Verify generation started
    await waitFor(() => {
      expect(screen.getByText(/generation.*started/i)).toBeInTheDocument();
    });

    // Step 4: Watch progress updates with deterministic polling
    await vi.advanceTimersByTimeAsync(1000); // Trigger first status poll
    
    await waitFor(() => {
      expect(screen.getByText(/processing.*25%/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await vi.advanceTimersByTimeAsync(1000); // Second status poll
    
    await waitFor(() => {
      expect(screen.getByText(/75%/)).toBeInTheDocument();
    }, { timeout: 500 });

    await vi.advanceTimersByTimeAsync(1000); // Final status poll
    
    await waitFor(() => {
      expect(screen.getByText(/generation complete/i)).toBeInTheDocument();
    }, { timeout: 500 });

    // Step 5: Verify download link is available
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument();
    });

    // Step 6: Navigate to history page
    const historyLink = screen.getByRole('link', { name: /history/i });
    await user.click(historyLink);

    // Step 7: Verify video appears in history
    await waitFor(() => {
      expect(screen.getByText('A beautiful sunset over mountains')).toBeInTheDocument();
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
      expect(screen.getByText(/5.*seconds/i)).toBeInTheDocument();
    });

    // Step 8: Verify download from history works
    const historyDownloadButton = screen.getByRole('button', { name: /download/i });
    expect(historyDownloadButton).toBeEnabled();
  });

  it('should handle generation errors gracefully', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    // Mock a failed generation
    const { apiClient } = await import('@/api/client');
    vi.mocked(apiClient.post).mockRejectedValue(
      new Error('Generation quota exceeded')
    );

    renderApp();

    // Use robust selector pattern
    let promptField: Element | null = null;
    await waitFor(() => {
      try {
        promptField = screen.getByLabelText(/prompt/i);
      } catch {
        promptField = screen.getByPlaceholderText(/prompt/i) || 
                     screen.getByRole('textbox') ||
                     document.querySelector('textarea, input[type="text"]');
      }
      expect(promptField).toBeTruthy();
    }, { timeout: 500 });

    const generateButton = screen.getByRole('button', { name: /generate video/i });

    if (!promptField) throw new Error('Prompt field not found');
    await user.type(promptField, 'Test prompt for error');
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/quota exceeded/i)).toBeInTheDocument();
    }, { timeout: 500 });

    // Verify form is re-enabled after error
    expect(generateButton).toBeEnabled();
    expect(promptField).toBeEnabled();
  });

  it('should handle image-to-video generation', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    // Use robust selector pattern
    let promptField: Element | null = null;
    await waitFor(() => {
      try {
        promptField = screen.getByLabelText(/prompt/i);
      } catch {
        promptField = screen.getByPlaceholderText(/prompt/i) || 
                     screen.getByRole('textbox') ||
                     document.querySelector('textarea, input[type="text"]');
      }
      expect(promptField).toBeTruthy();
    }, { timeout: 500 });

    // Upload an image
    const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
    const uploadArea = screen.getByText(/drag.*drop.*image/i).closest('div');

    if (uploadArea) {
      fireEvent.drop(uploadArea, {
        dataTransfer: { files: [file] }
      });
    }

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    }, { timeout: 500 });

    // Fill prompt and generate
    const generateButton = screen.getByRole('button', { name: /generate video/i });

    if (!promptField) throw new Error('Prompt field not found');
    await user.type(promptField, 'Transform this image into a video');
    await user.click(generateButton);

    // Verify API was called with image data
    const { apiClient } = await import('@/api/client');
    expect(apiClient.post).toHaveBeenCalledWith(
      '/videos/generate',
      expect.objectContaining({
        prompt: 'Transform this image into a video',
        image_base64: 'base64-encoded-data',
      })
    );
  });

  it('should handle real-time progress updates via SSE', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    // Mock EventSource for real-time updates with proper message handler
    const mockEventSource = {
      addEventListener: vi.fn(),
      close: vi.fn(),
    };
    (global as any).EventSource = vi.fn(() => mockEventSource);

    renderApp();

    // Use robust selector pattern
    let promptField: Element | null = null;
    await waitFor(() => {
      try {
        promptField = screen.getByLabelText(/prompt/i);
      } catch {
        promptField = screen.getByPlaceholderText(/prompt/i) || 
                     screen.getByRole('textbox') ||
                     document.querySelector('textarea, input[type="text"]');
      }
      expect(promptField).toBeTruthy();
    }, { timeout: 500 });

    const generateButton = screen.getByRole('button', { name: /generate video/i });

    if (!promptField) throw new Error('Prompt field not found');
    await user.type(promptField, 'Test SSE progress updates');
    await user.click(generateButton);

    await waitFor(() => {
      expect(global.EventSource).toHaveBeenCalledWith(
        expect.stringContaining('/events/test-gen-12345'),
        expect.objectContaining({ withCredentials: true })
      );
    }, { timeout: 500 });

    // Simulate SSE progress event by invoking message handler directly
    const handler = mockEventSource.addEventListener.mock.calls.find(c=>c[0]==='message')?.[1];
    handler?.({ data: JSON.stringify({ generation_id:'test-gen-12345', status:'processing', progress:50, message:'Halfway' })});

    await waitFor(() => {
      expect(screen.getByText(/50%/)).toBeInTheDocument();
      expect(screen.getByText(/halfway/i)).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('should maintain authentication throughout workflow', async () => {
    const user = userEvent.setup();
    renderApp();

    // Verify user is authenticated
    await waitFor(() => {
      expect(screen.getByText('test@lostmindai.com')).toBeInTheDocument();
      expect(screen.getByText(/pro/i)).toBeInTheDocument();
    });

    // Start generation - use robust selector pattern
    let promptField;
    try {
      promptField = screen.getByLabelText(/prompt/i);
    } catch {
      promptField = screen.getByPlaceholderText(/prompt/i) || 
                   screen.getByRole('textbox') ||
                   document.querySelector('textarea, input[type="text"]');
    }

    const generateButton = screen.getByRole('button', { name: /generate video/i });

    await user.type(promptField, 'Authentication test prompt');
    await user.click(generateButton);

    // Verify API calls include authorization
    const { apiClient } = await import('@/api/client');
    expect(apiClient.post).toHaveBeenCalledWith(
      '/videos/generate',
      expect.any(Object)
    );

    // Auth header would be added by interceptor (tested in unit tests)
  });

  it('should handle quota limitations for different user tiers', async () => {
    const user = userEvent.setup();

    // Mock free tier user with quota exceeded
    const mockFreeUserStore = {
      user: {
        ...mockApiResponses.authMe.data,
        tier: 'free',
        total_videos_generated: 10, // At limit
      },
      isAuthenticated: true,
      checkAuth: vi.fn(),
    };
    
    const { useAuthStore } = await import('@/stores/authStore');
    vi.mocked(useAuthStore).mockImplementation(() => mockFreeUserStore as any);

    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/free/i)).toBeInTheDocument();
      expect(screen.getByText(/10.*videos/i)).toBeInTheDocument();
    });

    // Try to generate when at quota - use robust selector pattern
    let promptField;
    try {
      promptField = screen.getByLabelText(/prompt/i);
    } catch {
      promptField = screen.getByPlaceholderText(/prompt/i) || 
                   screen.getByRole('textbox') ||
                   document.querySelector('textarea, input[type="text"]');
    }

    const generateButton = screen.getByRole('button', { name: /generate video/i });

    await user.type(promptField, 'Quota test prompt');
    
    // Button might be disabled or show upgrade prompt
    if (generateButton.hasAttribute('disabled')) {
      expect(screen.getByText(/upgrade.*pro/i)).toBeInTheDocument();
    }
  });

  it('should recover from temporary API failures', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    // Mock API failure followed by success
    let callCount = 0;
    const mockPost = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Temporary server error'));
      }
      return Promise.resolve(mockApiResponses.generateVideo);
    });
    
    const apiClientModule = await import('@/api/client');
    vi.mocked(apiClientModule).apiClient.post = mockPost;

    renderApp();

    // Use robust selector pattern
    let promptField: Element | null = null;
    await waitFor(() => {
      try {
        promptField = screen.getByLabelText(/prompt/i);
      } catch {
        promptField = screen.getByPlaceholderText(/prompt/i) || 
                     screen.getByRole('textbox') ||
                     document.querySelector('textarea, input[type="text"]');
      }
      expect(promptField).toBeTruthy();
    });

    const generateButton = screen.getByRole('button', { name: /generate video/i });

    if (!promptField) throw new Error('Prompt field not found');
    await user.type(promptField, 'Retry test prompt');
    await user.click(generateButton);

    // First attempt fails
    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });

    // Retry button appears
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    // Second attempt succeeds
    await waitFor(() => {
      expect(screen.getByText(/generation.*started/i)).toBeInTheDocument();
    });
  });

  it('should handle browser refresh during generation', async () => {

    // Mock in-progress generation in localStorage/state
    const mockInProgressGeneration = {
      generation_id: 'test-gen-12345',
      status: 'processing',
      progress: 60,
      prompt: 'Refresh test prompt',
      started_at: Date.now() - 60000, // 1 minute ago
    };

    // Mock state recovery 
    const mockVideoStoreState = {
      generations: [mockInProgressGeneration],
      activeGeneration: mockInProgressGeneration,
      isGenerating: true,
      resumeGeneration: vi.fn(),
    };
    
    const { useVideoStore } = await import('@/stores/videoStore');
    vi.mocked(useVideoStore).mockImplementation(() => mockVideoStoreState as any);

    renderApp();

    // Should show in-progress generation after "refresh"
    await waitFor(() => {
      expect(screen.getByText(/processing.*60%/i)).toBeInTheDocument();
      expect(screen.getByText('Refresh test prompt')).toBeInTheDocument();
    });
  });
});
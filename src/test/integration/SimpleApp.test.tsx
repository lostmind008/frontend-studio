import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../App';

// Minimal mocks
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { email: 'test@example.com', tier: 'pro' },
    isAuthenticated: true,
    checkAuth: vi.fn(),
  }),
}));

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(() => Promise.resolve({ data: { jobs: [] } })),
    post: vi.fn(() => Promise.resolve({ data: { generation_id: 'test' } })),
  },
}));

describe('Simple App Loading Test', () => {
  it('should render the app without crashing', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/generate']}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Just check if the app renders something
    await waitFor(() => {
      expect(document.body).toContainHTML('<main');
    }, { timeout: 2000 });

    // Basic navigation check
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should render generate page', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/generate']}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Look for the specific textarea with the expected label
    await waitFor(() => {
      expect(
        screen.getByLabelText(/video description/i) || 
        screen.getByRole('textbox') ||
        screen.getByPlaceholderText(/describe your video/i)
      ).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
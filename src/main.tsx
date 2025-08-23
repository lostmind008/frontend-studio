import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { initializeGA4 } from './lib/analytics';
import { initializeSentry } from './lib/sentry';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Only initialize observability in production builds
if (import.meta.env.PROD) {
  // Initialize Google Analytics 4 for production tracking
  initializeGA4();
  
  // Initialize Sentry Error Reporting for production monitoring
  initializeSentry();
  
  // Register service worker for performance optimization
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[SW] Registration successful:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('[SW] Update found, installing new version...');
          });
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });
    });
  }
} else {
  console.log('Observability: Skipped in development (GA4 & Sentry)');
  console.log('Service Worker: Skipped in development');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
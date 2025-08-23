import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer for production builds
    process.env.ANALYZE && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  
  server: {
    host: '0.0.0.0',
    port: 8004,
    proxy: {
      '/api': {
        target: 'http://localhost:8005',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    target: 'es2020',
    minify: 'terser',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 300,
    
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
    
    rollupOptions: {
      output: {
        // Enhanced route-based code splitting for optimal performance
        manualChunks: (id) => {
          // Core vendor libraries - split for better caching
          if (id.includes('node_modules')) {
            // React core (most stable, cache longest)
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'react-core';
            }
            // React ecosystem (router, query, etc.)
            if (id.includes('react-router') || id.includes('@tanstack/react-query')) {
              return 'react-ecosystem';
            }
            // Heavy animation library - async load only when needed
            if (id.includes('framer-motion')) {
              return 'animation';
            }
            // Charts library - only load on Dashboard/History pages
            if (id.includes('recharts') || id.includes('d3') || id.includes('victory')) {
              return 'charts';
            }
            // API and state management
            if (id.includes('axios')) {
              return 'http-client';
            }
            if (id.includes('zustand') || id.includes('immer')) {
              return 'state-management';
            }
            // Real-time features
            if (id.includes('socket.io')) {
              return 'realtime';
            }
            // UI component libraries
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('react-dropzone') || id.includes('react-hook-form')) {
              return 'form-components';
            }
            // Date and utility libraries
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils';
            }
            // Monitoring and analytics
            if (id.includes('@sentry') || id.includes('web-vitals')) {
              return 'monitoring';
            }
            // Toast notifications
            if (id.includes('react-hot-toast')) {
              return 'notifications';
            }
            // Catch-all for other vendors
            return 'vendor-misc';
          }
          
          // Page-level code splitting - load only when navigated to
          if (id.includes('/pages/')) {
            if (id.includes('Dashboard')) return 'page-dashboard';
            if (id.includes('Generate')) return 'page-generate';
            if (id.includes('History')) return 'page-history';
            if (id.includes('Templates')) return 'page-templates';
            if (id.includes('Auth')) return 'page-auth';
            if (id.includes('Progress')) return 'page-progress';
          }
          
          // Feature-based component splitting
          if (id.includes('/components/')) {
            if (id.includes('/video/')) {
              return 'feature-video';
            }
            if (id.includes('/dashboard/')) {
              return 'feature-dashboard';
            }
            if (id.includes('/auth/')) {
              return 'feature-auth';
            }
            if (id.includes('/effects/')) {
              return 'feature-effects';
            }
            if (id.includes('/ui/') && !id.includes('LoadingSpinner')) {
              return 'ui-components';
            }
          }
          
          // Services and utilities
          if (id.includes('/services/')) {
            return 'services';
          }
          if (id.includes('/stores/')) {
            return 'state-stores';
          }
          if (id.includes('/hooks/')) {
            return 'hooks';
          }
          
          // Keep critical components in main chunk
          if (id.includes('LoadingSpinner') || id.includes('ErrorBoundary') || id.includes('main.tsx') || id.includes('App.tsx')) {
            return undefined; // Main chunk
          }
        },
        
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'zustand',
    ],
    exclude: [
      'framer-motion',
      'recharts',
      'socket.io-client',
    ],
  },
  
  // Path aliases
  resolve: {
    alias: { 
      '@': new URL('./src', import.meta.url).pathname 
    }
  }
});
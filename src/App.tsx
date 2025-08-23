import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { NeuralBackground } from './components/effects/NeuralBackground';
import { Header } from './components/layout/Header';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './stores/authStore';
import { useEffect, Suspense, lazy } from 'react';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { LazyAnimationProvider } from './components/effects/LazyAnimationProvider';

// Lazy-loaded pages for optimal code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Generate = lazy(() => import('./pages/Generate'));
const Templates = lazy(() => import('./pages/Templates'));
const History = lazy(() => import('./pages/History'));
const Auth = lazy(() => import('./pages/Auth'));
const Progress = lazy(() => import('./pages/Progress'));

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <LazyAnimationProvider respectReducedMotion={true}>
      <div className="min-h-screen relative">
        <NeuralBackground />
        <div className="relative z-10">
          <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/generate" element={
                <ProtectedRoute>
                  <Generate />
                </ProtectedRoute>
              } />
              <Route path="/templates" element={
                <ProtectedRoute>
                  <Templates />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />
              <Route path="/progress/:id" element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              } />
              <Route path="/auth" element={<Auth />} />
            </Routes>
          </Suspense>
        </main>
        
        {/* Footer */}
        <footer className="relative z-10 border-t border-bg-tertiary bg-bg-secondary/50 backdrop-blur-md">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-neural-cyan to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Built by <span className="text-neural-cyan">LostMind AI</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Founded by Sumit Mondal • Sydney, Australia
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
                <a 
                  href="https://lostmindai.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-neural-cyan transition-colors min-h-[44px] flex items-center px-2 py-1 rounded"
                >
                  lostmindai.com
                </a>
                <div className="hidden sm:flex items-center space-x-4">
                  <span>•</span>
                  <span>Powered by Google Veo 3</span>
                  <span>•</span>
                  <span>© 2025 LostMind AI</span>
                </div>
                <div className="sm:hidden text-center space-y-1">
                  <div className="text-center">Powered by Google Veo 3</div>
                  <div className="text-center">© 2025 LostMind AI</div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A1B',
            color: '#fff',
            border: '1px solid #2A2A2B',
          },
        }}
      />
      </div>
    </LazyAnimationProvider>
  );
}

export default App;
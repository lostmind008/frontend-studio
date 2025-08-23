import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Loader } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const isLoading = useAuthStore((state) => state.isLoading);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-neural-cyan animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Show quota warning if low
  if (user && user.quota_remaining <= 2) {
    return (
      <>
        {user.quota_remaining === 0 && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400">
              ⚠️ You've reached your daily video generation limit. 
              {user.tier === 'free' && ' Upgrade to Premium for more generations.'}
            </p>
          </div>
        )}
        {user.quota_remaining > 0 && user.quota_remaining <= 2 && (
          <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400">
              ⚠️ You have {user.quota_remaining} video generation{user.quota_remaining > 1 ? 's' : ''} remaining today.
            </p>
          </div>
        )}
        {children}
      </>
    );
  }

  return <>{children}</>;
};
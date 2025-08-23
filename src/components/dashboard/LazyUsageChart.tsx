/**
 * Lazy-loaded Usage Chart Component - Reduces initial bundle by ~260KB
 * Only loads recharts library when component is actually needed
 * Features: Dynamic imports, loading states, error boundaries
 */

import React, { Suspense, lazy, useState, useCallback } from 'react';
import { BarChart3, Activity } from 'lucide-react';

// Chart data interface
interface ChartData {
  date: string;
  fullDate: string;
  total: number;
  completed: number;
  failed: number;
  processing: number;
}

interface UsageChartProps {
  data: ChartData[];
  timeRange: '7d' | '30d' | '90d';
  chartType?: 'line' | 'area' | 'bar';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d') => void;
  onChartTypeChange?: (type: 'line' | 'area' | 'bar') => void;
  isLoading?: boolean;
}

// Lazy-loaded chart component with dynamic import
const UsageChartComponent = lazy(() => 
  import('./UsageChart').then(module => ({
    default: module.UsageChart
  }))
);

// Loading fallback specifically for charts
const ChartLoadingFallback: React.FC = () => (
  <div className="card">
    <div className="flex items-center space-x-3 mb-6">
      <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
        <BarChart3 className="w-5 h-5 text-neural-cyan" />
        <span>Generation Trends</span>
      </h3>
    </div>
    
    <div className="h-80 bg-bg-tertiary rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-center text-gray-400">
        <Activity className="w-12 h-12 mx-auto mb-2 opacity-50 animate-spin" />
        <p>Loading chart library...</p>
        <p className="text-xs text-gray-500 mt-1">First load may take a moment</p>
      </div>
    </div>
    
    {/* Placeholder controls */}
    <div className="flex justify-end space-x-3 mt-4">
      <div className="bg-bg-tertiary rounded-lg p-1 animate-pulse">
        <div className="flex space-x-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-12 h-8 bg-bg-quaternary rounded"></div>
          ))}
        </div>
      </div>
      <div className="bg-bg-tertiary rounded-lg p-1 animate-pulse">
        <div className="flex space-x-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-8 h-8 bg-bg-quaternary rounded"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Error boundary for chart loading failures
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry: () => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; onRetry: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-neural-cyan" />
              <span>Generation Trends</span>
            </h3>
          </div>
          
          <div className="h-80 bg-bg-tertiary rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-red-400 mb-2">Failed to load chart library</p>
              <p className="text-sm text-gray-500 mb-4">
                Network issue or browser compatibility problem
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  this.props.onRetry();
                }}
                className="bg-neural-cyan hover:bg-neural-cyan/90 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Retry Loading
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lazy Usage Chart Wrapper
 * 
 * This component:
 * 1. Defers loading of recharts library (~260KB) until needed
 * 2. Shows loading state during dynamic import
 * 3. Handles loading errors gracefully
 * 4. Provides retry mechanism for failed loads
 * 5. Maintains same interface as original component
 */
export const LazyUsageChart: React.FC<UsageChartProps> = (props) => {
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = useCallback(() => {
    setRetryKey(prev => prev + 1);
  }, []);

  return (
    <ChartErrorBoundary onRetry={handleRetry}>
      <Suspense fallback={<ChartLoadingFallback />}>
        <UsageChartComponent key={retryKey} {...props} />
      </Suspense>
    </ChartErrorBoundary>
  );
};

export default LazyUsageChart;
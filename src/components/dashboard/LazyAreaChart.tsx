/**
 * Lazy Area Chart Component - Part of performance optimization
 * Only loads recharts when actually needed
 */

import React, { Suspense, lazy } from 'react';
import { Activity } from 'lucide-react';

// Lazy-loaded chart components
const AreaChartComponent = lazy(() => 
  import('recharts').then(module => ({
    default: ({ children, data, ...props }: any) => {
      const { AreaChart, ResponsiveContainer } = module;
      return (
        <ResponsiveContainer {...props}>
          <AreaChart data={data}>
            {children}
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  }))
);

const AreaElement = lazy(() =>
  import('recharts').then(module => ({
    default: module.Area
  }))
);

const XAxisElement = lazy(() =>
  import('recharts').then(module => ({
    default: module.XAxis
  }))
);

const YAxisElement = lazy(() =>
  import('recharts').then(module => ({
    default: module.YAxis
  }))
);

const CartesianGridElement = lazy(() =>
  import('recharts').then(module => ({
    default: module.CartesianGrid
  }))
);

const TooltipElement = lazy(() =>
  import('recharts').then(module => ({
    default: module.Tooltip
  }))
);

interface LazyAreaChartProps {
  data: any[];
  width?: string | number;
  height?: string | number;
  className?: string;
  children?: React.ReactNode;
}

const AreaChartFallback: React.FC = () => (
  <div className="h-64 bg-bg-tertiary rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-center text-gray-400">
      <Activity className="w-12 h-12 mx-auto mb-2 opacity-50 animate-pulse" />
      <p className="text-sm">Loading trend chart...</p>
      <div className="flex space-x-2 mt-2 justify-center">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-2 h-8 bg-neural-cyan/20 rounded animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
        ))}
      </div>
    </div>
  </div>
);

export const LazyAreaChart: React.FC<LazyAreaChartProps> = ({
  data,
  width = "100%",
  height = "100%",
  className,
  children,
}) => {
  return (
    <div className={className}>
      <Suspense fallback={<AreaChartFallback />}>
        <AreaChartComponent data={data} width={width} height={height}>
          {children}
        </AreaChartComponent>
      </Suspense>
    </div>
  );
};

// Export individual elements for compatibility
export const LazyArea = (props: any) => (
  <Suspense fallback={<div className="animate-pulse h-4 bg-neural-cyan/20 rounded"></div>}>
    <AreaElement {...props} />
  </Suspense>
);

export const LazyXAxis = (props: any) => (
  <Suspense fallback={null}>
    <XAxisElement {...props} />
  </Suspense>
);

export const LazyYAxis = (props: any) => (
  <Suspense fallback={null}>
    <YAxisElement {...props} />
  </Suspense>
);

export const LazyCartesianGrid = (props: any) => (
  <Suspense fallback={null}>
    <CartesianGridElement {...props} />
  </Suspense>
);

export const LazyChartTooltip = (props: any) => (
  <Suspense fallback={null}>
    <TooltipElement {...props} />
  </Suspense>
);

export default LazyAreaChart;
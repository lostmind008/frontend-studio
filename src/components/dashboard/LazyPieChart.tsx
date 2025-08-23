/**
 * Lazy Pie Chart Component - Part of performance optimization
 * Only loads recharts when actually needed
 */

import React, { Suspense, lazy } from 'react';
import { PieChart } from 'lucide-react';

// Lazy-loaded chart component
const PieChartComponent = lazy(() => 
  import('recharts').then(module => ({
    default: ({ children, ...props }: any) => {
      const { PieChart: RechartsPieChart, ResponsiveContainer } = module;
      return (
        <ResponsiveContainer {...props}>
          <RechartsPieChart>
            {children}
          </RechartsPieChart>
        </ResponsiveContainer>
      );
    }
  }))
);

// Lazy-loaded Pie element
const PieElement = lazy(() =>
  import('recharts').then(module => ({
    default: module.Pie
  }))
);

// Lazy-loaded Cell element
const CellElement = lazy(() =>
  import('recharts').then(module => ({
    default: module.Cell
  }))
);

// Lazy-loaded Tooltip element
const TooltipElement = lazy(() =>
  import('recharts').then(module => ({
    default: module.Tooltip
  }))
);

interface LazyPieChartProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  children?: React.ReactNode;
}

const PieChartFallback: React.FC = () => (
  <div className="h-48 flex items-center justify-center bg-bg-tertiary rounded-lg animate-pulse">
    <div className="text-center text-gray-400">
      <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50 animate-spin" />
      <p className="text-sm">Loading chart...</p>
    </div>
  </div>
);

export const LazyPieChart: React.FC<LazyPieChartProps> = ({
  width = "100%",
  height = "100%",
  className,
  children,
}) => {
  return (
    <div className={className}>
      <Suspense fallback={<PieChartFallback />}>
        <PieChartComponent width={width} height={height}>
          {children}
        </PieChartComponent>
      </Suspense>
    </div>
  );
};

// Export individual elements for compatibility
export const LazyPie = (props: any) => (
  <Suspense fallback={<div>Loading...</div>}>
    <PieElement {...props} />
  </Suspense>
);

export const LazyCell = (props: any) => (
  <Suspense fallback={<div>Loading...</div>}>
    <CellElement {...props} />
  </Suspense>
);

export const LazyTooltip = (props: any) => (
  <Suspense fallback={<div>Loading...</div>}>
    <TooltipElement {...props} />
  </Suspense>
);

export default LazyPieChart;
/**
 * Usage Chart Component - Analytics visualization for video generation trends
 * Features: Time-series charts, interactive tooltips, responsive design
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity
} from 'lucide-react';

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

// Chart colors matching neural theme
const CHART_COLORS = {
  primary: '#1FB8CD',
  secondary: '#64E8FF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  accent: '#8B5CF6',
  muted: '#6B7280'
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-secondary border border-bg-quaternary rounded-lg p-3 shadow-lg">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-300 text-sm">
              {entry.name}: <span className="font-medium">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ChartHeader: React.FC<{
  title: string;
  timeRange: string;
  chartType: string;
  onTimeRangeChange?: (range: '7d' | '30d' | '90d') => void;
  onChartTypeChange?: (type: 'line' | 'area' | 'bar') => void;
  trendData?: { value: number; isPositive: boolean };
}> = ({ title, timeRange, chartType, onTimeRangeChange, onChartTypeChange, trendData }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <div className="flex items-center space-x-3">
        <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-neural-cyan" />
          <span>{title}</span>
        </h3>
        {trendData && (
          <div className={`flex items-center space-x-1 text-sm ${
            trendData.isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {trendData.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{trendData.isPositive ? '+' : ''}{trendData.value}%</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Chart Type Selector */}
        {onChartTypeChange && (
          <div className="flex items-center space-x-1 bg-bg-tertiary rounded-lg p-1">
            {(['line', 'area', 'bar'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onChartTypeChange(type)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  chartType === type
                    ? 'bg-neural-cyan text-white'
                    : 'text-gray-400 hover:text-white hover:bg-bg-quaternary'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Time Range Selector */}
        {onTimeRangeChange && (
          <div className="flex items-center space-x-1 bg-bg-tertiary rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  timeRange === range
                    ? 'bg-neural-cyan text-white'
                    : 'text-gray-400 hover:text-white hover:bg-bg-quaternary'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const LoadingChart: React.FC = () => (
  <div className="h-80 bg-bg-tertiary rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-center text-gray-400">
      <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p>Loading chart data...</p>
    </div>
  </div>
);

const EmptyChart: React.FC = () => (
  <div className="h-80 bg-bg-tertiary rounded-lg flex items-center justify-center">
    <div className="text-center text-gray-400">
      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p>No data available</p>
      <p className="text-sm text-gray-500 mt-1">Generate videos to see trends</p>
    </div>
  </div>
);

const LineChartComponent: React.FC<{ data: ChartData[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={320}>
    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis 
        dataKey="date" 
        stroke="#9CA3AF" 
        fontSize={12}
        tick={{ fill: '#9CA3AF' }}
      />
      <YAxis 
        stroke="#9CA3AF" 
        fontSize={12}
        tick={{ fill: '#9CA3AF' }}
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend 
        wrapperStyle={{ color: '#9CA3AF' }}
        iconType="circle"
      />
      <Line
        type="monotone"
        dataKey="total"
        stroke={CHART_COLORS.primary}
        strokeWidth={3}
        dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
        name="Total Videos"
      />
      <Line
        type="monotone"
        dataKey="completed"
        stroke={CHART_COLORS.success}
        strokeWidth={2}
        dot={{ fill: CHART_COLORS.success, strokeWidth: 2, r: 3 }}
        name="Completed"
      />
      <Line
        type="monotone"
        dataKey="failed"
        stroke={CHART_COLORS.error}
        strokeWidth={2}
        dot={{ fill: CHART_COLORS.error, strokeWidth: 2, r: 3 }}
        name="Failed"
      />
    </LineChart>
  </ResponsiveContainer>
);

const AreaChartComponent: React.FC<{ data: ChartData[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={320}>
    <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <defs>
        <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
          <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
          <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis 
        dataKey="date" 
        stroke="#9CA3AF" 
        fontSize={12}
        tick={{ fill: '#9CA3AF' }}
      />
      <YAxis 
        stroke="#9CA3AF" 
        fontSize={12}
        tick={{ fill: '#9CA3AF' }}
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ color: '#9CA3AF' }} />
      <Area
        type="monotone"
        dataKey="total"
        stroke={CHART_COLORS.primary}
        fillOpacity={1}
        fill="url(#totalGradient)"
        strokeWidth={2}
        name="Total Videos"
      />
      <Area
        type="monotone"
        dataKey="completed"
        stroke={CHART_COLORS.success}
        fillOpacity={1}
        fill="url(#completedGradient)"
        strokeWidth={2}
        name="Completed"
      />
    </AreaChart>
  </ResponsiveContainer>
);

const BarChartComponent: React.FC<{ data: ChartData[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={320}>
    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis 
        dataKey="date" 
        stroke="#9CA3AF" 
        fontSize={12}
        tick={{ fill: '#9CA3AF' }}
      />
      <YAxis 
        stroke="#9CA3AF" 
        fontSize={12}
        tick={{ fill: '#9CA3AF' }}
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ color: '#9CA3AF' }} />
      <Bar 
        dataKey="completed" 
        fill={CHART_COLORS.success} 
        radius={[2, 2, 0, 0]}
        name="Completed"
      />
      <Bar 
        dataKey="failed" 
        fill={CHART_COLORS.error} 
        radius={[2, 2, 0, 0]}
        name="Failed"
      />
      <Bar 
        dataKey="processing" 
        fill={CHART_COLORS.warning} 
        radius={[2, 2, 0, 0]}
        name="Processing"
      />
    </BarChart>
  </ResponsiveContainer>
);

export const UsageChart: React.FC<UsageChartProps> = ({
  data,
  timeRange,
  chartType = 'area',
  onTimeRangeChange,
  onChartTypeChange,
  isLoading = false
}) => {
  // Calculate trend data
  const trendData = useMemo(() => {
    if (data.length < 2) return null;
    
    const recent = data.slice(-7);
    const previous = data.slice(-14, -7);
    
    const recentTotal = recent.reduce((sum, d) => sum + d.total, 0);
    const previousTotal = previous.reduce((sum, d) => sum + d.total, 0);
    
    if (previousTotal === 0) return null;
    
    const change = ((recentTotal - previousTotal) / previousTotal) * 100;
    
    return {
      value: Math.abs(change),
      isPositive: change >= 0
    };
  }, [data]);

  const renderChart = () => {
    if (isLoading) return <LoadingChart />;
    if (data.length === 0) return <EmptyChart />;

    switch (chartType) {
      case 'line':
        return <LineChartComponent data={data} />;
      case 'bar':
        return <BarChartComponent data={data} />;
      case 'area':
      default:
        return <AreaChartComponent data={data} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="card"
    >
      <ChartHeader
        title="Generation Trends"
        timeRange={timeRange}
        chartType={chartType}
        onTimeRangeChange={onTimeRangeChange}
        onChartTypeChange={onChartTypeChange}
        trendData={trendData || undefined}
      />

      <motion.div
        key={`${chartType}-${timeRange}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {renderChart()}
      </motion.div>

      {/* Legend */}
      {!isLoading && data.length > 0 && (
        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.primary }}></div>
            <span className="text-gray-400">Total Videos</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.success }}></div>
            <span className="text-gray-400">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.error }}></div>
            <span className="text-gray-400">Failed</span>
          </div>
          {chartType === 'bar' && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.warning }}></div>
              <span className="text-gray-400">Processing</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default UsageChart;
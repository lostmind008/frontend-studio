/**
 * Stats Cards Component - Key Metrics Dashboard Cards
 * Part of comprehensive Dashboard analytics implementation
 * Features: Real-time stats, animated counters, trend indicators
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  Target, 
  DollarSign, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  delay?: number;
}

interface StatsCardsProps {
  stats: {
    totalVideos: number;
    completedVideos: number;
    processingVideos: number;
    failedVideos: number;
    successRate: number;
    totalCost: number;
    avgProcessingTime: number;
    quotaUsed: number;
  };
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bgColor, 
  trend, 
  delay = 0 
}) => {
  const TrendIcon = trend?.isPositive === true ? TrendingUp : 
                   trend?.isPositive === false ? TrendingDown : Minus;
  
  const trendColor = trend?.isPositive === true ? 'text-green-400' :
                    trend?.isPositive === false ? 'text-red-400' : 'text-gray-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="card group hover:shadow-lg hover:shadow-neural-cyan/10 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1 font-medium">{title}</p>
          <motion.p 
            className="text-3xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
          >
            {value}
          </motion.p>
          {trend && (
            <motion.div 
              className="flex items-center space-x-1 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.4 }}
            >
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={`text-sm ${trendColor} font-medium`}>
                {trend.isPositive !== undefined && (trend.isPositive ? '+' : '')}{trend.value}
              </span>
              <span className="text-sm text-gray-500">{trend.label}</span>
            </motion.div>
          )}
        </div>
        <motion.div 
          className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.3, type: "spring", stiffness: 200 }}
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </motion.div>
      </div>
    </motion.div>
  );
};

const LoadingCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="card animate-pulse"
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-700 rounded mb-2 w-24"></div>
        <div className="h-8 bg-gray-700 rounded mb-2 w-16"></div>
        <div className="h-4 bg-gray-700 rounded w-32"></div>
      </div>
      <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
    </div>
  </motion.div>
);

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <LoadingCard key={i} delay={i * 0.1} />
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Videos"
        value={stats.totalVideos.toLocaleString()}
        icon={Video}
        color="text-blue-400"
        bgColor="bg-blue-500/20"
        trend={{
          value: 12,
          label: "this month",
          isPositive: true
        }}
        delay={0.1}
      />

      <StatCard
        title="Success Rate"
        value={`${stats.successRate.toFixed(1)}%`}
        icon={Target}
        color="text-green-400"
        bgColor="bg-green-500/20"
        trend={{
          value: 3.2,
          label: "this week",
          isPositive: stats.successRate > 80
        }}
        delay={0.2}
      />

      <StatCard
        title="Total Spent"
        value={formatCurrency(stats.totalCost)}
        icon={DollarSign}
        color="text-neural-cyan"
        bgColor="bg-neural-cyan/20"
        trend={{
          value: 2.40,
          label: "this week",
          isPositive: false
        }}
        delay={0.3}
      />

      <StatCard
        title="Avg Process Time"
        value={formatDuration(stats.avgProcessingTime)}
        icon={Clock}
        color="text-purple-400"
        bgColor="bg-purple-500/20"
        trend={{
          value: 15,
          label: "faster",
          isPositive: true
        }}
        delay={0.4}
      />
    </div>
  );
};

export default StatsCards;
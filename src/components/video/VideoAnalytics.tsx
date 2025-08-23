/**
 * Enhanced Video Analytics Component
 * Provides detailed analytics and insights for video generation history
 * Neural theme compliant with accessibility support
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  DollarSign,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { VideoStatusResponse } from '../../api/types';

interface VideoAnalyticsProps {
  videos: VideoStatusResponse[];
  className?: string;
}

interface AnalyticsData {
  dailyGenerations: { date: string; count: number; cost: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  costAnalysis: {
    total: number;
    average: number;
    trend: number;
    mostExpensive: number;
    cheapest: number;
  };
  performanceMetrics: {
    successRate: number;
    averageCompletionTime: number;
    peakHours: string[];
    mostProductiveDay: string;
  };
  stylePreferences: { style: string; count: number; percentage: number }[];
}

const VideoAnalytics: React.FC<VideoAnalyticsProps> = ({ videos, className = '' }) => {
  const analyticsData = useMemo((): AnalyticsData => {
    if (!videos.length) {
      return {
        dailyGenerations: [],
        statusDistribution: [],
        costAnalysis: { total: 0, average: 0, trend: 0, mostExpensive: 0, cheapest: 0 },
        performanceMetrics: { successRate: 0, averageCompletionTime: 0, peakHours: [], mostProductiveDay: '' },
        stylePreferences: []
      };
    }

    // Daily generations analysis
    const dailyMap = new Map<string, { count: number; cost: number }>();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    videos.forEach(video => {
      const date = new Date(video.created_at);
      if (date >= thirtyDaysAgo) {
        const dateKey = date.toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey) || { count: 0, cost: 0 };
        dailyMap.set(dateKey, {
          count: existing.count + 1,
          cost: existing.cost + (video.cost || video.cost_estimate || 0)
        });
      }
    });

    const dailyGenerations = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Status distribution
    const statusMap = new Map<string, number>();
    videos.forEach(video => {
      statusMap.set(video.status, (statusMap.get(video.status) || 0) + 1);
    });

    const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / videos.length) * 100)
    }));

    // Cost analysis
    const costs = videos.map(v => v.cost || v.cost_estimate || 0).filter(c => c > 0);
    const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
    const avgCost = costs.length ? totalCost / costs.length : 0;
    
    // Cost trend (last 7 days vs previous 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const lastWeekCost = videos
      .filter(v => new Date(v.created_at) >= weekAgo)
      .reduce((sum, v) => sum + (v.cost || v.cost_estimate || 0), 0);
    
    const prevWeekCost = videos
      .filter(v => {
        const date = new Date(v.created_at);
        return date >= twoWeeksAgo && date < weekAgo;
      })
      .reduce((sum, v) => sum + (v.cost || v.cost_estimate || 0), 0);

    const costTrend = prevWeekCost ? ((lastWeekCost - prevWeekCost) / prevWeekCost) * 100 : 0;

    const costAnalysis = {
      total: totalCost,
      average: avgCost,
      trend: costTrend,
      mostExpensive: costs.length ? Math.max(...costs) : 0,
      cheapest: costs.length ? Math.min(...costs) : 0
    };

    // Performance metrics
    const completedVideos = videos.filter(v => v.status === 'completed');
    const successRate = videos.length ? (completedVideos.length / videos.length) * 100 : 0;

    // Average completion time (for videos with both created_at and completed_at)
    const completionTimes = completedVideos
      .filter(v => v.completed_at)
      .map(v => {
        const start = new Date(v.created_at).getTime();
        const end = new Date(v.completed_at!).getTime();
        return (end - start) / (1000 * 60); // minutes
      });

    const avgCompletionTime = completionTimes.length 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
      : 0;

    // Peak hours analysis
    const hourMap = new Map<number, number>();
    videos.forEach(video => {
      const hour = new Date(video.created_at).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    const peakHours = Array.from(hourMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    // Most productive day
    const dayMap = new Map<string, number>();
    videos.forEach(video => {
      const day = new Date(video.created_at).toLocaleDateString('en-US', { weekday: 'long' });
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });

    const mostProductiveDay = Array.from(dayMap.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    const performanceMetrics = {
      successRate,
      averageCompletionTime: avgCompletionTime,
      peakHours,
      mostProductiveDay
    };

    // Style preferences (using style field if available)
    const styleMap = new Map<string, number>();
    videos.forEach(video => {
      const style = (video as any).style || 'Unknown';
      styleMap.set(style, (styleMap.get(style) || 0) + 1);
    });

    const stylePreferences = Array.from(styleMap.entries()).map(([style, count]) => ({
      style,
      count,
      percentage: Math.round((count / videos.length) * 100)
    }));

    return {
      dailyGenerations,
      statusDistribution,
      costAnalysis,
      performanceMetrics,
      stylePreferences
    };
  }, [videos]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-6 ${className}`}
    >
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {analyticsData.performanceMetrics.successRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-400">Success Rate</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {analyticsData.performanceMetrics.averageCompletionTime.toFixed(0)}m
              </p>
              <p className="text-sm text-gray-400">Avg. Completion</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                {analyticsData.performanceMetrics.mostProductiveDay}
              </p>
              <p className="text-sm text-gray-400">Most Active Day</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              analyticsData.costAnalysis.trend >= 0 
                ? 'bg-green-500/20' 
                : 'bg-red-500/20'
            }`}>
              <TrendingUp className={`w-5 h-5 ${
                analyticsData.costAnalysis.trend >= 0 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${
                analyticsData.costAnalysis.trend >= 0 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                {analyticsData.costAnalysis.trend >= 0 ? '+' : ''}
                {analyticsData.costAnalysis.trend.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-400">Cost Trend</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <motion.div variants={itemVariants} className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-neural-cyan" />
            <span>Status Distribution</span>
          </h3>
          <div className="space-y-3">
            {analyticsData.statusDistribution.map(({ status, count, percentage }) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'completed' ? 'bg-green-400' :
                    status === 'processing' ? 'bg-blue-400' :
                    status === 'pending' ? 'bg-yellow-400' :
                    status === 'failed' ? 'bg-red-400' : 'bg-gray-400'
                  }`} />
                  <span className="text-gray-300 capitalize">{status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{count}</span>
                  <span className="text-sm text-gray-400">({percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cost Breakdown */}
        <motion.div variants={itemVariants} className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-neural-cyan" />
            <span>Cost Analysis</span>
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Spent:</span>
              <span className="text-white font-semibold">
                ${analyticsData.costAnalysis.total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Average per Video:</span>
              <span className="text-white font-semibold">
                ${analyticsData.costAnalysis.average.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Most Expensive:</span>
              <span className="text-white font-semibold">
                ${analyticsData.costAnalysis.mostExpensive.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Least Expensive:</span>
              <span className="text-white font-semibold">
                ${analyticsData.costAnalysis.cheapest.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Peak Activity Hours */}
        <motion.div variants={itemVariants} className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-neural-cyan" />
            <span>Peak Hours</span>
          </h3>
          <div className="space-y-2">
            {analyticsData.performanceMetrics.peakHours.map((hour, index) => (
              <div key={hour} className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-neural-cyan text-white' :
                  index === 1 ? 'bg-blue-500/30 text-blue-400' :
                  'bg-purple-500/30 text-purple-400'
                }`}>
                  {index + 1}
                </div>
                <span className="text-gray-300">{hour}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Style Preferences */}
        <motion.div variants={itemVariants} className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Award className="w-5 h-5 text-neural-cyan" />
            <span>Style Preferences</span>
          </h3>
          <div className="space-y-2">
            {analyticsData.stylePreferences.slice(0, 5).map(({ style, count, percentage }) => (
              <div key={style} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{style}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{count}</span>
                  <span className="text-sm text-gray-400">({percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default VideoAnalytics;
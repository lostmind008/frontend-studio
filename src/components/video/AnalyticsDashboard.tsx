import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Video, 
  Users,
  Activity,
  Award,
  Zap,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsData {
  totalGenerations: number;
  successRate: number;
  averageTime: number;
  totalCost: number;
  categoryBreakdown: Record<string, number>;
  qualityScores: number[];
  timeSeriesData: Array<{ date: string; count: number; avgTime: number }>;
  userStats: {
    activeUsers: number;
    returningUsers: number;
    newUsers: number;
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // In real implementation, these would be separate API calls
      const mockAnalytics: AnalyticsData = {
        totalGenerations: 1247,
        successRate: 94.2,
        averageTime: 8.5,
        totalCost: 2847.50,
        categoryBreakdown: {
          marketing: 425,
          educational: 312,
          corporate: 289,
          entertainment: 221
        },
        qualityScores: [88, 92, 85, 94, 91, 89, 93],
        timeSeriesData: [
          { date: '2025-08-01', count: 45, avgTime: 8.2 },
          { date: '2025-08-02', count: 52, avgTime: 7.9 },
          { date: '2025-08-03', count: 38, avgTime: 9.1 },
          { date: '2025-08-04', count: 61, avgTime: 8.4 },
          { date: '2025-08-05', count: 49, avgTime: 8.7 },
          { date: '2025-08-06', count: 55, avgTime: 8.3 },
          { date: '2025-08-07', count: 67, avgTime: 8.0 }
        ],
        userStats: {
          activeUsers: 1205,
          returningUsers: 892,
          newUsers: 313
        }
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes.toFixed(1)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toFixed(0)}m`;
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-bg-secondary rounded-lg p-6 h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-gray-400">Video generation insights and performance metrics</p>
        </div>
        
        <div className="flex space-x-2">
          {[
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '90d', label: '90 Days' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeRange(key as any)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                timeRange === key
                  ? 'bg-neural-cyan text-white'
                  : 'bg-bg-secondary text-gray-400 hover:bg-bg-tertiary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neural-cyan/20 rounded-lg">
              <Video className="w-6 h-6 text-neural-cyan" />
            </div>
            <span className="text-2xl font-bold text-white">
              {analytics.totalGenerations.toLocaleString()}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-white mb-1">Total Generations</h3>
            <p className="text-sm text-gray-400">Videos created</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-2xl font-bold text-white">
              {analytics.successRate}%
            </span>
          </div>
          <div>
            <h3 className="font-medium text-white mb-1">Success Rate</h3>
            <p className="text-sm text-gray-400">Successful generations</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neural-purple/20 rounded-lg">
              <Clock className="w-6 h-6 text-neural-purple" />
            </div>
            <span className="text-2xl font-bold text-white">
              {formatTime(analytics.averageTime)}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-white mb-1">Avg. Generation Time</h3>
            <p className="text-sm text-gray-400">Processing duration</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-400" />
            </div>
            <span className="text-2xl font-bold text-white">
              {formatCurrency(analytics.totalCost)}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-white mb-1">Total Revenue</h3>
            <p className="text-sm text-gray-400">Generation costs</p>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="w-6 h-6 text-neural-cyan" />
            <h3 className="text-lg font-semibold text-white">Category Breakdown</h3>
          </div>
          
          <div className="space-y-4">
            {Object.entries(analytics.categoryBreakdown).map(([category, count]) => {
              const percentage = (count / analytics.totalGenerations) * 100;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">{category}</span>
                    <span className="text-neural-cyan font-medium">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-neural-cyan to-neural-purple"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Quality Scores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Award className="w-6 h-6 text-neural-cyan" />
            <h3 className="text-lg font-semibold text-white">Quality Metrics</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-bg-tertiary rounded-lg">
                <div className="text-2xl font-bold text-neural-cyan mb-1">
                  {Math.round(analytics.qualityScores.reduce((a, b) => a + b, 0) / analytics.qualityScores.length)}
                </div>
                <div className="text-sm text-gray-400">Average Score</div>
              </div>
              <div className="text-center p-4 bg-bg-tertiary rounded-lg">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {Math.max(...analytics.qualityScores)}
                </div>
                <div className="text-sm text-gray-400">Highest Score</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Quality Distribution</span>
                <span className="text-neural-cyan">90+ scores: {analytics.qualityScores.filter(s => s >= 90).length}</span>
              </div>
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-neural-cyan"
                  style={{ width: `${(analytics.qualityScores.filter(s => s >= 90).length / analytics.qualityScores.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Time Series and User Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 card"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Activity className="w-6 h-6 text-neural-cyan" />
            <h3 className="text-lg font-semibold text-white">Daily Activity</h3>
          </div>
          
          <div className="space-y-4">
            {analytics.timeSeriesData.map((day, index) => (
              <div key={day.date} className="flex items-center space-x-4">
                <div className="text-sm text-gray-400 w-20">
                  {new Date(day.date).toLocaleDateString('en-AU', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{day.count} generations</span>
                    <span className="text-sm text-neural-cyan">{formatTime(day.avgTime)} avg</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-neural-cyan to-neural-purple"
                      initial={{ width: 0 }}
                      animate={{ width: `${(day.count / Math.max(...analytics.timeSeriesData.map(d => d.count))) * 100}%` }}
                      transition={{ duration: 1, delay: 0.7 + index * 0.1 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* User Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Users className="w-6 h-6 text-neural-cyan" />
            <h3 className="text-lg font-semibold text-white">User Stats</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-neural-cyan" />
                <span className="text-gray-300">Active Users</span>
              </div>
              <span className="font-semibold text-white">
                {analytics.userStats.activeUsers.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Returning</span>
              </div>
              <span className="font-semibold text-white">
                {analytics.userStats.returningUsers.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-neural-purple" />
                <span className="text-gray-300">New Users</span>
              </div>
              <span className="font-semibold text-white">
                {analytics.userStats.newUsers.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
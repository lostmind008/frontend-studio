/**
 * Dashboard Example Component - Complete dashboard demo
 * Showcases all dashboard components with sample data
 * Purpose: Demonstrate comprehensive analytics and overview functionality
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';

// Import all dashboard components
import { StatsCards } from './StatsCards';
import { QuickActions } from './QuickActions';
import { RecentActivity, ActivityItem } from './RecentActivity';
import { UsageChart } from './UsageChart';
import { NotificationCenter, Notification } from './NotificationCenter';

// Sample data generators
const generateSampleTrendData = (days: number) => {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const total = Math.floor(Math.random() * 15) + 5;
    const completed = Math.floor(total * (0.8 + Math.random() * 0.15));
    const failed = Math.floor((total - completed) * 0.3);
    const processing = total - completed - failed;
    
    data.push({
      date: format(date, 'MMM dd'),
      fullDate: format(date, 'yyyy-MM-dd'),
      total,
      completed,
      failed,
      processing
    });
  }
  return data;
};

const generateSampleActivities = (): ActivityItem[] => [
  {
    id: '1',
    type: 'video_completed',
    title: 'Video Generation Complete',
    description: 'Marketing video "Product Launch 2025" completed successfully',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    metadata: { videoId: 'vid_123', generationId: 'gen_123' }
  },
  {
    id: '2',
    type: 'achievement',
    title: 'Milestone Reached! 🎉',
    description: 'You\'ve generated 50 videos with a 95% success rate',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { achievementType: 'video_count' }
  },
  {
    id: '3',
    type: 'video_started',
    title: 'Video Generation Started',
    description: 'Corporate presentation video now processing',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    metadata: { generationId: 'gen_124' }
  },
  {
    id: '4',
    type: 'video_failed',
    title: 'Generation Failed',
    description: 'Technical issue with "Holiday Campaign" video',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    metadata: { generationId: 'gen_122' }
  },
  {
    id: '5',
    type: 'video_completed',
    title: 'Video Generation Complete',
    description: 'Educational content "AI Basics" finished processing',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    metadata: { videoId: 'vid_121', generationId: 'gen_121' }
  }
];

const generateSampleNotifications = (): Notification[] => [
  {
    id: 'notif_1',
    type: 'info',
    title: 'New Feature Available',
    message: 'Image-to-video generation is now available with enhanced quality settings.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
    dismissible: true,
    actionable: {
      label: 'Try Now',
      action: () => console.log('Navigate to image-to-video'),
      type: 'primary'
    }
  },
  {
    id: 'notif_2',
    type: 'warning',
    title: 'Quota Warning',
    message: 'You\'ve used 85% of your monthly video generation quota.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    dismissible: true,
    priority: 'high',
    actionable: {
      label: 'Upgrade Plan',
      action: () => console.log('Navigate to billing'),
      type: 'primary'
    }
  },
  {
    id: 'notif_3',
    type: 'success',
    title: 'Batch Generation Complete',
    message: 'All 5 videos in your "Marketing Campaign" batch have been processed successfully.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    read: true,
    dismissible: true
  },
  {
    id: 'notif_4',
    type: 'promotion',
    title: 'Black Friday Sale',
    message: 'Upgrade to Pro and get 50% off your first 3 months. Limited time offer!',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: false,
    dismissible: true,
    persistent: true,
    actionable: {
      label: 'View Offer',
      action: () => console.log('Navigate to pricing'),
      type: 'primary'
    }
  }
];

interface DashboardExampleProps {
  className?: string;
}

export const DashboardExample: React.FC<DashboardExampleProps> = ({ className = '' }) => {
  // State management
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');
  const [notifications, setNotifications] = useState<Notification[]>(generateSampleNotifications());
  const [activities] = useState<ActivityItem[]>(generateSampleActivities());

  // Sample stats
  const sampleStats = {
    totalVideos: 147,
    completedVideos: 132,
    processingVideos: 3,
    failedVideos: 12,
    successRate: 89.8,
    totalCost: 73.50,
    avgProcessingTime: 75.2,
    quotaUsed: 68.4
  };

  // Sample user stats for quick actions
  const userStats = {
    totalVideos: sampleStats.totalVideos,
    recentGenerations: 8,
    hasFailedVideos: sampleStats.failedVideos > 0
  };

  // Generate trend data based on time range
  const trendData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return generateSampleTrendData(days);
  }, [timeRange]);

  // Event handlers
  const handleDismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleQuickAction = (actionId: string) => {
    console.log('Quick action triggered:', actionId);
  };

  const handleViewVideo = (videoId: string) => {
    console.log('View video:', videoId);
  };

  const handleRetryGeneration = (generationId: string) => {
    console.log('Retry generation:', generationId);
  };

  return (
    <div className={`max-w-7xl mx-auto space-y-8 ${className}`}>
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-neural-cyan bg-clip-text text-transparent">
          Dashboard Analytics Demo
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Comprehensive video generation analytics with real-time monitoring, 
          interactive charts, and actionable insights for optimal performance tracking.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <StatsCards stats={sampleStats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Usage Chart - Takes up 2 columns */}
        <div className="xl:col-span-2">
          <UsageChart
            data={trendData}
            timeRange={timeRange}
            chartType={chartType}
            onTimeRangeChange={setTimeRange}
            onChartTypeChange={setChartType}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions
          userStats={userStats}
          onAction={handleQuickAction}
        />
      </div>

      {/* Activity and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <RecentActivity
          activities={activities}
          onViewVideo={handleViewVideo}
          onRetryGeneration={handleRetryGeneration}
        />

        {/* Notification Center */}
        <NotificationCenter
          notifications={notifications}
          onDismiss={handleDismissNotification}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      </div>

      {/* Demo Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="card bg-gradient-to-r from-neural-cyan/10 to-purple-500/10 border border-neural-cyan/20"
      >
        <div className="text-center py-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            Dashboard Components Demo
          </h3>
          <p className="text-gray-400 text-sm max-w-3xl mx-auto">
            This demonstrates the complete dashboard implementation with responsive design, 
            real-time data integration, interactive charts, and comprehensive analytics. 
            All components follow the neural theme design system with proper TypeScript types, 
            accessibility features, and mobile optimisation.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs">
            <span className="px-3 py-1 bg-neural-cyan/20 text-neural-cyan rounded-full">
              React 18 + TypeScript
            </span>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full">
              Recharts Integration
            </span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full">
              Framer Motion
            </span>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
              WCAG AA Compliant
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full">
              Mobile Responsive
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardExample;
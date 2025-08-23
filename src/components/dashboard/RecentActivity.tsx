/**
 * Recent Activity Component - Activity timeline and notifications
 * Features: Real-time activity feed, status updates, action buttons
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  X,
  Zap,
  Award
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'video_completed' | 'video_failed' | 'video_started' | 'achievement' | 'quota_warning' | 'system';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  actionable?: boolean;
  metadata?: {
    videoId?: string;
    generationId?: string;
    achievementType?: string;
    link?: string;
  };
}

interface RecentActivityProps {
  activities: ActivityItem[];
  maxItems?: number;
  showActions?: boolean;
  onDismiss?: (activityId: string) => void;
  onViewVideo?: (videoId: string) => void;
  onRetryGeneration?: (generationId: string) => void;
  isLoading?: boolean;
}

const ActivityIcon: React.FC<{ type: ActivityItem['type']; status?: ActivityItem['status'] }> = ({ 
  type 
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'video_completed':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' };
      case 'video_failed':
        return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' };
      case 'video_started':
        return { icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-500/20' };
      case 'achievement':
        return { icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      case 'quota_warning':
        return { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/20' };
      case 'system':
        return { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/20' };
      default:
        return { icon: Activity, color: 'text-gray-400', bg: 'bg-gray-500/20' };
    }
  };

  const { icon: Icon, color, bg } = getIconAndColor();

  return (
    <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
  );
};

const ActivityCard: React.FC<{
  activity: ActivityItem;
  showActions: boolean;
  onDismiss?: (id: string) => void;
  onViewVideo?: (videoId: string) => void;
  onRetryGeneration?: (generationId: string) => void;
  index: number;
}> = ({ activity, showActions, onDismiss, onViewVideo, onRetryGeneration, index }) => {
  const formatTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const canRetry = activity.type === 'video_failed' && activity.metadata?.generationId;
  const canView = activity.type === 'video_completed' && activity.metadata?.videoId;
  const canDismiss = ['achievement', 'quota_warning', 'system'].includes(activity.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative p-4 bg-bg-tertiary rounded-lg hover:bg-bg-quaternary transition-all duration-300 border border-transparent hover:border-neural-cyan/20"
    >
      <div className="flex items-start space-x-4">
        <ActivityIcon type={activity.type} status={activity.status} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-white text-sm leading-5">
              {activity.title}
            </h4>
            {canDismiss && onDismiss && (
              <button
                onClick={() => onDismiss(activity.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-bg-secondary rounded"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
          
          <p className="text-sm text-gray-400 mt-1 leading-5">
            {activity.description}
          </p>
          
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-500">
              {formatTimeAgo(activity.timestamp)}
            </p>
            
            {showActions && (canRetry || canView) && (
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {canView && onViewVideo && (
                  <button
                    onClick={() => onViewVideo(activity.metadata!.videoId!)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-neural-cyan/20 text-neural-cyan rounded hover:bg-neural-cyan/30 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                )}
                
                {canRetry && onRetryGeneration && (
                  <button
                    onClick={() => onRetryGeneration(activity.metadata!.generationId!)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress indicator for ongoing activities */}
      {activity.type === 'video_started' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-bg-secondary rounded-b-lg overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-neural-cyan to-blue-500"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
};

const LoadingState: React.FC = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.1 }}
        className="animate-pulse p-4 bg-bg-tertiary rounded-lg"
      >
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gray-700 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-700 rounded w-1/2" />
            <div className="h-3 bg-gray-700 rounded w-1/4" />
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

const EmptyState: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    <div className="w-16 h-16 bg-neural-cyan/20 rounded-full flex items-center justify-center mb-4">
      <Activity className="w-8 h-8 text-neural-cyan" />
    </div>
    <h3 className="text-lg font-medium text-white mb-2">No Recent Activity</h3>
    <p className="text-gray-400 max-w-sm">
      Your video generations and system updates will appear here. 
      <Link to="/generate" className="text-neural-cyan hover:underline ml-1">
        Generate your first video
      </Link> to get started.
    </p>
  </motion.div>
);

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  maxItems = 10,
  showActions = true,
  onDismiss,
  onViewVideo,
  onRetryGeneration,
  isLoading = false
}) => {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
          <Activity className="w-5 h-5 text-neural-cyan" />
          <span>Recent Activity</span>
        </h3>
        
        {activities.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {activities.length} {activities.length === 1 ? 'update' : 'updates'}
            </span>
            {activities.length > maxItems && (
              <Link 
                to="/history" 
                className="text-sm text-neural-cyan hover:text-neural-cyan/80 transition-colors"
              >
                View All
              </Link>
            )}
          </div>
        )}
      </div>
      
      <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {isLoading ? (
          <LoadingState />
        ) : displayedActivities.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {displayedActivities.map((activity, index) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  showActions={showActions}
                  onDismiss={onDismiss}
                  onViewVideo={onViewVideo}
                  onRetryGeneration={onRetryGeneration}
                  index={index}
                />
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <EmptyState />
        )}
      </div>
    </motion.div>
  );
};

export default RecentActivity;
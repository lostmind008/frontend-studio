/**
 * Notification Center Component - System messages and alerts
 * Features: Real-time notifications, actionable alerts, dismissible messages
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  Star,
  Award
} from 'lucide-react';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  dismissible: boolean;
  actionable?: {
    label: string;
    action: () => void;
    type?: 'primary' | 'secondary';
  };
  persistent?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss?: (notificationId: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  showUnreadOnly?: boolean;
  maxVisible?: number;
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
  const iconMap = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    error: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' },
    promotion: { icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    achievement: { icon: Award, color: 'text-neural-cyan', bg: 'bg-neural-cyan/20' }
  };

  const { icon: Icon, color, bg } = iconMap[type];

  return (
    <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
  );
};

const NotificationCard: React.FC<{
  notification: Notification;
  onDismiss?: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
  index: number;
}> = ({ notification, onDismiss, onMarkAsRead, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`group relative p-4 rounded-lg transition-all duration-300 cursor-pointer ${
        notification.read 
          ? 'bg-bg-tertiary hover:bg-bg-quaternary' 
          : 'bg-gradient-to-r from-neural-cyan/10 to-bg-tertiary hover:from-neural-cyan/15 hover:to-bg-quaternary border border-neural-cyan/20'
      }`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Priority indicator */}
      {notification.priority === 'high' && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
      )}

      <div className="flex items-start space-x-4">
        <NotificationIcon type={notification.type} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className={`font-medium text-sm leading-5 ${
              notification.read ? 'text-gray-300' : 'text-white'
            }`}>
              {notification.title}
            </h4>
            
            {notification.dismissible && onDismiss && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(notification.id);
                }}
                className="p-1 hover:bg-bg-secondary rounded transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-white" />
              </motion.button>
            )}
          </div>
          
          <p className={`text-sm mt-1 leading-5 ${
            notification.read ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">
              {formatTimeAgo(notification.timestamp)}
            </span>
            
            {notification.actionable && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  notification.actionable!.action();
                }}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  notification.actionable.type === 'primary'
                    ? 'bg-neural-cyan text-white hover:bg-neural-cyan/90'
                    : 'bg-bg-quaternary text-gray-300 hover:bg-bg-secondary'
                }`}
              >
                {notification.actionable.label}
              </motion.button>
            )}
          </div>
        </div>
      </div>
      
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-neural-cyan rounded-full" />
      )}
    </motion.div>
  );
};

const EmptyState: React.FC<{ showUnreadOnly: boolean }> = ({ showUnreadOnly }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    <div className="w-16 h-16 bg-neural-cyan/20 rounded-full flex items-center justify-center mb-4">
      <Bell className="w-8 h-8 text-neural-cyan" />
    </div>
    <h3 className="text-lg font-medium text-white mb-2">
      {showUnreadOnly ? 'All caught up!' : 'No notifications'}
    </h3>
    <p className="text-gray-400 max-w-sm">
      {showUnreadOnly 
        ? 'You have no unread notifications. Check back later for updates on your video generations.'
        : 'System notifications and updates will appear here. You\'ll be notified about video completions, quota usage, and important updates.'
      }
    </p>
  </motion.div>
);

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onDismiss,
  onMarkAsRead,
  onMarkAllAsRead,
  maxVisible = 10
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const filteredNotifications = notifications
    .filter(n => filter === 'all' || !n.read)
    .slice(0, maxVisible);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Bell className="w-5 h-5 text-neural-cyan" />
            <span>Notifications</span>
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 text-xs bg-neural-cyan text-white rounded-full font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Filter Toggle */}
          <div className="flex items-center space-x-1 bg-bg-tertiary rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                filter === 'all'
                  ? 'bg-neural-cyan text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                filter === 'unread'
                  ? 'bg-neural-cyan text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Unread
            </button>
          </div>
          
          {/* Mark All Read */}
          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-neural-cyan hover:text-neural-cyan/80 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>
      
      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {filteredNotifications.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {filteredNotifications.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onDismiss={onDismiss}
                  onMarkAsRead={onMarkAsRead}
                  index={index}
                />
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <EmptyState showUnreadOnly={filter === 'unread'} />
        )}
      </div>
      
      {/* Footer */}
      {notifications.length > maxVisible && (
        <div className="mt-4 pt-4 border-t border-bg-quaternary text-center">
          <button className="text-sm text-neural-cyan hover:text-neural-cyan/80 transition-colors">
            View all {notifications.length} notifications
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default NotificationCenter;
/**
 * Quick Actions Component - Dashboard shortcuts and navigation
 * Features: Quick generation shortcuts, template navigation, recent actions
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Video, 
  Sparkles, 
  Clock, 
  Image, 
  Zap,
  ArrowRight,
  Download,
  RefreshCw,
  PlayCircle,
  FileText
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  href: string;
  badge?: string;
  isExternal?: boolean;
}

interface QuickActionsProps {
  userStats?: {
    totalVideos: number;
    recentGenerations: number;
    hasFailedVideos: boolean;
  };
  onAction?: (actionId: string) => void;
}

const ActionCard: React.FC<QuickAction & { delay?: number; onClick?: () => void }> = ({
  title,
  description,
  icon: Icon,
  color,
  bgColor,
  href,
  badge,
  isExternal,
  delay = 0,
  onClick
}) => {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="p-4 bg-bg-tertiary rounded-lg hover:bg-bg-quaternary transition-all duration-300 group hover:shadow-lg hover:shadow-neural-cyan/5 border border-transparent hover:border-neural-cyan/20"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <motion.div 
          className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
          whileHover={{ rotate: 5 }}
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </motion.div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-white group-hover:text-neural-cyan transition-colors">
              {title}
            </h4>
            {badge && (
              <span className="px-2 py-1 text-xs bg-neural-cyan/20 text-neural-cyan rounded-full font-medium">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        
        <motion.div
          className="text-gray-400 group-hover:text-neural-cyan transition-colors"
          whileHover={{ x: 5 }}
        >
          <ArrowRight className="w-5 h-5" />
        </motion.div>
      </div>
    </motion.div>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return (
    <Link to={href} className="block">
      {content}
    </Link>
  );
};

export const QuickActions: React.FC<QuickActionsProps> = ({ 
  userStats = { totalVideos: 0, recentGenerations: 0, hasFailedVideos: false },
  onAction 
}) => {
  const baseActions: QuickAction[] = [
    {
      id: 'generate-video',
      title: 'Generate Video',
      description: 'Create a new AI video from text prompt',
      icon: Video,
      color: 'text-neural-cyan',
      bgColor: 'bg-neural-cyan/20',
      href: '/generate',
      badge: userStats.totalVideos === 0 ? 'Start Here' : undefined
    },
    {
      id: 'image-to-video',
      title: 'Image to Video',
      description: 'Transform images into dynamic videos',
      icon: Image,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      href: '/generate?mode=image-to-video',
      badge: 'Popular'
    },
    {
      id: 'templates',
      title: 'Browse Templates',
      description: 'Start with pre-made video prompts',
      icon: Sparkles,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      href: '/templates'
    },
    {
      id: 'history',
      title: 'Video History',
      description: 'Manage and download your videos',
      icon: Clock,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      href: '/history',
      badge: userStats.recentGenerations > 0 ? `${userStats.recentGenerations} new` : undefined
    }
  ];

  // Add conditional actions based on user state
  const conditionalActions: QuickAction[] = [];

  if (userStats.hasFailedVideos) {
    conditionalActions.push({
      id: 'retry-failed',
      title: 'Retry Failed',
      description: 'Retry videos that failed to generate',
      icon: RefreshCw,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      href: '/history?filter=failed',
      badge: 'Fix Issues'
    });
  }

  if (userStats.totalVideos > 5) {
    conditionalActions.push({
      id: 'batch-download',
      title: 'Batch Download',
      description: 'Download multiple videos at once',
      icon: Download,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      href: '/history?action=bulk-download'
    });
  }

  const allActions = [...baseActions, ...conditionalActions];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
          <Zap className="w-5 h-5 text-neural-cyan" />
          <span>Quick Actions</span>
        </h3>
        
        {userStats.totalVideos > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <PlayCircle className="w-4 h-4" />
            <span>{userStats.totalVideos} videos generated</span>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {allActions.map((action, index) => (
          <ActionCard
            key={action.id}
            {...action}
            delay={0.1 * index}
            onClick={() => onAction?.(action.id)}
          />
        ))}
      </div>

      {/* Pro tip section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="mt-6 p-4 bg-gradient-to-r from-neural-cyan/10 to-purple-500/10 rounded-lg border border-neural-cyan/20"
      >
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-neural-cyan/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-neural-cyan" />
          </div>
          <div>
            <h4 className="font-medium text-white mb-1">Pro Tip</h4>
            <p className="text-sm text-gray-400">
              {userStats.totalVideos === 0 
                ? "Start with templates for best results. They're optimised for Veo 3 generation."
                : userStats.totalVideos < 5
                ? "Try image-to-video generation for more creative control over your content."
                : "Use batch operations to manage multiple videos efficiently."
              }
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuickActions;
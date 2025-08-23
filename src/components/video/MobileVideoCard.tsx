/**
 * Mobile-Optimized Video Card Component
 * Touch-friendly video history card for mobile devices
 * Neural theme compliant with swipe gestures and accessibility
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Download,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Video,
  Share2,
  Trash2,
  RotateCcw
} from 'lucide-react';
import type { VideoJob } from '../../services/api';

interface MobileVideoCardProps {
  video: VideoJob;
  isSelected: boolean;
  onSelect: (videoId: string) => void;
  onPreview: (video: VideoJob) => void;
  onDownload: (videoId: string) => void;
  onDelete: (videoId: string) => void;
  onRegenerate: (video: VideoJob) => void;
  getVideoId: (video: VideoJob) => string;
}

// Status configurations
const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  processing: { icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  completed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  cancelled: { icon: X, color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20' }
};

const MobileVideoCard: React.FC<MobileVideoCardProps> = ({
  video,
  isSelected,
  onSelect,
  onPreview,
  onDownload,
  onDelete,
  onRegenerate,
  getVideoId
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const videoId = getVideoId(video);
  const statusInfo = statusConfig[video.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Enable swipe gestures for mobile
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentTouch = moveEvent.touches[0];
      const deltaX = currentTouch.clientX - startX;
      
      // Show actions on right swipe
      if (deltaX > 50) {
        setShowActions(true);
      } else if (deltaX < -50) {
        setShowActions(false);
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`relative overflow-hidden rounded-xl border transition-all duration-200 ${
        isSelected 
          ? 'border-neural-cyan bg-neural-cyan/5' 
          : 'border-bg-tertiary bg-bg-secondary hover:border-bg-quaternary'
      }`}
      onTouchStart={handleTouchStart}
    >
      {/* Main Card Content */}
      <div className="p-4">
        {/* Header with thumbnail and basic info */}
        <div className="flex items-start space-x-3 mb-3">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-11 bg-bg-tertiary rounded-lg overflow-hidden">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-6 h-6 text-gray-500" />
                </div>
              )}
            </div>
            
            {/* Play overlay for completed videos */}
            {video.status === 'completed' && (
              <button
                onClick={() => onPreview(video)}
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 active:opacity-100 transition-opacity rounded-lg"
              >
                <Play className="w-4 h-4 text-white" />
              </button>
            )}
          </div>

          {/* Video Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-white font-medium text-sm truncate pr-2">
                {video.title || `Video ${videoId.slice(0, 8)}`}
              </h3>
              
              {/* Selection checkbox */}
              <button
                onClick={() => onSelect(videoId)}
                className="flex-shrink-0 ml-2"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  isSelected 
                    ? 'border-neural-cyan bg-neural-cyan' 
                    : 'border-gray-400'
                }`}>
                  {isSelected && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
              </button>
            </div>
            
            {/* Status and timestamp */}
            <div className="flex items-center space-x-2 mb-2">
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${
                statusInfo.color} ${statusInfo.bg} ${statusInfo.border}
              `}>
                <StatusIcon className="w-3 h-3" />
                <span className="capitalize">{video.status}</span>
              </div>
              
              <span className="text-xs text-gray-500">
                {new Date(video.created_at).toLocaleDateString()}
              </span>
            </div>
            
            {/* Prompt preview */}
            <p className={`text-sm text-gray-400 ${isExpanded ? '' : 'line-clamp-2'}`}>
              {video.prompt}
            </p>
            
            {video.prompt && video.prompt.length > 100 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-neural-cyan mt-1"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-3">
            <span className="capitalize">{(video as any).style || 'Standard'}</span>
            <span>•</span>
            <span>{video.duration_seconds || video.duration || 5}s</span>
            <span>•</span>
            <span>{(video as any).aspect_ratio || '16:9'}</span>
          </div>
          
          {(video.cost || video.cost_estimate) && (
            <span className="text-neural-cyan font-medium">
              ${(video.cost || video.cost_estimate || 0).toFixed(2)}
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          {/* Primary actions */}
          <div className="flex items-center space-x-2">
            {video.status === 'completed' && (
              <>
                <button
                  onClick={() => onPreview(video)}
                  className="px-3 py-1.5 bg-neural-cyan/20 text-neural-cyan rounded-lg text-sm font-medium transition-colors active:bg-neural-cyan/30"
                >
                  Preview
                </button>
                <button
                  onClick={() => onDownload(videoId)}
                  className="p-1.5 bg-green-500/20 text-green-400 rounded-lg transition-colors active:bg-green-500/30"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
            
            {video.status === 'failed' && (
              <button
                onClick={() => onRegenerate(video)}
                className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors active:bg-blue-500/30"
              >
                Retry
              </button>
            )}
          </div>
          
          {/* More actions */}
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1.5 bg-bg-tertiary hover:bg-bg-quaternary rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Expandable Actions Panel */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-bg-tertiary bg-bg-primary/50"
          >
            <div className="p-4 space-y-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(videoId);
                  setShowActions(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Copy Video ID</span>
              </button>
              
              {video.status === 'completed' && (
                <button
                  onClick={() => {
                    onRegenerate(video);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-gray-300 hover:bg-bg-tertiary rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Regenerate</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  onDelete(videoId);
                  setShowActions(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MobileVideoCard;
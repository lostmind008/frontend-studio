/**
 * VideoCard Component
 * 
 * A comprehensive video card component for displaying video items in both grid and list layouts.
 * Features thumbnail preview, status indicators, metadata, and action buttons.
 * 
 * Props:
 * - video: VideoStatusResponse - Video data object
 * - layout: 'grid' | 'list' - Display layout mode
 * - isSelected: boolean - Selection state for bulk operations
 * - onSelect: (id: string) => void - Selection handler
 * - onPreview: (video: VideoStatusResponse) => void - Preview handler
 * - onDownload: (id: string) => void - Download handler
 * - onDelete: (id: string) => void - Delete handler
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Download,
  Trash2,
  Eye,
  MoreHorizontal,
  CheckSquare,
  Square,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Calendar,
  FileVideo
} from 'lucide-react';
import { VideoStatusResponse, VideoStatus } from '../../api/types';

interface VideoCardProps {
  video: VideoStatusResponse;
  layout: 'grid' | 'list';
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPreview: (video: VideoStatusResponse) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

// Status configuration
const statusConfig = {
  [VideoStatus.PENDING]: {
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    borderColor: 'border-yellow-400/20'
  },
  [VideoStatus.PROCESSING]: {
    icon: RefreshCw,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20'
  },
  [VideoStatus.COMPLETED]: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/20'
  },
  [VideoStatus.FAILED]: {
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    borderColor: 'border-red-400/20'
  },
  [VideoStatus.CANCELLED]: {
    icon: X,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    borderColor: 'border-gray-400/20'
  }
};

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  layout,
  isSelected,
  onSelect,
  onPreview,
  onDownload,
  onDelete,
  className = ''
}) => {
  const StatusIcon = statusConfig[video.status]?.icon || Clock;
  const statusStyle = statusConfig[video.status] || statusConfig[VideoStatus.PENDING];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return 'Unknown';
    return `${seconds}s`;
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (layout === 'grid') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4 }}
        className={`card hover:border-neural-cyan/50 transition-all duration-200 ${className}`}
      >
        {/* Video Thumbnail Container */}
        <div className="relative aspect-video sm:aspect-video bg-bg-tertiary rounded-lg mb-4 overflow-hidden group" style={{ minHeight: '160px' }}>
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={`Video ${video.generation_id.slice(-8)}`}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileVideo className="w-12 h-12 text-gray-500" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border backdrop-blur-sm ${statusStyle.color} ${statusStyle.bgColor} ${statusStyle.borderColor}`}>
              <StatusIcon 
                className={`w-3 h-3 ${video.status === VideoStatus.PROCESSING ? 'animate-spin' : ''}`} 
              />
              <span className="capitalize font-medium">{video.status}</span>
            </div>
          </div>

          {/* Selection Checkbox */}
          <div className="absolute top-2 left-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(video.generation_id);
              }}
              className="p-1 bg-black/50 backdrop-blur-sm rounded"
              aria-label={isSelected ? 'Deselect video' : 'Select video'}
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-neural-cyan" />
              ) : (
                <Square className="w-4 h-4 text-white/80 hover:text-white" />
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {(video.status === VideoStatus.PROCESSING || video.status === VideoStatus.PENDING) && video.progress && video.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <motion.div
                className="h-full bg-gradient-to-r from-neural-cyan to-blue-400"
                initial={{ width: 0 }}
                animate={{ width: `${video.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}

          {/* Play Overlay for Completed Videos */}
          {video.status === VideoStatus.COMPLETED && (
            <button
              onClick={() => onPreview(video)}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200"
              aria-label="Preview video"
            >
              <div className="w-16 h-16 bg-neural-cyan hover:bg-neural-cyan/90 rounded-full flex items-center justify-center transition-colors">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </button>
          )}
        </div>

        {/* Video Information */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-white truncate text-sm">
              Video {video.generation_id.slice(-8)}
            </h3>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2" title={video.message}>
              {video.message || 'Video generation in progress...'}
            </p>
          </div>

          {/* Metadata */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span className="truncate">{formatDate(video.created_at)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              {video.duration_seconds && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(video.duration_seconds)}</span>
                </div>
              )}
              {video.file_size_bytes && (
                <span>{formatFileSize(video.file_size_bytes)}</span>
              )}
            </div>
            {video.resolution && (
              <div className="text-xs text-gray-500 truncate">
                {video.resolution}
              </div>
            )}
          </div>

          {/* Error Message */}
          {video.status === VideoStatus.FAILED && video.error_details && (
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
              {truncateText(video.error_details, 60)}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500 truncate flex-1 mr-2">
              ID: {video.generation_id.slice(-8)}
            </div>
            
            <div className="flex items-center space-x-1 flex-shrink-0">
              {video.status === VideoStatus.COMPLETED && (
                <>
                  <button
                    onClick={() => onPreview(video)}
                    className="p-1.5 bg-bg-tertiary hover:bg-neural-cyan/20 rounded transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                    title="Preview video"
                    aria-label="Preview video"
                  >
                    <Eye className="w-3.5 h-3.5 text-neural-cyan" />
                  </button>
                  <button
                    onClick={() => onDownload(video.generation_id)}
                    className="p-1.5 bg-bg-tertiary hover:bg-green-500/20 rounded transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                    title="Download video"
                    aria-label="Download video"
                  >
                    <Download className="w-3.5 h-3.5 text-green-400" />
                  </button>
                </>
              )}
              <button
                onClick={() => onDelete(video.generation_id)}
                className="p-1.5 bg-bg-tertiary hover:bg-red-500/20 rounded transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="Delete video"
                aria-label="Delete video"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // List layout
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`card hover:bg-bg-tertiary/50 transition-colors ${className}`}
    >
      <div className="flex items-center space-x-4">
        {/* Selection Checkbox */}
        <div className="flex-shrink-0">
          <button
            onClick={() => onSelect(video.generation_id)}
            className="p-1"
            aria-label={isSelected ? 'Deselect video' : 'Select video'}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-neural-cyan" />
            ) : (
              <Square className="w-4 h-4 text-gray-400 hover:text-white" />
            )}
          </button>
        </div>

        {/* Thumbnail */}
        <div className="flex-shrink-0 relative">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={`Video ${video.generation_id.slice(-8)}`}
              className="w-20 h-12 object-cover rounded border border-bg-quaternary"
              loading="lazy"
            />
          ) : (
            <div className="w-20 h-12 bg-bg-tertiary rounded border border-bg-quaternary flex items-center justify-center">
              <FileVideo className="w-6 h-6 text-gray-500" />
            </div>
          )}
          
          {/* Status Icon Overlay */}
          <div className="absolute -top-1 -right-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${statusStyle.bgColor} ${statusStyle.borderColor} border`}>
              <StatusIcon 
                className={`w-3 h-3 ${statusStyle.color} ${video.status === VideoStatus.PROCESSING ? 'animate-spin' : ''}`} 
              />
            </div>
          </div>
        </div>

        {/* Video Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-white truncate">
                Video {video.generation_id.slice(-8)}
              </h3>
              <p className="text-sm text-gray-400 truncate mt-1">
                {video.message || 'Video generation...'}
              </p>
              
              {/* Metadata Row */}
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span className={`capitalize font-medium ${statusStyle.color}`}>
                  {video.status}
                </span>
                <span>{formatDate(video.created_at)}</span>
                {video.duration_seconds && (
                  <span>{formatDuration(video.duration_seconds)}</span>
                )}
                {video.resolution && (
                  <span>{video.resolution}</span>
                )}
                {video.file_size_bytes && (
                  <span>{formatFileSize(video.file_size_bytes)}</span>
                )}
              </div>

              {/* Progress Bar */}
              {(video.status === VideoStatus.PROCESSING || video.status === VideoStatus.PENDING) && video.progress && video.progress > 0 && (
                <div className="mt-2">
                  <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-neural-cyan to-blue-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${video.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs text-neural-cyan mt-1">{video.progress}% complete</span>
                </div>
              )}

              {/* Error Message */}
              {video.status === VideoStatus.FAILED && video.error_details && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                  {video.error_details}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          <div className="flex items-center space-x-1">
            {video.status === VideoStatus.COMPLETED && (
              <>
                <button
                  onClick={() => onPreview(video)}
                  className="p-2 bg-bg-tertiary hover:bg-neural-cyan/20 rounded transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Preview video"
                  aria-label="Preview video"
                >
                  <Eye className="w-4 h-4 text-neural-cyan" />
                </button>
                <button
                  onClick={() => onDownload(video.generation_id)}
                  className="p-2 bg-bg-tertiary hover:bg-green-500/20 rounded transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Download video"
                  aria-label="Download video"
                >
                  <Download className="w-4 h-4 text-green-400" />
                </button>
              </>
            )}
            <button
              onClick={() => onDelete(video.generation_id)}
              className="p-2 bg-bg-tertiary hover:bg-red-500/20 rounded transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Delete video"
              aria-label="Delete video"
            >
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
            </button>
            <button className="p-2 bg-bg-tertiary hover:bg-bg-quaternary rounded transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCard;
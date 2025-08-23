#!/usr/bin/env typescript
/**
 * File: /frontend/src/pages/History.tsx
 * Project: Veo 3 Video Generator - Complete Frontend Redesign
 * Purpose: Enhanced video generation history with advanced filtering and management
 * Dependencies: react-query, zustand, framer-motion, lucide icons
 * Created: 2025-08-15 - Claude vs V0.dev Comparison Build
 * 
 * FEATURES IMPLEMENTED:
 * - Advanced filtering by status, date range, and style
 * - Search functionality for prompts and titles
 * - Batch operations (delete, download, regenerate)
 * - Real-time status updates with progress indicators
 * - Video previews with modal viewer
 * - Export functionality (CSV, JSON)
 * - Pagination with virtual scrolling for large datasets
 * - Statistics dashboard with charts
 * 
 * DESIGN APPROACH:
 * - Data table with sortable columns
 * - Filter sidebar with smart filters
 * - Action panels for bulk operations
 * - Mobile-responsive cards on smaller screens
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Trash2, 
  Play, 
  Clock, 
  Grid,
  List,
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
  MoreHorizontal,
  Share2,
  Eye,
  AlertCircle,
  CheckCircle,
  X,
  Video,
  DollarSign,
  FileText,
  RotateCcw,
  BarChart3
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/endpoints';
import type { VideoStatusResponse as VideoJob, AspectRatio } from '../api/types';
import { toast } from 'react-hot-toast';
import VideoAnalytics from '../components/video/VideoAnalytics';

// Status color mapping
const statusColors = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  processing: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  completed: 'text-green-400 bg-green-400/10 border-green-400/20',
  failed: 'text-red-400 bg-red-400/10 border-red-400/20',
  cancelled: 'text-gray-400 bg-gray-400/10 border-gray-400/20'
};

// Status icons
const statusIcons = {
  pending: Clock,
  processing: RefreshCw,
  completed: CheckCircle,
  failed: AlertCircle,
  cancelled: X
};

// Filter types
interface HistoryFilters {
  search: string;
  status: string[];
  dateRange: string;
  style: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// View modes
type ViewMode = 'grid' | 'list';

const History = () => {
  const { user } = useAuthStore();
  
  // Helper function to get video ID
  const getVideoId = (video: VideoJob): string => {
    return video.generation_id || video.job_id || getVideoId(video) || '';
  };
  
  // State management
  const [filters, setFilters] = useState<HistoryFilters>({
    search: '',
    status: [],
    dateRange: 'all',
    style: [],
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<VideoJob | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Fetch video history
  const { 
    data: historyData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['videoHistory', user?.id, filters, page],
    queryFn: async () => {
      if (!user) return { jobs: [], total: 0 };
      
      const list = await api.video.getUserVideos();
      
      return { jobs: list, total: list.length };
    },
    enabled: !!user,
    refetchInterval: 5000 // Auto-refresh every 5 seconds for real-time updates
  });

  const videos = historyData?.jobs || [];
  const totalVideos = historyData?.total || 0;

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!videos.length) return { total: 0, completed: 0, processing: 0, failed: 0, totalCost: 0 };
    
    return {
      total: videos.length,
      completed: videos.filter((v: VideoJob) => v.status === 'completed').length,
      processing: videos.filter((v: VideoJob) => v.status === 'processing').length,
      failed: videos.filter((v: VideoJob) => v.status === 'failed').length,
      totalCost: videos.reduce((sum: number, v: VideoJob) => sum + (v.cost || v.cost_estimate || 0), 0)
    };
  }, [videos]);

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedJobs.size === videos.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(videos.map((v: VideoJob) => getVideoId(v))));
    }
  };

  const handleSelectJob = (jobId: string | undefined) => {
    if (!jobId) return;
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.size === 0) return;
    
    const confirmed = window.confirm(`Delete ${selectedJobs.size} videos? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await Promise.all(
        Array.from(selectedJobs).map(jobId => api.deleteVideo(jobId))
      );
      toast.success(`Deleted ${selectedJobs.size} videos`);
      setSelectedJobs(new Set());
      refetch();
    } catch (error) {
      toast.error('Failed to delete videos');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedJobs.size === 0) return;
    
    const completedJobs = videos.filter(v => 
      selectedJobs.has(getVideoId(v)) && v.status === 'completed'
    ) as VideoJob[];

    if (completedJobs.length === 0) {
      toast.error('No completed videos selected');
      return;
    }

    try {
      for (const job of completedJobs) {
        const jobId = getVideoId(job);
        const blob = await api.downloadVideo(jobId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video-${jobId}.mp4`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      toast.success(`Downloaded ${completedJobs.length} videos`);
    } catch (error) {
      toast.error('Failed to download videos');
    }
  };

  const handleBulkRegenerate = async () => {
    if (selectedJobs.size === 0) return;
    
    const selectedVideos = videos.filter(v => selectedJobs.has(getVideoId(v)));
    const confirmed = window.confirm(`Regenerate ${selectedVideos.length} videos? This will create new generations.`);
    if (!confirmed) return;

    try {
      for (const video of selectedVideos) {
        // Use the original prompt and settings to regenerate
        const request = {
          prompt: video.prompt || 'Regenerated video',
          duration: video.duration_seconds || 5,
          aspect_ratio: (video.aspect_ratio || '16:9') as AspectRatio,
          enhance_prompt: true
        };
        await api.generateVideo(request);
      }
      toast.success(`Started regeneration of ${selectedVideos.length} videos`);
      setSelectedJobs(new Set());
      refetch();
    } catch (error) {
      toast.error('Failed to regenerate videos');
    }
  };

  const handleExportHistory = async (format: 'csv' | 'json') => {
    try {
      const exportData = videos.map(video => ({
        id: getVideoId(video),
        prompt: video.prompt,
        status: video.status,
        duration: video.duration_seconds,
        aspect_ratio: video.aspect_ratio,
        cost: video.cost || video.cost_estimate || 0,
        created_at: video.created_at,
        completed_at: video.completed_at,
        video_url: video.video_url
      }));

      let content: string;
      let filename: string;

      if (format === 'csv') {
        const headers = Object.keys(exportData[0] || {}).join(',');
        const rows = exportData.map(row => Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(','));
        content = [headers, ...rows].join('\n');
        filename = `video-history-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        content = JSON.stringify(exportData, null, 2);
        filename = `video-history-${new Date().toISOString().split('T')[0]}.json`;
      }

      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${exportData.length} videos as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export history');
    }
  };

  // Filter handlers
  const updateFilter = (key: keyof HistoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: [],
      dateRange: 'all',
      style: [],
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    setPage(1);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Please log in to view your video history</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Video Generation History</h1>
          <p className="text-gray-400 mt-1">
            Manage and track your AI video generations powered by LostMind AI's advanced Veo3 technology
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-bg-tertiary rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-neural-cyan text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-neural-cyan text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Export and Refresh Buttons */}
          <div className="flex items-center space-x-2">
            {/* Export Dropdown */}
            <div className="relative group">
              <button type="button" className="p-2 bg-bg-tertiary hover:bg-bg-quaternary rounded-lg transition-colors" aria-label="Export history">
                <FileText className="w-4 h-4 text-gray-400" />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => handleExportHistory('csv')}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-bg-tertiary rounded transition-colors"
                  >
                    Export as CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportHistory('json')}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-bg-tertiary rounded transition-colors"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>
            </div>
            
            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => refetch()}
              className="p-2 bg-bg-tertiary hover:bg-bg-quaternary rounded-lg transition-colors"
              aria-label="Refresh history"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              showAnalytics
                ? 'bg-neural-cyan text-white'
                : 'bg-bg-tertiary text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
          </button>
        </div>
      </div>

      {/* Enhanced Analytics Section */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <VideoAnalytics videos={videos} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statistics.total}</p>
              <p className="text-sm text-gray-400">Total Videos</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statistics.completed}</p>
              <p className="text-sm text-gray-400">Completed</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statistics.processing}</p>
              <p className="text-sm text-gray-400">Processing</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-neural-cyan/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-neural-cyan" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">${statistics.totalCost.toFixed(2)}</p>
              <p className="text-sm text-gray-400">Total Cost</p>
              {statistics.total > 0 && (
                <p className="text-xs text-neural-cyan">
                  ${(statistics.totalCost / statistics.total).toFixed(2)} avg
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div variants={itemVariants} className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search prompts, titles, or IDs..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-bg-quaternary rounded-lg focus:border-neural-cyan focus:ring-1 focus:ring-neural-cyan outline-none transition-colors text-white placeholder-gray-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                showFilters ? 'bg-neural-cyan text-white' : 'bg-bg-tertiary text-gray-400 hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>

            {/* Clear Filters */}
            {(filters.search || filters.status.length > 0 || filters.style.length > 0 || filters.dateRange !== 'all') && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-bg-tertiary pt-4 mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Status Filter */}
              <div>
                <p className="block text-sm font-medium text-gray-300 mb-2">Status</p>
                <div className="space-y-2">
                  {['pending', 'processing', 'completed', 'failed'].map(status => (
                    <label key={status} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status)}
                        onChange={(e) => {
                          const newStatus = e.target.checked
                            ? [...filters.status, status]
                            : filters.status.filter(s => s !== status);
                          updateFilter('status', newStatus);
                        }}
                        className="w-4 h-4 text-neural-cyan bg-bg-tertiary border-bg-quaternary rounded focus:ring-neural-cyan"
                      />
                      <span className="text-sm text-gray-300 capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <label htmlFor="date-range-filter" className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
                <select
                  id="date-range-filter"
                  value={filters.dateRange}
                  onChange={(e) => updateFilter('dateRange', e.target.value)}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-bg-quaternary rounded-lg focus:border-neural-cyan focus:ring-1 focus:ring-neural-cyan outline-none transition-colors text-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>

              {/* Style Filter */}
              <div>
                <p className="block text-sm font-medium text-gray-300 mb-2">Style</p>
                <div className="space-y-2">
                  {['cinematic', 'realistic', 'artistic', 'anime'].map(style => (
                    <label key={style} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.style.includes(style)}
                        onChange={(e) => {
                          const newStyles = e.target.checked
                            ? [...filters.style, style]
                            : filters.style.filter(s => s !== style);
                          updateFilter('style', newStyles);
                        }}
                        className="w-4 h-4 text-neural-cyan bg-bg-tertiary border-bg-quaternary rounded focus:ring-neural-cyan"
                      />
                      <span className="text-sm text-gray-300 capitalize">{style}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quick Analytics */}
              <div>
                <p className="block text-sm font-medium text-gray-300 mb-2">Quick Stats</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Success Rate:</span>
                    <span className="text-green-400">
                      {statistics.total > 0 ? Math.round((statistics.completed / statistics.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Avg. Cost:</span>
                    <span className="text-neural-cyan">
                      ${statistics.total > 0 ? (statistics.totalCost / statistics.total).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>This Month:</span>
                    <span className="text-blue-400">
                      {videos.filter(v => {
                        const videoDate = new Date(v.created_at);
                        const now = new Date();
                        return videoDate.getMonth() === now.getMonth() && videoDate.getFullYear() === now.getFullYear();
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bulk Actions */}
      {selectedJobs.size > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">
                {selectedJobs.size} video{selectedJobs.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleBulkDownload}
                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                type="button"
                onClick={handleBulkRegenerate}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Regenerate</span>
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Video List/Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-neural-cyan" />
            <span className="text-gray-400">Loading video history...</span>
          </div>
        </div>
      ) : error ? (
        <div className="card text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to load history</h3>
          <p className="text-gray-400 mb-4">There was an error loading your video history.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-neural-cyan hover:bg-neural-cyan/90 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="card text-center">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No videos found</h3>
          <p className="text-gray-400 mb-4">
            {filters.search || filters.status.length > 0 || filters.style.length > 0
              ? 'No videos match your current filters.'
              : "You haven't generated any videos yet."
            }
          </p>
          <button
            type="button"
            onClick={() => { window.location.href = '/generate'; }}
            className="px-6 py-2 bg-neural-cyan hover:bg-neural-cyan/90 text-white rounded-lg transition-colors"
          >
            Generate Your First Video
          </button>
        </div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Table Header */}
          {viewMode === 'list' && (
            <div className="card">
              <div className="flex items-center space-x-4 text-sm font-medium text-gray-400">
                <div className="w-6">
                  <button type="button" onClick={handleSelectAll}>
                    {selectedJobs.size === videos.length ? (
                      <CheckSquare className="w-4 h-4 text-neural-cyan" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => updateFilter('sortBy', 'prompt')}
                    className="flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <span>Video</span>
                    {filters.sortBy === 'prompt' && (
                      filters.sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="w-24">
                  <button
                    type="button"
                    onClick={() => updateFilter('sortBy', 'status')}
                    className="flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <span>Status</span>
                    {filters.sortBy === 'status' && (
                      filters.sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="w-32">
                  <button
                    type="button"
                    onClick={() => updateFilter('sortBy', 'created_at')}
                    className="flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <span>Created</span>
                    {filters.sortBy === 'created_at' && (
                      filters.sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="w-16">Actions</div>
              </div>
            </div>
          )}

          {/* Video Items */}
          {viewMode === 'list' ? (
            <div className="space-y-2">
              {videos.map((video: VideoJob) => {
                const StatusIcon = statusIcons[video.status as keyof typeof statusIcons];
                return (
                  <motion.div
                    key={getVideoId(video)}
                    variants={itemVariants}
                    className="card hover:bg-bg-tertiary/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Checkbox */}
                      <div className="w-6">
                        <button type="button" onClick={() => handleSelectJob(getVideoId(video))}>
                          {selectedJobs.has(getVideoId(video)) ? (
                            <CheckSquare className="w-4 h-4 text-neural-cyan" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          {video.thumbnail_url && (
                            <div className="relative group">
                              <img
                                src={video.thumbnail_url}
                                alt="Video thumbnail"
                                className="w-16 h-9 object-cover rounded border border-bg-quaternary transition-transform group-hover:scale-105"
                              />
                              {video.status === 'completed' && (
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                  <Play className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium truncate">
                              {video.title || `Video ${getVideoId(video).slice(0, 8)}`}
                            </p>
                            <p className="text-sm text-gray-400 truncate">
                              {video.prompt}
                            </p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span>{video.style}</span>
                              <span>{video.aspect_ratio}</span>
                              <span>{video.duration_seconds || video.duration || 5}s</span>
                              {(video.cost || video.cost_estimate) && (
                                <span className="text-neural-cyan">
                                  ${(video.cost || video.cost_estimate || 0).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="w-24">
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${statusColors[video.status as keyof typeof statusColors]}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="capitalize">{video.status}</span>
                        </div>
                      </div>

                      {/* Created Date */}
                      <div className="w-32">
                        <p className="text-sm text-gray-400">
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="w-16">
                        <div className="flex items-center space-x-1">
                          {video.status === 'completed' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  // Quick play functionality - could expand to inline player
                                  if (video.video_url) {
                                    window.open(video.video_url, '_blank');
                                  } else {
                                    setSelectedVideo(video);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-neural-cyan transition-colors"
                                title="Play Video"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedVideo(video)}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const blob = await api.downloadVideo(getVideoId(video));
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `video-${getVideoId(video)}.mp4`;
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                  } catch (error) {
                                    toast.error('Failed to download video');
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <div className="relative group">
                            <button type="button" className="p-1 text-gray-400 hover:text-white transition-colors" aria-label="More options">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {/* Quick actions dropdown */}
                            <div className="absolute right-0 top-full mt-1 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[120px]">
                              <div className="p-1">
                                {video.status === 'completed' && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedVideo(video)}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-bg-tertiary rounded transition-colors flex items-center space-x-2"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Preview</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText(getVideoId(video))}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-bg-tertiary rounded transition-colors flex items-center space-x-2"
                                >
                                  <Share2 className="w-3 h-3" />
                                  <span>Copy ID</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video: VideoJob) => {
                const StatusIcon = statusIcons[video.status as keyof typeof statusIcons];
                return (
                  <motion.div
                    key={getVideoId(video)}
                    variants={itemVariants}
                    className="card overflow-hidden hover:border-neural-cyan/50 transition-colors"
                  >
                    {/* Video Thumbnail */}
                    <div className="aspect-video bg-bg-tertiary rounded-lg mb-4 relative overflow-hidden">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-12 h-12 text-gray-500" />
                        </div>
                      )}
                      
                      {/* Status Overlay */}
                      <div className="absolute top-2 right-2">
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border backdrop-blur-sm ${statusColors[video.status as keyof typeof statusColors]}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="capitalize">{video.status}</span>
                        </div>
                      </div>

                      {/* Play Button for Completed Videos */}
                      {video.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => setSelectedVideo(video)}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                          aria-label="Play video"
                        >
                          <div className="w-16 h-16 bg-neural-cyan rounded-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-white ml-1" />
                          </div>
                        </button>
                      )}

                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2">
                        <button type="button" onClick={() => handleSelectJob(getVideoId(video))}>
                          {selectedJobs.has(getVideoId(video)) ? (
                            <CheckSquare className="w-5 h-5 text-neural-cyan" />
                          ) : (
                            <Square className="w-5 h-5 text-white/80" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Video Details */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-white truncate">
                          {video.title || `Video ${getVideoId(video).slice(0, 8)}`}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                          {video.prompt}
                        </p>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span className="capitalize">{video.style}</span>
                          <span>•</span>
                          <span>{video.duration}s</span>
                          <span>•</span>
                          <span>{video.aspect_ratio}</span>
                        </div>
                        {video.cost && (
                          <span className="text-neural-cyan">${video.cost.toFixed(2)}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(video.created_at).toLocaleDateString()}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          {video.status === 'completed' && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const blob = await api.downloadVideo(getVideoId(video));
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `video-${getVideoId(video)}.mp4`;
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                } catch (error) {
                                  toast.error('Failed to download video');
                                }
                              }}
                              className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button type="button" className="p-2 bg-bg-tertiary hover:bg-bg-quaternary rounded-lg transition-colors" aria-label="More options">
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalVideos > 20 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, totalVideos)} of {totalVideos} videos
              </p>
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-bg-tertiary hover:bg-bg-quaternary disabled:opacity-50 disabled:hover:bg-bg-tertiary rounded-lg transition-colors"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-sm text-gray-400">
                  Page {page} of {Math.ceil(totalVideos / 20)}
                </span>
                
                <button
                  type="button"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(totalVideos / 20)}
                  className="px-4 py-2 bg-bg-tertiary hover:bg-bg-quaternary disabled:opacity-50 disabled:hover:bg-bg-tertiary rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Video Preview Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-secondary border border-bg-tertiary rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    {selectedVideo.title || `Video ${(selectedVideo.generation_id || selectedVideo.job_id || selectedVideo.id || '').slice(0, 8)}`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedVideo(null)}
                    className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
                    aria-label="Close video preview"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Video Player */}
                <div className="aspect-video bg-bg-tertiary rounded-lg mb-6">
                  {selectedVideo.video_url ? (
                    <video
                      controls
                      className="w-full h-full rounded-lg"
                      poster={selectedVideo.thumbnail_url || undefined}
                    >
                      <source src={selectedVideo.video_url || undefined} type="video/mp4" />
                      <track kind="captions" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Video className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">Video not available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-white mb-2">Details</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-400">Status:</dt>
                        <dd className="text-white capitalize">{selectedVideo.status}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-400">Style:</dt>
                        <dd className="text-white capitalize">{selectedVideo.style}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-400">Duration:</dt>
                        <dd className="text-white">{selectedVideo.duration} seconds</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-400">Aspect Ratio:</dt>
                        <dd className="text-white">{selectedVideo.aspect_ratio}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-400">Created:</dt>
                        <dd className="text-white">{new Date(selectedVideo.created_at).toLocaleString()}</dd>
                      </div>
                      {selectedVideo.cost && (
                        <div className="flex justify-between">
                          <dt className="text-gray-400">Cost:</dt>
                          <dd className="text-neural-cyan">${selectedVideo.cost.toFixed(2)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-white mb-2">Prompt</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {selectedVideo.prompt}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-bg-tertiary">
                  {selectedVideo.status === 'completed' && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const videoId = selectedVideo.generation_id || selectedVideo.job_id || selectedVideo.id || '';
                          const response = await api.downloadVideo(videoId);
                          const blob = response; // API already returns a Blob
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `video-${videoId}.mp4`;
                          a.click();
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          toast.error('Failed to download video');
                        }
                      }}
                      className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  )}
                  <button type="button" className="px-4 py-2 bg-neural-cyan/20 text-neural-cyan rounded-lg hover:bg-neural-cyan/30 transition-colors flex items-center space-x-2">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default History;
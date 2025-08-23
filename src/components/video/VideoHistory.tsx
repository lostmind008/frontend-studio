import React, { useState, useEffect } from 'react';
import { api, type VideoJob } from '../../services/api';
import { ProgressTracker } from './ProgressTracker';
import { 
  Download, 
  RefreshCw, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader,
  Play,
  Eye,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const VideoHistory: React.FC = () => {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');

  useEffect(() => {
    loadHistory();
    
    // Set up polling for active jobs
    const interval = setInterval(() => {
      const activeJobs = jobs.filter(job => 
        job.status === 'pending' || job.status === 'processing'
      );
      
      if (activeJobs.length > 0) {
        refreshHistory();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [jobs]);

  const loadHistory = async () => {
    try {
      const videos = await api.video.getUserVideos();
      const response = { data: { jobs: videos } };
      // Handle the nested response format from Flask backend
      const historyData = response.data.jobs || response.data;
      setJobs(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load video history');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = async () => {
    setRefreshing(true);
    try {
      const videos = await api.video.getUserVideos();
      const response = { data: { jobs: videos } };
      const historyData = response.data.jobs || response.data;
      setJobs(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error('Failed to refresh history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const downloadVideo = async (jobId: string) => {
    try {
      const downloadedBlob = await api.video.downloadVideo(jobId);
      const response = { data: downloadedBlob };
      const blob = new Blob([response.data], { type: 'video/mp4' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `veo3_video_${jobId}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Video download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download video');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'processing':
      case 'pending':
        return <Loader className="w-5 h-5 text-neural-cyan animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'processing':
      case 'pending':
        return 'text-neural-cyan';
      default:
        return 'text-gray-400';
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-neural-cyan mr-3" />
        <span className="text-gray-400">Loading video history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Video History</h2>
          <p className="text-gray-400">View and manage your generated videos</p>
        </div>
        <button
          onClick={refreshHistory}
          disabled={refreshing}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'completed', label: 'Completed' },
          { key: 'processing', label: 'Processing' },
          { key: 'failed', label: 'Failed' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === key
                ? 'bg-neural-cyan text-white'
                : 'bg-bg-secondary text-gray-400 hover:bg-bg-tertiary'
            }`}
          >
            {label} ({jobs.filter(j => key === 'all' || j.status === key).length})
          </button>
        ))}
      </div>

      {/* Progress Tracker for Selected Job */}
      {selectedJobId && (
        <div className="bg-bg-secondary rounded-lg p-6 border border-bg-tertiary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Live Progress</h3>
            <button
              onClick={() => setSelectedJobId(null)}
              className="text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <ProgressTracker
            jobId={selectedJobId}
            onComplete={() => {
              setSelectedJobId(null);
              refreshHistory();
            }}
            onError={() => {
              setSelectedJobId(null);
              refreshHistory();
            }}
          />
        </div>
      )}

      {/* Video List */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-medium text-white mb-2">
            {filter === 'all' ? 'No videos yet' : `No ${filter} videos`}
          </h3>
          <p className="text-gray-400">
            {filter === 'all' 
              ? 'Generate your first video to see it here' 
              : `No videos with ${filter} status found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredJobs.map((job) => (
              <motion.div
                key={job.generation_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-bg-secondary rounded-lg p-6 border border-bg-tertiary hover:border-neural-cyan/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(job.status)}
                      <h3 className="font-medium text-white">
                        Video Generation #{job.generation_id.slice(-8)}
                      </h3>
                      <span className={`text-sm ${getStatusColor(job.status)}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                      <div>
                        <span className="text-gray-400">Created:</span>
                        <div className="text-white flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateTime(job.created_at)}</span>
                        </div>
                      </div>
                      
                      {job.completed_at && (
                        <div>
                          <span className="text-gray-400">Completed:</span>
                          <div className="text-white flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>{formatDateTime(job.completed_at)}</span>
                          </div>
                        </div>
                      )}
                      
                      {job.file_size && (
                        <div>
                          <span className="text-gray-400">Size:</span>
                          <div className="text-white">{formatFileSize(job.file_size)}</div>
                        </div>
                      )}

                      {job.progress && job.progress > 0 && job.status !== 'completed' && (
                        <div>
                          <span className="text-gray-400">Progress:</span>
                          <div className="text-neural-cyan">{job.progress}%</div>
                        </div>
                      )}
                    </div>

                    {job.error && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">{job.error}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {(job.status === 'processing' || job.status === 'pending') && (
                      <button
                        onClick={() => setSelectedJobId(job.generation_id)}
                        className="p-2 bg-bg-tertiary hover:bg-neural-cyan/20 rounded-lg transition-colors"
                        title="View progress"
                      >
                        <Eye className="w-4 h-4 text-neural-cyan" />
                      </button>
                    )}

                    {job.status === 'completed' && job.videoUrl && (
                      <>
                        <button
                          onClick={() => job.videoUrl && window.open(job.videoUrl, '_blank')}
                          className="p-2 bg-bg-tertiary hover:bg-neural-cyan/20 rounded-lg transition-colors"
                          title="Play video"
                        >
                          <Play className="w-4 h-4 text-neural-cyan" />
                        </button>
                        <button
                          onClick={() => downloadVideo(job.generation_id)}
                          className="p-2 bg-bg-tertiary hover:bg-neural-cyan/20 rounded-lg transition-colors"
                          title="Download video"
                        >
                          <Download className="w-4 h-4 text-neural-cyan" />
                        </button>
                      </>
                    )}

                    <button
                      className="p-2 bg-bg-tertiary hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar for Active Jobs */}
                {(job.status === 'processing' || job.status === 'pending') && job.progress && job.progress > 0 && (
                  <div className="mt-4">
                    <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-neural-cyan to-neural-purple"
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
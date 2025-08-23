/**
 * BulkActions Component
 * 
 * Bulk operations interface for selected videos including download, delete, and export functionality.
 * Features progress tracking, confirmation dialogs, and accessibility support.
 * 
 * Props:
 * - selectedVideos: VideoStatusResponse[] - Array of selected video objects
 * - onSelectAll: () => void - Select all videos handler
 * - onDeselectAll: () => void - Deselect all videos handler
 * - onBulkDownload: (videoIds: string[]) => Promise<void> - Bulk download handler
 * - onBulkDelete: (videoIds: string[]) => Promise<void> - Bulk delete handler
 * - onBulkExport: (videoIds: string[], format: string) => Promise<void> - Bulk export handler
 * - totalVideos: number - Total number of videos for select all functionality
 * - isLoading: boolean - Whether bulk operations are in progress
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  FileDown,
  X,
  Loader
} from 'lucide-react';
import { VideoStatusResponse, VideoStatus } from '../../api/types';

interface BulkActionsProps {
  selectedVideos: VideoStatusResponse[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDownload: (videoIds: string[]) => Promise<void>;
  onBulkDelete: (videoIds: string[]) => Promise<void>;
  onBulkExport?: (videoIds: string[], format: 'csv' | 'json') => Promise<void>;
  totalVideos: number;
  isLoading?: boolean;
  className?: string;
}

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmVariant: 'danger' | 'primary';
  isLoading?: boolean;
}

// Confirmation Dialog Component
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmVariant,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-bg-secondary border border-bg-tertiary rounded-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start space-x-3 mb-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            confirmVariant === 'danger' ? 'bg-red-500/20' : 'bg-blue-500/20'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${
              confirmVariant === 'danger' ? 'text-red-400' : 'text-blue-400'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-sm">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-bg-tertiary hover:bg-bg-quaternary text-gray-400 hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmVariant === 'danger'
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-neural-cyan hover:bg-neural-cyan/90 text-white'
            }`}
          >
            {isLoading && <Loader className="w-4 h-4 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedVideos,
  onSelectAll,
  onDeselectAll,
  onBulkDownload,
  onBulkDelete,
  onBulkExport,
  totalVideos,
  isLoading = false,
  className = ''
}) => {
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'download' | 'export';
    format?: 'csv' | 'json';
  }>({ isOpen: false, type: 'delete' });

  const selectedCount = selectedVideos.length;
  const isAllSelected = selectedCount === totalVideos && totalVideos > 0;
  const completedVideos = selectedVideos.filter(video => video.status === VideoStatus.COMPLETED);
  const canDownload = completedVideos.length > 0;

  const handleSelectToggle = useCallback(() => {
    if (isAllSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  }, [isAllSelected, onSelectAll, onDeselectAll]);

  const handleConfirmAction = useCallback(async () => {
    if (!confirmDialog.isOpen || selectedCount === 0) return;

    setActiveOperation(confirmDialog.type);
    const selectedIds = selectedVideos.map(video => video.generation_id);

    try {
      switch (confirmDialog.type) {
        case 'delete':
          await onBulkDelete(selectedIds);
          break;
        case 'download':
          await onBulkDownload(completedVideos.map(video => video.generation_id));
          break;
        case 'export':
          if (onBulkExport && confirmDialog.format) {
            await onBulkExport(selectedIds, confirmDialog.format);
          }
          break;
      }
    } catch (error) {
      console.error(`Bulk ${confirmDialog.type} failed:`, error);
    } finally {
      setActiveOperation(null);
      setConfirmDialog({ isOpen: false, type: 'delete' });
    }
  }, [confirmDialog, selectedVideos, completedVideos, onBulkDelete, onBulkDownload, onBulkExport, selectedCount]);

  const openConfirmDialog = useCallback((type: 'delete' | 'download' | 'export', format?: 'csv' | 'json') => {
    setConfirmDialog({ isOpen: true, type, format });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog({ isOpen: false, type: 'delete' });
  }, []);

  // Don't render if no videos are available
  if (totalVideos === 0) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`card ${className}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Selection Info */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSelectToggle}
                  className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors"
                  disabled={isLoading}
                  aria-label={isAllSelected ? 'Deselect all videos' : 'Select all videos'}
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-5 h-5 text-neural-cyan" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  <span>
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </span>
                </button>

                <div className="text-sm">
                  <span className="text-white font-medium">{selectedCount}</span>
                  <span className="text-gray-400 ml-1">
                    video{selectedCount !== 1 ? 's' : ''} selected
                  </span>
                  {canDownload && completedVideos.length !== selectedCount && (
                    <span className="text-neural-cyan ml-2">
                      ({completedVideos.length} ready for download)
                    </span>
                  )}
                </div>
              </div>

              {/* Bulk Action Buttons */}
              <div className="flex items-center space-x-2">
                {/* Download Button */}
                <button
                  onClick={() => openConfirmDialog('download')}
                  disabled={!canDownload || isLoading || activeOperation === 'download'}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={canDownload ? `Download ${completedVideos.length} completed videos` : 'No completed videos to download'}
                >
                  {activeOperation === 'download' ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Download</span>
                  {canDownload && <span className="text-xs">({completedVideos.length})</span>}
                </button>

                {/* Export Dropdown */}
                {onBulkExport && (
                  <div className="relative group">
                    <button
                      disabled={isLoading || activeOperation === 'export'}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Export video data"
                    >
                      {activeOperation === 'export' ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileDown className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Export</span>
                    </button>

                    {/* Export Options */}
                    <div className="absolute right-0 mt-1 w-48 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => openConfirmDialog('export', 'csv')}
                          disabled={isLoading}
                          className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-bg-tertiary transition-colors"
                        >
                          Export as CSV
                        </button>
                        <button
                          onClick={() => openConfirmDialog('export', 'json')}
                          disabled={isLoading}
                          className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-bg-tertiary transition-colors"
                        >
                          Export as JSON
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                <button
                  onClick={() => openConfirmDialog('delete')}
                  disabled={isLoading || activeOperation === 'delete'}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Delete ${selectedCount} selected videos`}
                >
                  {activeOperation === 'delete' ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Delete</span>
                </button>

                {/* Clear Selection */}
                <button
                  onClick={onDeselectAll}
                  disabled={isLoading}
                  className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Clear selection"
                  aria-label="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Indicator */}
            {activeOperation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-bg-tertiary"
              >
                <div className="flex items-center space-x-3 text-sm text-neural-cyan">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>
                    {activeOperation === 'delete' && `Deleting ${selectedCount} videos...`}
                    {activeOperation === 'download' && `Downloading ${completedVideos.length} videos...`}
                    {activeOperation === 'export' && `Exporting ${selectedCount} videos...`}
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={closeConfirmDialog}
          onConfirm={handleConfirmAction}
          title={
            confirmDialog.type === 'delete'
              ? 'Delete Videos'
              : confirmDialog.type === 'download'
              ? 'Download Videos'
              : 'Export Video Data'
          }
          message={
            confirmDialog.type === 'delete'
              ? `Are you sure you want to delete ${selectedCount} selected video${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`
              : confirmDialog.type === 'download'
              ? `Download ${completedVideos.length} completed video${completedVideos.length !== 1 ? 's' : ''}? Files will be saved to your downloads folder.`
              : `Export data for ${selectedCount} selected video${selectedCount !== 1 ? 's' : ''} as ${confirmDialog.format?.toUpperCase()}?`
          }
          confirmText={
            confirmDialog.type === 'delete'
              ? 'Delete Videos'
              : confirmDialog.type === 'download'
              ? 'Download All'
              : 'Export Data'
          }
          confirmVariant={confirmDialog.type === 'delete' ? 'danger' : 'primary'}
          isLoading={activeOperation === confirmDialog.type}
        />
      </AnimatePresence>
    </>
  );
};

export default BulkActions;
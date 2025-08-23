/**
 * FilterPanel Component
 * 
 * Advanced filtering interface for video history with status, date range, and search functionality.
 * Features collapsible sections, real-time search with debouncing, and smart filter presets.
 * 
 * Props:
 * - filters: VideoFilters - Current filter state
 * - onFiltersChange: (filters: VideoFilters) => void - Filter change handler
 * - onClearFilters: () => void - Clear all filters handler
 * - isVisible: boolean - Panel visibility state
 * - onToggleVisibility: () => void - Toggle visibility handler
 * - totalVideos: number - Total video count for statistics
 * - filteredCount: number - Filtered video count
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { VideoStatus } from '../../api/types';

export interface VideoFilters {
  search: string;
  status: VideoStatus[];
  dateRange: string;
  customDateFrom?: string;
  customDateTo?: string;
  sortBy: 'created_at' | 'updated_at' | 'status' | 'duration_seconds';
  sortOrder: 'asc' | 'desc';
}

interface FilterPanelProps {
  filters: VideoFilters;
  onFiltersChange: (filters: VideoFilters) => void;
  onClearFilters: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
  totalVideos: number;
  filteredCount: number;
  className?: string;
}

// Debounce hook for search input
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Date range presets
const dateRangeOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
];

// Status options with icons and colors
const statusOptions = [
  {
    value: VideoStatus.PENDING,
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10'
  },
  {
    value: VideoStatus.PROCESSING,
    label: 'Processing',
    icon: RefreshCw,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10'
  },
  {
    value: VideoStatus.COMPLETED,
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10'
  },
  {
    value: VideoStatus.FAILED,
    label: 'Failed',
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10'
  },
  {
    value: VideoStatus.CANCELLED,
    label: 'Cancelled',
    icon: X,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10'
  }
];

// Sort options
const sortOptions = [
  { value: 'created_at', label: 'Creation Date' },
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'status', label: 'Status' },
  { value: 'duration_seconds', label: 'Duration' }
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  isVisible,
  onToggleVisibility,
  totalVideos,
  filteredCount,
  className = ''
}) => {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    dateRange: true,
    sorting: false
  });

  const debouncedSearch = useDebounce(searchInput, 300);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch, filters, onFiltersChange]);

  const updateFilter = useCallback((key: keyof VideoFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const toggleStatus = useCallback((status: VideoStatus) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    updateFilter('status', newStatus);
  }, [filters.status, updateFilter]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters = filters.search || 
    filters.status.length > 0 || 
    filters.dateRange !== 'all' ||
    filters.sortBy !== 'created_at' ||
    filters.sortOrder !== 'desc';

  const getCustomDateValue = (field: 'from' | 'to') => {
    const date = field === 'from' ? filters.customDateFrom : filters.customDateTo;
    return date ? new Date(date).toISOString().split('T')[0] : '';
  };

  const handleCustomDateChange = (field: 'from' | 'to', value: string) => {
    const filterKey = field === 'from' ? 'customDateFrom' : 'customDateTo';
    updateFilter(filterKey, value ? new Date(value).toISOString() : undefined);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Toggle and Search Bar */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by video ID, message, or content..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-bg-quaternary rounded-lg focus:border-neural-cyan focus:ring-1 focus:ring-neural-cyan outline-none transition-colors text-white placeholder-gray-500"
              aria-label="Search videos"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  updateFilter('search', '');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle and Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleVisibility}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                isVisible ? 'bg-neural-cyan text-white' : 'bg-bg-tertiary text-gray-400 hover:text-white hover:bg-bg-quaternary'
              }`}
              aria-expanded={isVisible}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-neural-cyan text-white text-xs rounded-full">
                  {filters.status.length + (filters.dateRange !== 'all' ? 1 : 0) + (filters.search ? 1 : 0)}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center space-x-2"
                aria-label="Clear all filters"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Results Summary */}
        {totalVideos > 0 && (
          <div className="mt-3 pt-3 border-t border-bg-tertiary flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Showing {filteredCount} of {totalVideos} videos
              {hasActiveFilters && (
                <span className="ml-2 text-neural-cyan">
                  (filtered)
                </span>
              )}
            </span>
            
            {filteredCount !== totalVideos && (
              <span className="text-neural-cyan">
                {Math.round((filteredCount / totalVideos) * 100)}% match
              </span>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="card space-y-6"
          >
            {/* Status Filter */}
            <div>
              <button
                onClick={() => toggleSection('status')}
                className="flex items-center justify-between w-full text-left mb-3 group"
                aria-expanded={expandedSections.status}
              >
                <h3 className="text-lg font-medium text-white group-hover:text-neural-cyan transition-colors">
                  Status Filter
                </h3>
                {expandedSections.status ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-neural-cyan transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-neural-cyan transition-colors" />
                )}
              </button>

              <AnimatePresence>
                {expandedSections.status && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    {statusOptions.map(({ value, label, icon: Icon, color, bgColor }) => {
                      const isSelected = filters.status.includes(value);
                      return (
                        <button
                          key={value}
                          onClick={() => toggleStatus(value)}
                          className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                            isSelected
                              ? `${bgColor} border-current ${color}`
                              : 'bg-bg-tertiary border-bg-quaternary text-gray-400 hover:border-gray-300'
                          }`}
                          aria-pressed={isSelected}
                        >
                          <div className="flex items-center space-x-2">
                            <Icon className={`w-4 h-4 ${isSelected ? color : 'text-gray-400'}`} />
                            <span className="font-medium">{label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Date Range Filter */}
            <div>
              <button
                onClick={() => toggleSection('dateRange')}
                className="flex items-center justify-between w-full text-left mb-3 group"
                aria-expanded={expandedSections.dateRange}
              >
                <h3 className="text-lg font-medium text-white group-hover:text-neural-cyan transition-colors">
                  Date Range
                </h3>
                {expandedSections.dateRange ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-neural-cyan transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-neural-cyan transition-colors" />
                )}
              </button>

              <AnimatePresence>
                {expandedSections.dateRange && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {dateRangeOptions.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => updateFilter('dateRange', value)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            filters.dateRange === value
                              ? 'bg-neural-cyan text-white'
                              : 'bg-bg-tertiary text-gray-400 hover:bg-bg-quaternary hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Date Range */}
                    {filters.dateRange === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-bg-tertiary rounded-lg"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            From Date
                          </label>
                          <input
                            type="date"
                            value={getCustomDateValue('from')}
                            onChange={(e) => handleCustomDateChange('from', e.target.value)}
                            className="w-full px-3 py-2 bg-bg-secondary border border-bg-quaternary rounded-lg focus:border-neural-cyan focus:ring-1 focus:ring-neural-cyan outline-none transition-colors text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            To Date
                          </label>
                          <input
                            type="date"
                            value={getCustomDateValue('to')}
                            onChange={(e) => handleCustomDateChange('to', e.target.value)}
                            className="w-full px-3 py-2 bg-bg-secondary border border-bg-quaternary rounded-lg focus:border-neural-cyan focus:ring-1 focus:ring-neural-cyan outline-none transition-colors text-white"
                          />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sorting Options */}
            <div>
              <button
                onClick={() => toggleSection('sorting')}
                className="flex items-center justify-between w-full text-left mb-3 group"
                aria-expanded={expandedSections.sorting}
              >
                <h3 className="text-lg font-medium text-white group-hover:text-neural-cyan transition-colors">
                  Sorting
                </h3>
                {expandedSections.sorting ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-neural-cyan transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-neural-cyan transition-colors" />
                )}
              </button>

              <AnimatePresence>
                {expandedSections.sorting && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sort By
                      </label>
                      <select
                        value={filters.sortBy}
                        onChange={(e) => updateFilter('sortBy', e.target.value)}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-bg-quaternary rounded-lg focus:border-neural-cyan focus:ring-1 focus:ring-neural-cyan outline-none transition-colors text-white"
                      >
                        {sortOptions.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sort Order
                      </label>
                      <select
                        value={filters.sortOrder}
                        onChange={(e) => updateFilter('sortOrder', e.target.value)}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-bg-quaternary rounded-lg focus:border-neural-cyan focus:ring-1 focus:ring-neural-cyan outline-none transition-colors text-white"
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterPanel;
/**
 * PaginationControls Component
 * 
 * Advanced pagination interface with page navigation, page size selection, and accessibility support.
 * Features keyboard navigation, mobile-responsive design, and customizable page size options.
 * 
 * Props:
 * - currentPage: number - Current page number (1-based)
 * - totalPages: number - Total number of pages
 * - totalItems: number - Total number of items
 * - pageSize: number - Current page size
 * - onPageChange: (page: number) => void - Page change handler
 * - onPageSizeChange: (size: number) => void - Page size change handler
 * - showPageSizeSelector: boolean - Whether to show page size selector
 * - disabled: boolean - Whether pagination is disabled (e.g., during loading)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showPageSizeSelector?: boolean;
  disabled?: boolean;
  className?: string;
}

// Page size options
const pageSizeOptions = [10, 20, 50, 100];

// Calculate visible page numbers with smart truncation
const getVisiblePages = (currentPage: number, totalPages: number, maxVisible: number = 7) => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const halfVisible = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - halfVisible);
  const end = Math.min(totalPages, start + maxVisible - 1);

  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages = [];
  
  // Add first page if not included
  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push('ellipsis-start');
    }
  }

  // Add visible range
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Add last page if not included
  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push('ellipsis-end');
    }
    pages.push(totalPages);
  }

  return pages;
};

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  disabled = false,
  className = ''
}) => {
  const visiblePages = useMemo(() => 
    getVisiblePages(currentPage, totalPages), 
    [currentPage, totalPages]
  );

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const canGoPrevious = currentPage > 1 && !disabled;
  const canGoNext = currentPage < totalPages && !disabled;

  const handlePageChange = (page: number) => {
    if (disabled || page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange(page);
  };

  const handleKeyDown = (event: React.KeyboardEvent, page: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePageChange(page);
    }
  };

  // Don't render if there's only one page and no page size selector
  if (totalPages <= 1 && !showPageSizeSelector) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      {/* Items Info and Page Size Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Items Information */}
        <div className="text-sm text-gray-400">
          {totalItems > 0 ? (
            <>
              Showing <span className="font-medium text-white">{startItem}</span> to{' '}
              <span className="font-medium text-white">{endItem}</span> of{' '}
              <span className="font-medium text-white">{totalItems}</span> videos
            </>
          ) : (
            'No videos found'
          )}
        </div>

        {/* Page Size Selector */}
        {showPageSizeSelector && onPageSizeChange && totalItems > 0 && (
          <div className="flex items-center space-x-2">
            <label htmlFor="page-size" className="text-sm text-gray-400 whitespace-nowrap">
              Videos per page:
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className="px-2 py-1 bg-bg-tertiary border border-bg-quaternary rounded text-white text-sm focus:border-neural-cyan focus:ring-1 focus:ring-neural-cyan outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav 
          className="flex items-center space-x-1"
          aria-label="Pagination navigation"
          role="navigation"
        >
          {/* First Page */}
          <button
            onClick={() => handlePageChange(1)}
            disabled={!canGoPrevious}
            className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-tertiary aria-disabled:hover:bg-transparent"
            aria-label="Go to first page"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4 text-gray-400" />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!canGoPrevious}
            className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-tertiary aria-disabled:hover:bg-transparent"
            aria-label="Go to previous page"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {visiblePages.map((page) => {
              if (typeof page === 'string') {
                return (
                  <div
                    key={page}
                    className="px-2 py-1 text-gray-500"
                    aria-hidden="true"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </div>
                );
              }

              const isCurrentPage = page === currentPage;
              
              return (
                <motion.button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  onKeyDown={(e) => handleKeyDown(e, page)}
                  disabled={disabled}
                  whileHover={!disabled && !isCurrentPage ? { scale: 1.05 } : {}}
                  whileTap={!disabled && !isCurrentPage ? { scale: 0.95 } : {}}
                  className={`
                    min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200
                    disabled:cursor-not-allowed
                    ${isCurrentPage
                      ? 'bg-neural-cyan text-white shadow-lg'
                      : disabled
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-gray-400 hover:bg-bg-tertiary hover:text-white'
                    }
                  `}
                  aria-label={`Go to page ${page}`}
                  aria-current={isCurrentPage ? 'page' : undefined}
                  title={`Page ${page}`}
                >
                  {page}
                </motion.button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!canGoNext}
            className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-tertiary aria-disabled:hover:bg-transparent"
            aria-label="Go to next page"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={!canGoNext}
            className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-tertiary aria-disabled:hover:bg-transparent"
            aria-label="Go to last page"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4 text-gray-400" />
          </button>
        </nav>
      )}

      {/* Mobile-Only Page Info */}
      {totalPages > 1 && (
        <div className="sm:hidden text-center text-sm text-gray-400">
          Page {currentPage} of {totalPages}
        </div>
      )}
    </div>
  );
};

// Hook for managing pagination state
export const usePagination = (totalItems: number, initialPageSize: number = 20) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize);

  // Reset to page 1 when page size changes or total items change significantly
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = React.useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = React.useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const getItemsForCurrentPage = React.useCallback(<T,>(items: T[]): T[] => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [currentPage, pageSize]);

  return {
    currentPage,
    pageSize,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    getItemsForCurrentPage,
    startItem: (currentPage - 1) * pageSize + 1,
    endItem: Math.min(currentPage * pageSize, totalItems)
  };
};

export default PaginationControls;
/**
 * Network Status Component
 * Monitors network connectivity and displays status with neural theme
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// === Types ===

export interface NetworkStatusProps {
  onStatusChange?: (isOnline: boolean) => void;
  showNotification?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
  position?: 'top' | 'bottom';
}

interface NetworkState {
  isOnline: boolean;
  downtime: number;
  lastOfflineTime: number | null;
  connectionType: string;
  effectiveType: string;
}

// === Network Status Component ===

export function NetworkStatus({
  onStatusChange,
  showNotification = true,
  autoHide = true,
  autoHideDelay = 5000,
  className = '',
  position = 'top'
}: NetworkStatusProps) {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    downtime: 0,
    lastOfflineTime: null,
    connectionType: 'unknown',
    effectiveType: 'unknown'
  });
  const [showStatus, setShowStatus] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  // Monitor network status
  useEffect(() => {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      const now = Date.now();

      setNetworkState(prev => {
        const newState = { ...prev, isOnline };

        if (!isOnline && prev.isOnline) {
          // Just went offline
          newState.lastOfflineTime = now;
        } else if (isOnline && !prev.isOnline) {
          // Just came back online
          if (prev.lastOfflineTime) {
            newState.downtime = now - prev.lastOfflineTime;
          }
          newState.lastOfflineTime = null;
        }

        return newState;
      });

      // Show notification when status changes
      if (showNotification) {
        setShowStatus(true);
        if (isOnline) {
          setJustReconnected(true);
          // Auto-hide reconnection notification
          if (autoHide) {
            setTimeout(() => {
              setShowStatus(false);
              setJustReconnected(false);
            }, autoHideDelay);
          }
        }
      }

      // Call status change callback
      if (onStatusChange) {
        onStatusChange(isOnline);
      }
    };

    // Get connection info if available
    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setNetworkState(prev => ({
          ...prev,
          connectionType: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown'
        }));
      }
    };

    // Initial update
    updateOnlineStatus();
    updateConnectionInfo();

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Connection change listener (if supported)
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [onStatusChange, showNotification, autoHide, autoHideDelay]);

  // Ping test for more accurate connectivity detection
  const [isPinging, setIsPinging] = useState(false);
  
  const testConnectivity = async (): Promise<boolean> => {
    setIsPinging(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    } finally {
      setIsPinging(false);
    }
  };

  // Periodic connectivity test when offline
  useEffect(() => {
    if (!networkState.isOnline) {
      const interval = setInterval(async () => {
        const isActuallyOnline = await testConnectivity();
        if (isActuallyOnline && !navigator.onLine) {
          // Browser says offline but we can reach server
          // This can happen with some network configurations
          setNetworkState(prev => ({ ...prev, isOnline: true }));
          if (onStatusChange) {
            onStatusChange(true);
          }
        }
      }, 10000); // Test every 10 seconds

      return () => clearInterval(interval);
    }
  }, [networkState.isOnline, onStatusChange]);

  const formatDowntime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getConnectionQuality = (): { label: string; color: string } => {
    const { effectiveType } = networkState;
    switch (effectiveType) {
      case 'slow-2g':
        return { label: 'Very Slow', color: 'text-red-400' };
      case '2g':
        return { label: 'Slow', color: 'text-yellow-400' };
      case '3g':
        return { label: 'Good', color: 'text-neural-cyan' };
      case '4g':
        return { label: 'Fast', color: 'text-green-400' };
      default:
        return { label: 'Unknown', color: 'text-gray-400' };
    }
  };

  const connectionQuality = getConnectionQuality();

  if (!showStatus && networkState.isOnline) return null;

  return (
    <AnimatePresence>
      {(showStatus || !networkState.isOnline) && (
        <motion.div
          initial={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={`
            fixed ${position === 'top' ? 'top-4' : 'bottom-4'} left-1/2 transform -translate-x-1/2 
            z-50 max-w-sm w-full mx-4 ${className}
          `}
        >
          <div 
            className={`
              rounded-lg shadow-lg backdrop-blur-sm border p-4 flex items-center gap-3
              ${networkState.isOnline 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-red-500/10 border-red-500/20'
              }
            `}
            role="status"
            aria-live="polite"
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {networkState.isOnline ? (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                  />
                </motion.svg>
              ) : isPinging ? (
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </motion.svg>
              ) : (
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"
                  />
                </svg>
              )}
            </div>

            {/* Status Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">
                  {networkState.isOnline 
                    ? (justReconnected ? 'Back Online' : 'Connected')
                    : 'No Internet Connection'
                  }
                </h4>
                
                {/* Close button for online status */}
                {networkState.isOnline && autoHide && (
                  <button
                    onClick={() => {
                      setShowStatus(false);
                      setJustReconnected(false);
                    }}
                    className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 focus:ring-offset-transparent rounded p-1"
                    aria-label="Dismiss notification"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-300 mt-1">
                {networkState.isOnline ? (
                  <div className="flex items-center gap-2">
                    <span>Connection quality: </span>
                    <span className={connectionQuality.color}>
                      {connectionQuality.label}
                    </span>
                    {justReconnected && networkState.downtime > 0 && (
                      <span className="text-gray-400">
                        (was offline for {formatDowntime(networkState.downtime)})
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    {isPinging 
                      ? 'Checking connection...'
                      : 'Check your internet connection and try again'
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// === Hook for Network Status ===

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionInfo, setConnectionInfo] = useState({
    type: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    
    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setConnectionInfo({
          type: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0
        });
      }
    };

    // Initial update
    updateConnectionInfo();

    // Event listeners
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  return {
    isOnline,
    connectionInfo,
    isSlowConnection: connectionInfo.effectiveType === 'slow-2g' || connectionInfo.effectiveType === '2g'
  };
}

export default NetworkStatus;
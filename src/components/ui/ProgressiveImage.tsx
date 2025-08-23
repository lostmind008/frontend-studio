/**
 * Progressive Image Component - Optimizes image loading
 * Features: WebP/AVIF support, lazy loading, blur-to-sharp transition
 * Reduces bandwidth and improves perceived performance
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  /**
   * Placeholder image (low quality, small size)
   * Should be base64 encoded for immediate display
   */
  placeholder?: string;
  /**
   * WebP version of the image (if available)
   * Will be preferred on supporting browsers
   */
  webpSrc?: string;
  /**
   * AVIF version of the image (if available)
   * Will be preferred on supporting browsers
   */
  avifSrc?: string;
  /**
   * Blur effect during loading
   */
  blur?: boolean;
  /**
   * Lazy loading threshold (default: 100px before viewport)
   */
  rootMargin?: string;
  /**
   * Callback when image loads successfully
   */
  onLoad?: () => void;
  /**
   * Callback when image fails to load
   */
  onError?: (error: Event) => void;
  [key: string]: any;
}

/**
 * Determines the best image format based on browser support
 */
const getBestImageSrc = (avifSrc?: string, webpSrc?: string, fallbackSrc?: string): string[] => {
  const sources: string[] = [];
  
  if (avifSrc) sources.push(avifSrc);
  if (webpSrc) sources.push(webpSrc);
  if (fallbackSrc) sources.push(fallbackSrc);
  
  return sources;
};

/**
 * Tests if browser supports a specific image format
 */
const supportsImageFormat = (format: 'webp' | 'avif'): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    
    const testImages = {
      webp: 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
      avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
    };
    
    img.src = testImages[format];
  });
};

// Cache format support detection
const formatSupport = {
  webp: null as boolean | null,
  avif: null as boolean | null,
};

const checkFormatSupport = async () => {
  if (formatSupport.avif === null) {
    formatSupport.avif = await supportsImageFormat('avif');
  }
  if (formatSupport.webp === null) {
    formatSupport.webp = await supportsImageFormat('webp');
  }
};

/**
 * Progressive Image Component
 * 
 * This component:
 * 1. Lazy loads images using intersection observer
 * 2. Supports modern formats (AVIF, WebP) with fallbacks
 * 3. Shows blur effect during loading for smooth transitions
 * 4. Uses placeholder images for immediate feedback
 * 5. Optimizes bandwidth usage
 */
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  webpSrc,
  avifSrc,
  blur = true,
  rootMargin = '100px',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Use intersection observer for lazy loading
  const isIntersecting = useIntersectionObserver(imgRef, {
    rootMargin,
    threshold: 0.1,
  });

  // Load the best available image format
  const loadImage = useCallback(async () => {
    if (isLoading || isLoaded) return;

    setIsLoading(true);
    
    try {
      // Check format support
      await checkFormatSupport();
      
      // Determine best image source
      const sources = getBestImageSrc(
        formatSupport.avif ? avifSrc : undefined,
        formatSupport.webp ? webpSrc : undefined,
        src
      );

      // Try loading images in order of preference
      let imageLoaded = false;
      for (const imageSrc of sources) {
        if (imageLoaded) break;
        
        try {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageSrc;
          });
          
          setCurrentSrc(imageSrc);
          setIsLoaded(true);
          imageLoaded = true;
          onLoad?.();
          
        } catch (loadError) {
          console.warn(`Failed to load image: ${imageSrc}`, loadError);
        }
      }
      
      if (!imageLoaded) {
        throw new Error('All image sources failed to load');
      }
      
    } catch (loadError) {
      console.error('Progressive image loading failed:', loadError);
      setError(true);
      onError?.(loadError as Event);
    } finally {
      setIsLoading(false);
    }
  }, [src, webpSrc, avifSrc, isLoading, isLoaded, onLoad, onError]);

  // Start loading when image enters viewport
  useEffect(() => {
    if (isIntersecting && !isLoaded && !error) {
      loadImage();
    }
  }, [isIntersecting, isLoaded, error, loadImage]);

  const imageClassName = `
    ${className}
    ${blur && isLoading ? 'filter blur-sm' : ''}
    ${blur && isLoaded ? 'filter-none transition-all duration-300' : ''}
    ${isLoaded ? 'opacity-100' : placeholder ? 'opacity-70' : 'opacity-0'}
    transition-opacity duration-300
  `.trim().replace(/\s+/g, ' ');

  if (error) {
    return (
      <div 
        className={`${className} bg-gray-800 flex items-center justify-center`}
        {...props}
      >
        <div className="text-gray-400 text-center">
          <svg 
            className="w-8 h-8 mx-auto mb-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <p className="text-xs">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={imageClassName}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
};

/**
 * Hook for creating WebP/AVIF versions of image URLs
 * Useful when you have a CDN that can generate different formats
 */
export const useProgressiveImageSrc = (src: string, options?: {
  webpSuffix?: string;
  avifSuffix?: string;
  enableWebP?: boolean;
  enableAVIF?: boolean;
}) => {
  const {
    webpSuffix = '.webp',
    avifSuffix = '.avif',
    enableWebP = true,
    enableAVIF = true,
  } = options || {};

  const webpSrc = enableWebP ? src.replace(/\.(jpg|jpeg|png)$/i, webpSuffix) : undefined;
  const avifSrc = enableAVIF ? src.replace(/\.(jpg|jpeg|png)$/i, avifSuffix) : undefined;

  return {
    src,
    webpSrc,
    avifSrc,
  };
};

/**
 * Utility for creating low-quality placeholder images
 * Generates a blur-hash like effect from a base64 thumbnail
 */
export const createPlaceholder = (
  width: number,
  height: number,
  color: string = '#1a1a1b'
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
};

export default ProgressiveImage;
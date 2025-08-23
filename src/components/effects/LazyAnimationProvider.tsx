/**
 * Lazy Animation Provider - Reduces initial bundle by ~102KB
 * Only loads framer-motion when animations are needed
 * Features: Intersection observer, reduced motion support, progressive enhancement
 */

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';

// Animation context
interface AnimationContextValue {
  isAnimationEnabled: boolean;
  isMotionLoaded: boolean;
  enableAnimations: () => void;
}

const AnimationContext = createContext<AnimationContextValue>({
  isAnimationEnabled: false,
  isMotionLoaded: false,
  enableAnimations: () => {},
});

export const useAnimation = () => useContext(AnimationContext);

// Lazy-loaded motion components
let motion: any = null;
let AnimatePresence: any = null;

const loadMotionLibrary = async () => {
  if (motion) return { motion, AnimatePresence };
  
  try {
    const framerMotion = await import('framer-motion');
    motion = framerMotion.motion;
    AnimatePresence = framerMotion.AnimatePresence;
    return { motion, AnimatePresence };
  } catch (error) {
    console.warn('Failed to load framer-motion:', error);
    return null;
  }
};

interface LazyAnimationProviderProps {
  children: React.ReactNode;
  /**
   * Load animations immediately without waiting for intersection
   * Useful for critical animations that should be ready instantly
   */
  eager?: boolean;
  /**
   * Disable animations based on user preference or system capabilities
   */
  respectReducedMotion?: boolean;
}

/**
 * Lazy Animation Provider
 * 
 * This component:
 * 1. Defers loading of framer-motion library (~102KB) until needed
 * 2. Uses intersection observer to detect when animations might be needed
 * 3. Respects user's reduced motion preferences
 * 4. Provides fallback for when animations aren't loaded
 * 5. Progressive enhancement - works without animations
 */
export const LazyAnimationProvider: React.FC<LazyAnimationProviderProps> = ({
  children,
  eager = false,
  respectReducedMotion = true,
}) => {
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(false);
  const [isMotionLoaded, setIsMotionLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const observerRef = useRef<IntersectionObserver>();
  const loadingRef = useRef(false);

  // Check if user prefers reduced motion
  const prefersReducedMotion = respectReducedMotion && 
    typeof window !== 'undefined' && 
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Load motion library when needed
  useEffect(() => {
    if (!shouldLoad || loadingRef.current || prefersReducedMotion) return;

    loadingRef.current = true;
    
    loadMotionLibrary().then((result) => {
      if (result) {
        setIsMotionLoaded(true);
        setIsAnimationEnabled(true);
      }
      loadingRef.current = false;
    });
  }, [shouldLoad, prefersReducedMotion]);

  // Set up intersection observer to detect when animations might be needed
  useEffect(() => {
    if (eager || shouldLoad || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // If any element that might need animation is in view, start loading
        if (entries.some(entry => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading before element is in view
        threshold: 0.1,
      }
    );

    observerRef.current = observer;

    // Observe elements that commonly use animations
    const animatedElements = document.querySelectorAll(
      '[data-animate], .card, .motion-div, [class*="animate"]'
    );

    animatedElements.forEach((el) => observer.observe(el));

    // Fallback: load after 3 seconds if no intersection detected
    const fallbackTimer = setTimeout(() => {
      setShouldLoad(true);
    }, 3000);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [eager, shouldLoad, prefersReducedMotion]);

  const enableAnimations = () => {
    if (!isAnimationEnabled && !prefersReducedMotion) {
      setShouldLoad(true);
    }
  };

  const contextValue: AnimationContextValue = {
    isAnimationEnabled: isAnimationEnabled && !prefersReducedMotion,
    isMotionLoaded,
    enableAnimations,
  };

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
};

/**
 * Lazy Motion Component
 * Drop-in replacement for framer-motion components
 * Renders as div until motion is loaded
 */
export const LazyMotion = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    animate?: any;
    initial?: any;
    transition?: any;
    variants?: any;
    whileHover?: any;
    whileTap?: any;
    [key: string]: any;
  }
>(({ children, className, animate, initial, transition, variants, whileHover, whileTap, ...props }, ref) => {
  const { isAnimationEnabled, isMotionLoaded } = useAnimation();

  // If animations are disabled or motion isn't loaded, render as regular div
  if (!isAnimationEnabled || !isMotionLoaded || !motion) {
    const { animate: _, initial: __, transition: ___, variants: ____, whileHover: _____, whileTap: ______, ...divProps } = props;
    return (
      <div ref={ref} className={className} {...divProps}>
        {children}
      </div>
    );
  }

  // Render with motion when available
  const MotionDiv = motion.div;
  return (
    <MotionDiv
      ref={ref}
      className={className}
      animate={animate}
      initial={initial}
      transition={transition}
      variants={variants}
      whileHover={whileHover}
      whileTap={whileTap}
      {...props}
    >
      {children}
    </MotionDiv>
  );
});

LazyMotion.displayName = 'LazyMotion';

/**
 * Hook for conditional animation properties
 * Returns animation props only when motion is loaded
 */
export const useMotionProps = (props: {
  animate?: any;
  initial?: any;
  transition?: any;
  variants?: any;
  whileHover?: any;
  whileTap?: any;
}) => {
  const { isAnimationEnabled, isMotionLoaded } = useAnimation();

  if (!isAnimationEnabled || !isMotionLoaded) {
    return {};
  }

  return props;
};

export default LazyAnimationProvider;
/**
 * useIntersectionObserver Hook - Performance optimization utility
 * Detects when elements enter/exit viewport for lazy loading
 */

import { useEffect, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean; // Only trigger once
  disabled?: boolean; // Disable observer
}

/**
 * useIntersectionObserver Hook
 * 
 * This hook:
 * 1. Observes when an element enters the viewport
 * 2. Supports customizable margins and thresholds
 * 3. Can trigger only once for lazy loading use cases
 * 4. Handles cleanup automatically
 * 5. Returns boolean indicating intersection state
 */
export const useIntersectionObserver = (
  elementRef: RefObject<Element>,
  options: UseIntersectionObserverOptions = {}
): boolean => {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0.1,
    once = true,
    disabled = false,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (disabled || !elementRef.current) return;

    // Early return if IntersectionObserver is not supported
    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true); // Fallback: assume visible
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        
        setIsIntersecting(isElementIntersecting);

        // If 'once' is true and element is intersecting, stop observing
        if (once && isElementIntersecting) {
          observer.unobserve(entry.target);
        }
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    const currentElement = elementRef.current;
    observer.observe(currentElement);

    // Cleanup
    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [
    elementRef,
    root,
    rootMargin,
    threshold,
    once,
    disabled,
  ]);

  return isIntersecting;
};

/**
 * useMultipleIntersectionObserver Hook
 * Observes multiple elements at once
 * Returns Map of element -> intersection state
 */
export const useMultipleIntersectionObserver = (
  elementRefs: RefObject<Element>[],
  options: UseIntersectionObserverOptions = {}
): Map<Element, boolean> => {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0.1,
    once = true,
    disabled = false,
  } = options;

  const [intersectionMap, setIntersectionMap] = useState<Map<Element, boolean>>(
    new Map()
  );

  useEffect(() => {
    if (disabled || elementRefs.length === 0) return;

    // Early return if IntersectionObserver is not supported
    if (!('IntersectionObserver' in window)) {
      const fallbackMap = new Map();
      elementRefs.forEach(ref => {
        if (ref.current) {
          fallbackMap.set(ref.current, true);
        }
      });
      setIntersectionMap(fallbackMap);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setIntersectionMap(prevMap => {
          const newMap = new Map(prevMap);
          
          entries.forEach(entry => {
            const isElementIntersecting = entry.isIntersecting;
            newMap.set(entry.target, isElementIntersecting);

            // If 'once' is true and element is intersecting, stop observing
            if (once && isElementIntersecting) {
              observer.unobserve(entry.target);
            }
          });

          return newMap;
        });
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    const currentElements: Element[] = [];
    elementRefs.forEach(ref => {
      if (ref.current) {
        currentElements.push(ref.current);
        observer.observe(ref.current);
      }
    });

    // Cleanup
    return () => {
      currentElements.forEach(element => {
        observer.unobserve(element);
      });
    };
  }, [
    elementRefs,
    root,
    rootMargin,
    threshold,
    once,
    disabled,
  ]);

  return intersectionMap;
};

export default useIntersectionObserver;
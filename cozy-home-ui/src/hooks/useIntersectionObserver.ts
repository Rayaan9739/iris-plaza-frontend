import { useEffect, useRef, useState, useCallback } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver<T extends HTMLElement>(
  options: UseIntersectionObserverOptions = {},
): [React.RefObject<T>, boolean] {
  const { threshold = 0.1, rootMargin = "50px", triggerOnce = true } = options;
  
  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (triggerOnce && hasTriggered.current) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting;
        setIsIntersecting(intersecting);

        if (intersecting && triggerOnce) {
          hasTriggered.current = true;
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isIntersecting];
}

// Hook for tracking visibility with custom callback
export function useVisibilityTracker(
  onVisible?: () => void,
  options: UseIntersectionObserverOptions = {},
): [React.RefObject<HTMLDivElement>, boolean] {
  const { threshold = 0, rootMargin = "100px" } = options;
  
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visibleRef.current) {
          visibleRef.current = true;
          setIsVisible(true);
          onVisible?.();
        } else if (!entry.isIntersecting) {
          visibleRef.current = false;
          setIsVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, onVisible]);

  return [ref, isVisible];
}
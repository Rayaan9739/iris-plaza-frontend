import { useState, memo } from "react";
import { useVisibilityTracker } from "@/hooks/useIntersectionObserver";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "4/3" | "16/9" | "1/1" | "auto";
  objectFit?: "cover" | "contain" | "fill";
  placeholderColor?: string;
  priority?: boolean;
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className,
  aspectRatio = "auto",
  objectFit = "cover",
  placeholderColor = "#e5e7eb",
  priority = false,
}: LazyImageProps) {
  const [containerRef, isInView] = useVisibilityTracker(undefined, {
    rootMargin: "100px",
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const aspectRatioClass = {
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-video",
    "1/1": "aspect-square",
    auto: "",
  }[aspectRatio];

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-gray-100",
        aspectRatioClass,
        className,
      )}
      style={{ backgroundColor: placeholderColor }}
    >
      {/* Placeholder shimmer effect */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
      )}

      {/* Actual image - loads only when in viewport */}
      {(isInView || priority) && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "absolute inset-0 h-full w-full transition-opacity duration-500",
            objectFit === "cover" ? "object-cover" : "object-contain",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <span className="text-xs text-gray-400">Image unavailable</span>
        </div>
      )}
    </div>
  );
});

// Optimized image with blur-up effect
interface BlurImageProps extends LazyImageProps {
  blurDataURL?: string;
}

export const BlurImage = memo(function BlurImage({
  src,
  alt,
  className,
  aspectRatio = "auto",
  blurDataURL,
}: BlurImageProps) {
  const [containerRef, isInView] = useVisibilityTracker(undefined, {
    rootMargin: "200px",
  });

  const [isLoaded, setIsLoaded] = useState(false);

  const aspectRatioClass = {
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-video",
    "1/1": "aspect-square",
    auto: "",
  }[aspectRatio];

  const showBlur = isInView && !isLoaded && blurDataURL;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-gray-100",
        aspectRatioClass,
        className,
      )}
    >
      {/* Blur placeholder */}
      {showBlur && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 h-full w-full object-cover blur-xl scale-110"
          aria-hidden="true"
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Main image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-700",
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
          )}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
});

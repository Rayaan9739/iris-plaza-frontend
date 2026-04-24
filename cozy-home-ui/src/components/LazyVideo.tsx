import { useState, useRef, useEffect, memo, useCallback } from "react";
import { useVisibilityTracker } from "@/hooks/useIntersectionObserver";
import { cn } from "@/lib/utils";
import { Play, Volume2, VolumeX } from "lucide-react";

interface LazyVideoProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  aspectRatio?: "4/3" | "16/9" | "1/1" | "auto";
  preload?: "none" | "metadata" | "auto";
  objectFit?: "cover" | "contain" | "fill";
}

// Global video loader manager to limit concurrent video loads
class VideoLoaderManager {
  private static instance: VideoLoaderManager;
  private activeLoaders: Set<string> = new Set();
  private maxConcurrent = 2;
  private queue: Array<{ id: string; resolve: () => void }> = [];

  static getInstance(): VideoLoaderManager {
    if (!VideoLoaderManager.instance) {
      VideoLoaderManager.instance = new VideoLoaderManager();
    }
    return VideoLoaderManager.instance;
  }

  async requestLoad(id: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.activeLoaders.size < this.maxConcurrent) {
        this.activeLoaders.add(id);
        resolve();
      } else {
        this.queue.push({ id, resolve });
      }
    });
  }

  release(id: string): void {
    this.activeLoaders.delete(id);
    const next = this.queue.shift();
    if (next) {
      this.activeLoaders.add(next.id);
      next.resolve();
    }
  }

  getActiveCount(): number {
    return this.activeLoaders.size;
  }
}

const videoManager = VideoLoaderManager.getInstance();

export const LazyVideo = memo(function LazyVideo({
  src,
  poster,
  className,
  autoPlay = false,
  muted = true,
  loop = false,
  playsInline = true,
  controls = false,
  aspectRatio = "auto",
  preload = "none",
  objectFit = "cover",
}: LazyVideoProps) {
  const [containerRef, isInView] = useVisibilityTracker(undefined, {
    rootMargin: "200px",
  });

  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loaderIdRef = useRef<string>(
    `video-${Math.random().toString(36).substr(2, 9)}`,
  );

  const aspectRatioClass = {
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-video",
    "1/1": "aspect-square",
    auto: "",
  }[aspectRatio];

  // Request to load video when in view
  useEffect(() => {
    if (isInView && !isReady && !hasError) {
      videoManager.requestLoad(loaderIdRef.current).then(() => {
        setIsReady(true);
      });
    }

    return () => {
      videoManager.release(loaderIdRef.current);
    };
  }, [isInView, isReady, hasError]);

  // Handle autoplay
  useEffect(() => {
    if (isReady && isInView && autoPlay && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented
        });
      }
    }
  }, [isReady, isInView, autoPlay]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-gray-900",
        aspectRatioClass,
        className,
      )}
    >
      {/* Video element - only created when in view */}
      {isInView && isReady && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className={`absolute inset-0 h-full w-full ${objectFit === "contain" ? "object-contain" : objectFit === "fill" ? "object-fill" : "object-cover"}`}
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          preload={preload}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setHasError(true)}
          onLoadedData={() => {
            if (autoPlay) {
              videoRef.current?.play();
            }
          }}
        />
      )}

      {/* Thumbnail placeholder (before video loads) */}
      {!isReady && !hasError && poster && (
        <img
          src={poster}
          alt="Video thumbnail"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Loading state */}
      {isInView && !isReady && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="h-8 w-8 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Play button overlay (for non-autoplay videos) */}
      {isReady && !autoPlay && !isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          aria-label="Play video"
        >
          <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="h-8 w-8 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Mute button (when playing) */}
      {isPlaying && !controls && (
        <button
          onClick={toggleMute}
          className="absolute bottom-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-white" />
          ) : (
            <Volume2 className="h-4 w-4 text-white" />
          )}
        </button>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <span className="text-xs text-gray-400">Video unavailable</span>
        </div>
      )}
    </div>
  );
});

// Preload video manager hook for explicit control
export function useVideoLoader() {
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCount(videoManager.getActiveCount());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return { activeCount, maxConcurrent: 2 };
}

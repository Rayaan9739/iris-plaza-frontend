import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { type Room } from "@/data/mockData";
import { getRoomById } from "@/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Maximize,
  Building2,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AmenitiesList } from "@/components/AmenitiesList";
import { LazyImage } from "@/components/LazyImage";
import { LazyVideo } from "@/components/LazyVideo";

const typeLabels: Record<string, string> = {
  ONE_BHK: "One BHK / Studio",
  TWO_BHK: "Two BHK",
  PENTHOUSE: "Penthouse",
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RoomDetails() {
  const { id } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // slider state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.addEventListener("fullscreenchange", () => {
        setIsFullscreen(!!document.fullscreenElement);
      });
    }
  }, []);

  const mediaItems = useMemo(() => {
    if (!room) return [];
    const items: { type: "image" | "video"; url: string }[] = [];
    (room.images || []).forEach((url) => {
      if (url) items.push({ type: "image", url });
    });
    if (room.videoUrl) {
      items.push({ type: "video", url: room.videoUrl });
    }
    return items;
  }, [room]);

  // reset slider position when media changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [mediaItems.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mediaItems.length) return;

      if (e.key === "ArrowLeft") {
        setCurrentIndex((i) => (i - 1 + mediaItems.length) % mediaItems.length);
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((i) => (i + 1) % mediaItems.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mediaItems.length]);

  useEffect(() => {
    if (!id) return;

    async function loadRoom() {
      try {
        setLoading(true);
        setError("");
        const data = await getRoomById(id);
        setRoom(data as Room);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load room";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadRoom();

    // Listen for room updates from admin panel
    function handleRoomsUpdated() {
      loadRoom();
    }
    window.addEventListener("rooms:updated", handleRoomsUpdated);

    return () => {
      window.removeEventListener("rooms:updated", handleRoomsUpdated);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-20 text-center text-muted-foreground">
          Loading room...
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-20 text-center">
          <p className="text-destructive">{error || "Room not found."}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/">Back</Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = String(room.status || "AVAILABLE");
  const isAvailable = status === "AVAILABLE";
  const isReserved = status === "RESERVED";
  const isOccupied = status === "OCCUPIED";
  const occupiedUntilLabel = formatDate(room.occupiedUntil);
  const badgeLabel = isAvailable
    ? "Available"
    : isReserved
      ? "Reserved"
      : isOccupied && occupiedUntilLabel
        ? `Available from ${occupiedUntilLabel}`
        : isOccupied
          ? "Occupied"
          : status === "MAINTENANCE"
            ? "Maintenance"
            : status;

  const buttonLabel = isReserved
    ? "Reserved"
    : isOccupied
      ? occupiedUntilLabel
        ? `Available from ${occupiedUntilLabel}`
        : "Occupied"
      : status === "MAINTENANCE"
        ? "Under Maintenance"
        : "Unavailable";
  const canStartBooking = isAvailable || isOccupied;
  const bookingActionLabel = isOccupied ? "Book for Future" : "Book Now";

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-4xl">
        <button
          onClick={() => globalThis.history.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* media gallery slider */}
        <div
          ref={containerRef}
          data-gallery
          className={`relative rounded-xl bg-muted aspect-[2/1] flex items-center justify-center mb-8 overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 aspect-auto" : ""}`}
          onTouchStart={(e) => setTouchStart(e.changedTouches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStart !== null) {
              const diff = e.changedTouches[0].clientX - touchStart;
              if (diff > 50)
                setCurrentIndex(
                  (i) => (i - 1 + mediaItems.length) % mediaItems.length,
                );
              else if (diff < -50)
                setCurrentIndex((i) => (i + 1) % mediaItems.length);
            }
            setTouchStart(null);
          }}
        >
          {mediaItems.length > 0 ? (
            mediaItems.map((item, idx) => (
              <div
                key={`${item.type}-${item.url}-${idx}`}
                className={`absolute inset-0 transition-opacity duration-300 ${
                  idx === currentIndex
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                {item.type === "image" ? (
                  <LazyImage
                    src={item.url}
                    alt={room.name}
                    className="h-full w-full object-contain"
                    aspectRatio="auto"
                    priority
                  />
                ) : (
                  <LazyVideo
                    src={item.url}
                    controls={true}
                    className="h-full w-full object-contain"
                    poster={room.images?.[0]}
                  />
                )}
              </div>
            ))
          ) : (
            <Building2 className="h-24 w-24 text-muted-foreground/20" />
          )}

          {/* Navigation arrows */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentIndex(
                    (i) => (i - 1 + mediaItems.length) % mediaItems.length,
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/60 rounded-full p-2 hover:bg-background z-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() =>
                  setCurrentIndex((i) => (i + 1) % mediaItems.length)
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/60 rounded-full p-2 hover:bg-background z-10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Fullscreen button */}
          <button
            onClick={() => {
              const container = document.querySelector("[data-gallery]");
              if (container) {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  container.requestFullscreen();
                }
              }
            }}
            className="absolute top-2 right-2 bg-background/60 rounded-full p-2 hover:bg-background z-10"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {/* Media counter */}
          {mediaItems.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/60 px-2 py-1 rounded-full text-xs z-10">
              {currentIndex + 1} / {mediaItems.length}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold font-display">{room.name}</h1>
                <StatusBadge variant={status as any}>{badgeLabel}</StatusBadge>
              </div>
              <p className="text-muted-foreground">
                {typeLabels[room.type] || room.type}
              </p>
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Maximize className="h-4 w-4" />
                {room.area} sq ft
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Floor {room.floor}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-semibold font-display mb-2">
                Description
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {room.description}
              </p>
            </div>

            <AmenitiesList
              amenities={room.amenities}
              variant="full"
              className="mt-4"
            />
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-lg border p-6 shadow-card sticky top-24">
              <div className="text-3xl font-bold font-display text-primary mb-1">
                ₹{room.rent}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / month
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Security deposit: ₹{room.deposit}
              </p>
              {isOccupied && occupiedUntilLabel && (
                <p className="text-sm text-muted-foreground mb-6 font-medium">
                  Available from {occupiedUntilLabel}
                </p>
              )}
              {canStartBooking ? (
                <Button asChild className="w-full" size="lg">
                  <Link to={`/booking?roomId=${room.id}`}>
                    {bookingActionLabel}
                  </Link>
                </Button>
              ) : (
                <Button disabled className="w-full" size="lg">
                  {buttonLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

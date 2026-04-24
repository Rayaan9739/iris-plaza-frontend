import { Link } from "react-router-dom";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { Room } from "@/data/mockData";
import { StatusBadge } from "./StatusBadge";
import { MapPin, Maximize, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AmenitiesList } from "./AmenitiesList";
import { LazyImage } from "./LazyImage";
import { LazyVideo } from "./LazyVideo";

interface RoomCardProps {
  room: Room;
  className?: string;
}

const typeLabels: Record<string, string> = {
  ONE_BHK: "One BHK / Studio",
  TWO_BHK: "Two BHK",
  PENTHOUSE: "Penthouse",
};

// Format dates in UTC to avoid client timezone shifts.
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatAvailableFromDate(dateString: string, isExplicitAvailableFrom = false): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  if (!isExplicitAvailableFrom) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return formatDate(date.toISOString());
}

export const RoomCard = memo(function RoomCard({ room, className }: RoomCardProps) {
  const previewMedia = room.previewMedia
    ? room.previewMedia
    : room.images?.[0]
      ? { type: "image", url: room.images[0] }
      : room.videoUrl
        ? { type: "video", url: room.videoUrl }
        : null;

  // Use availabilityStatus from API if available, fallback to status
  const availabilityStatus = room.availabilityStatus || room.status;
  const availableFrom = room.availableFrom;

  const occupiedUntilSource = availableFrom || room.occupiedUntil || null;
  const occupiedUntilTimestamp = occupiedUntilSource
    ? new Date(occupiedUntilSource)
    : null;
  const hasFutureOccupiedUntil = Boolean(
    occupiedUntilTimestamp &&
      !Number.isNaN(occupiedUntilTimestamp.getTime()) &&
      occupiedUntilTimestamp > new Date(),
  );

  const baseStatus = String(availabilityStatus || "AVAILABLE").toUpperCase();
  const status =
    baseStatus === "RESERVED" || baseStatus === "MAINTENANCE"
      ? baseStatus
      : hasFutureOccupiedUntil
        ? "OCCUPIED"
        : "AVAILABLE";
  const isAvailable = status === "AVAILABLE";
  const isReserved = status === "RESERVED";
  const isOccupied = status === "OCCUPIED";
  const isMaintenance = status === "MAINTENANCE";
  
  const occupiedUntilDate =
    hasFutureOccupiedUntil && occupiedUntilSource
      ? formatAvailableFromDate(occupiedUntilSource, Boolean(availableFrom))
      : null;

  const badgeContent = isAvailable
    ? "Available"
    : isReserved
      ? "Reserved"
      : isOccupied && occupiedUntilDate
        ? `Available from ${occupiedUntilDate}`
        : isOccupied
          ? "Occupied"
          : "Maintenance";

  const badgeVariant = isAvailable
    ? "AVAILABLE"
    : isReserved
      ? "RESERVED"
      : isOccupied
        ? "OCCUPIED"
        : "MAINTENANCE";

  return (
    <div
      className={cn(
        "group relative rounded-xl border shadow-card overflow-hidden transition-all flex flex-col h-full",
        isOccupied
          ? "bg-black/5 border-black/10"
          : isReserved || isMaintenance
            ? "bg-card text-muted-foreground"
            : "bg-card hover-lift",
        className,
      )}
    >
      {isOccupied && (
        <div className="absolute inset-0 bg-black/10 rounded-xl pointer-events-none z-30" />
      )}

      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden",
          isOccupied ? "bg-black/5" : "bg-muted",
        )}
      >
        {previewMedia ? (
          previewMedia.type === "video" ? (
            <LazyVideo
              src={previewMedia.url}
              className="absolute inset-0 h-full w-full"
              autoPlay={false}
              muted={true}
              loop={true}
              playsInline={true}
              poster={room.images?.[0]}
            />
          ) : (
            <LazyImage
              src={previewMedia.url}
              alt={room.name}
              className="absolute inset-0 h-full w-full"
              aspectRatio="4/3"
            />
          )
        ) : (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              isOccupied ? "bg-black/5" : "bg-muted",
            )}
          >
            <Building2Icon className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />

        <div className="absolute top-2 left-2 md:top-3 md:left-3 z-20">
          <StatusBadge variant={badgeVariant as any}>{badgeContent}</StatusBadge>
        </div>

        <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 z-20">
          <span
            className={cn(
              "text-xs md:text-sm font-semibold",
              isOccupied || isReserved || isMaintenance
                ? "text-white/90"
                : "text-primary-foreground",
            )}
          >
            {typeLabels[room.type] || room.type}
          </span>
        </div>
      </div>

      <div className="p-3 md:p-5 relative z-10 flex flex-col flex-1">
        <div className="card-content flex-1">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3
              className={cn(
                "font-semibold font-display text-sm md:text-lg leading-snug break-words",
                isOccupied || isReserved || isMaintenance
                  ? "text-foreground"
                  : "text-card-foreground",
              )}
            >
              {room.name}
            </h3>
            <span
              className={cn(
                "text-base md:text-lg font-bold",
                isOccupied || isReserved || isMaintenance
                  ? "text-foreground"
                  : "text-primary",
              )}
            >
              ₹{room.rent}
              <span className="text-xs font-normal text-muted-foreground">/mo</span>
            </span>
          </div>

          {isOccupied && occupiedUntilDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium mb-2">
              <Calendar className="h-3 w-3" />
              <span>Available from {occupiedUntilDate}</span>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-3 text-xs mb-2 md:mb-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Maximize className="h-3 w-3" />
              {room.area}m2
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Floor {room.floor}
            </span>
          </div>

          <AmenitiesList amenities={room.amenities} variant="card" className="mb-4" />
        </div>

        <div className="card-footer mt-auto">
          <Button
            asChild
            variant="outline"
            className={cn(
              "w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors",
              isReserved && "opacity-50 cursor-not-allowed",
            )}
            disabled={isReserved}
          >
            <Link to={`/rooms/${room.id}`}>
              {isReserved ? "Reserved" : "View Details"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
});

function Building2Icon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}

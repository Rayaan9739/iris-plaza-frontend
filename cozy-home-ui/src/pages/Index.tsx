import { useEffect, useMemo, useState } from "react";
import { RoomCard } from "@/components/RoomCard";
import { type Room } from "@/data/mockData";
import { getAvailableRooms } from "@/api";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const roomTypes = ["ALL", "ONE_BHK", "TWO_BHK", "PENTHOUSE"] as const;
const ROOM_TYPE_LABELS: Record<string, string> = {
  ONE_BHK: "One BHK / Studio",
  TWO_BHK: "Two BHK",
  PENTHOUSE: "Penthouse",
};

function currentMonthKey() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

const Index = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] =
    useState<(typeof roomTypes)[number]>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState(Number.MAX_SAFE_INTEGER);
  const [showFilters, setShowFilters] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeType, maxPrice, selectedMonth]);

  const handleTypeChange = (type: (typeof roomTypes)[number]) => {
    if (type === "ALL") {
      // When ALL is selected, reset all filters
      setActiveType("ALL");
      setSearch("");
      setMaxPrice(Number.MAX_SAFE_INTEGER);
      setSelectedMonth("");
    } else {
      setActiveType(type);
    }
  };

  const visibleRooms = useMemo(() => rooms, [rooms]);

  const priceCeiling = useMemo(() => {
    const highest = visibleRooms.reduce(
      (max, room) => (room.rent > max ? room.rent : max),
      0,
    );
    return Math.max(3000, Math.ceil(highest / 100) * 100);
  }, [visibleRooms]);

  const appliedMaxPrice = Math.min(maxPrice, priceCeiling);

  useEffect(() => {
    let isMounted = true;

    async function loadRooms(showLoader = false) {
      try {
        if (showLoader) setLoading(true);
        setError("");
        const data = await getAvailableRooms(selectedMonth);
        if (isMounted) {
          setRooms(data as Room[]);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load rooms";
        if (isMounted) {
          setError(message);
        }
      } finally {
        if (showLoader && isMounted) {
          setLoading(false);
        }
      }
    }

    function handleRoomsUpdated() {
      loadRooms(false);
    }

    loadRooms(true);
    window.addEventListener("rooms:updated", handleRoomsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("rooms:updated", handleRoomsUpdated);
    };
  }, [selectedMonth]);

  const filtered = useMemo(() => {
    let filteredRooms = visibleRooms;

    if (search) {
      filteredRooms = filteredRooms.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (activeType !== "ALL") {
      filteredRooms = filteredRooms.filter((r) => r.type === activeType);
    }

    filteredRooms = filteredRooms.filter(
      (r) => Number(r.rent) <= appliedMaxPrice,
    );

    return filteredRooms;
  }, [visibleRooms, search, activeType, appliedMaxPrice]);

  const sortedRooms = useMemo(() => {
    const resolveRoomStatus = (room: Room) => {
      const baseStatus = String(
        room.availabilityStatus ?? room.status ?? "AVAILABLE",
      ).toUpperCase();

      if (baseStatus === "RESERVED" || baseStatus === "MAINTENANCE") {
        return baseStatus;
      }

      const occupiedUntilSource = room.availableFrom ?? room.occupiedUntil;
      if (occupiedUntilSource) {
        const occupiedUntilDate = new Date(occupiedUntilSource);
        if (
          !Number.isNaN(occupiedUntilDate.getTime()) &&
          occupiedUntilDate > new Date()
        ) {
          return "OCCUPIED";
        }
      }

      return "AVAILABLE";
    };

    // Multi-level sorting: availability → date → price
    const sorted = [...filtered].sort((a, b) => {
      const aStatus = resolveRoomStatus(a);
      const bStatus = resolveRoomStatus(b);
      const aIsAvailable = aStatus === "AVAILABLE";
      const bIsAvailable = bStatus === "AVAILABLE";

      // 1. Availability status - AVAILABLE first
      if (aIsAvailable && !bIsAvailable) return -1;
      if (!aIsAvailable && bIsAvailable) return 1;

      // 2. For non-available rooms, sort by availableFrom date (earliest first)
      if (!aIsAvailable && !bIsAvailable) {
        const dateA = a.availableFrom
          ? new Date(a.availableFrom).getTime()
          : Number.MAX_SAFE_INTEGER;
        const dateB = b.availableFrom
          ? new Date(b.availableFrom).getTime()
          : Number.MAX_SAFE_INTEGER;
        if (dateA !== dateB) return dateA - dateB;
      }

      // 3. Price descending (higher price first)
      const rentA = Number(a.rent) || 0;
      const rentB = Number(b.rent) || 0;
      return rentB - rentA;
    });

    // Apply pagination
    const pageStart = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(pageStart, pageStart + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Total pages based on filtered results
  const totalPages = useMemo(
    () => Math.ceil(filtered.length / ITEMS_PER_PAGE),
    [filtered],
  );

  return (
    <div className="min-h-screen bg-background">
      <section
        className="relative flex items-center justify-center min-h-[60vh] md:min-h-[70vh] px-4"
        style={{
          backgroundImage: "url('/images/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 container max-w-3xl text-center pt-16">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display text-white mb-4 animate-fade-in drop-shadow-lg">
            Find Your Perfect Space
          </h1>
          <p className="text-base md:text-xl text-white/80 mb-8 animate-fade-in">
            Browse available rooms and studios. Book online in minutes.
          </p>
          <div className="flex items-center bg-white/95 backdrop-blur rounded-lg shadow-elevated p-2 max-w-xl mx-auto animate-fade-in">
            <Search className="h-5 w-5 text-muted-foreground ml-3" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            <Button size="sm">Search</Button>
          </div>
        </div>
      </section>

      <section className="container py-6 md:py-10">
        <div className="flex flex-col gap-3">
          {/* Top bar with filter toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 border rounded-xl shadow-sm bg-background hover:bg-accent transition-colors"
            >
              <span className="text-sm font-medium">Filters</span>
              <SlidersHorizontal
                className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Collapsible controls wrapper - contains BOTH tabs and filters */}
          <div
            className={`transition-all duration-300 overflow-hidden ${
              showFilters ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-3">
              {roomTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeType === type
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type === "ALL" ? "All" : ROOM_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Month
                </span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-md border bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Max ₹{appliedMaxPrice}/mo
                </span>
                <input
                  type="range"
                  min={3000}
                  max={priceCeiling}
                  step={100}
                  value={appliedMaxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-24 sm:w-32 md:w-40 accent-teal-600"
                />
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-16 text-muted-foreground">
            Loading rooms...
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>

            {sortedRooms.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  No rooms match your criteria.
                </p>
              </div>
            ) : (
              /* Pagination Controls */
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.max(1, totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Index;

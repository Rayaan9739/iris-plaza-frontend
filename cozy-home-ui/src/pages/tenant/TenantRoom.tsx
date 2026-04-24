import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { LazyImage } from "@/components/LazyImage";
import { Button } from "@/components/ui/button";
import { Check, MapPin, Maximize, AlertCircle, Home } from "lucide-react";
import {
  API_URL,
  getMyRoom,
  getMyActiveBooking,
  createCancellationRequest,
  getMyRequest,
} from "@/api";

export default function TenantRoom() {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellationRequest, setCancellationRequest] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const room = useMemo(() => {
    if (!booking?.room) return null;
    const rawRoom = booking.room;
    const amenities = Array.isArray(rawRoom.amenities)
      ? rawRoom.amenities
          .map((item: any) => item?.amenity?.name)
          .filter(Boolean)
      : [];
    const images = Array.isArray(rawRoom.images)
      ? rawRoom.images
          .map((item: any) => String(item?.url || "").trim())
          .map((url: string) => {
            if (!url) return "";
            if (/^https?:\/\//i.test(url)) return url;
            const normalized = url.startsWith("/") ? url : `/${url}`;
            return `${API_URL}${normalized}`;
          })
          .filter(Boolean)
      : [];

    return {
      ...rawRoom,
      amenities,
      images,
      rules: Array.isArray(rawRoom.rules) ? rawRoom.rules : [],
    };
  }, [booking]);

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
    if (!token) {
      setError("Please sign in to view room.");
      setLoading(false);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        // Use the new my-room endpoint
        const roomResponse = await getMyRoom(token);
        const request = await getMyRequest(token).catch(() => null);

        if (!active) return;

        // Set the booking data from the new endpoint
        if (roomResponse) {
          setBooking(roomResponse);
        }

        setCancellationRequest(request?.data || null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Failed to load room details",
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();

    // Listen for room updates from admin panel
    function handleRoomsUpdated() {
      load();
    }
    window.addEventListener("rooms:updated", handleRoomsUpdated);

    return () => {
      active = false;
      window.removeEventListener("rooms:updated", handleRoomsUpdated);
    };
  }, []);

  async function handleRequestCancellation() {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");

    if (!token) {
      setError("Please sign in to continue.");
      return;
    }

    if (!booking?.bookingId) {
      console.error("Cancellation attempt with missing bookingId");
      setError("Booking not found");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      console.log(
        "DEBUG: Full booking object:",
        JSON.stringify(booking, null, 2),
      );
      console.log(`DEBUG: bookingId value: "${booking?.bookingId}"`);
      console.log(`DEBUG: bookingId type: ${typeof booking?.bookingId}`);
      console.log("Submitting cancellation request:", {
        bookingId: booking?.bookingId,
        reason: cancellationReason,
      });

      if (!booking?.bookingId || typeof booking.bookingId !== "string") {
        throw new Error(
          `Invalid booking ID format (${typeof booking?.bookingId}). Please refresh the page.`,
        );
      }

      await createCancellationRequest(
        token,
        booking.bookingId,
        cancellationReason,
      );

      const request = await getMyRequest(token);
      setCancellationRequest(request?.data || null);
      setShowCancelDialog(false);
      setCancellationReason("");
    } catch (err) {
      console.error("Cancellation request submission error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit cancellation request",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout type="tenant">
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <h2 className="text-xl md:text-2xl font-bold font-display">My Room</h2>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {room ? (
          <div className="bg-card rounded-lg border shadow-card overflow-hidden">
            {/* Room Image - Mobile responsive aspect ratio */}
            <div className="aspect-[3/1] md:aspect-[4/1] bg-muted flex items-center justify-center">
              {room?.images?.[0] ? (
                <LazyImage
                  src={room.images[0]}
                  alt={room.name || "Room"}
                  className="h-full w-full"
                  aspectRatio="auto"
                />
              ) : (
                <span className="text-2xl md:text-4xl text-muted-foreground/20 font-display">
                  {room?.name || "No room assigned"}
                </span>
              )}
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-5">
              {/* Room Title and Status */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h3 className="text-lg md:text-xl font-bold font-display">
                  {room?.name || "-"}
                </h3>
                <StatusBadge variant="occupied">Occupied</StatusBadge>
              </div>

              {/* Room Details - Stack on mobile */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Maximize className="h-4 w-4" />
                  {room?.area || 0} sq ft
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Floor {room?.floor ?? "-"}
                </span>
                <span>₹{Number(room?.rent || 0).toLocaleString("en-IN")}</span>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="font-semibold mb-2">Amenities</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Array.isArray(room?.amenities) ? room.amenities : []).map(
                    (a: string) => (
                      <div key={a} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="break-words">{a}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* House Rules */}
              <div>
                <h4 className="font-semibold mb-2">House Rules</h4>
                <ul className="space-y-1">
                  {(Array.isArray(room?.rules) ? room.rules : []).map(
                    (r: string) => (
                      <li key={r} className="text-sm text-muted-foreground">
                        • {r}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              {/* Cancellation Request Status */}
              {cancellationRequest && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-amber-900 dark:text-amber-300">
                      {cancellationRequest.status === "PENDING" &&
                        "Cancellation Pending"}
                      {cancellationRequest.status === "APPROVED" &&
                        "Cancellation Approved"}
                      {cancellationRequest.status === "REJECTED" &&
                        "Cancellation Rejected"}
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-400 mt-0.5">
                      {cancellationRequest.status === "PENDING" &&
                        "Cancellation request sent. Waiting for admin approval."}
                      {cancellationRequest.status === "APPROVED" &&
                        "Your room will be released after 24 hours."}
                      {cancellationRequest.status === "REJECTED" &&
                        (cancellationRequest.rejectionReason
                          ? `Reason: ${cancellationRequest.rejectionReason}`
                          : "Your cancellation request was rejected.")}
                    </p>
                  </div>
                </div>
              )}

              {/* Cancel Button */}
              {!cancellationRequest && (
                <Button
                  variant="outline"
                  className="w-full border-destructive text-destructive hover:bg-destructive/5 min-h-[44px]"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={submitting}
                >
                  Cancel Room Request
                </Button>
              )}
            </div>
          </div>
        ) : (
          !loading && (
            <div className="bg-card rounded-lg border p-12 text-center shadow-card animate-in fade-in zoom-in duration-300">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Home className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold font-display mb-2">
                No room assigned
              </h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                You do not currently have an active room.
              </p>
            </div>
          )
        )}

        {/* Cancel Dialog - Mobile optimized */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg border shadow-lg max-w-sm w-full p-4 md:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold font-display">
                Cancel Room Request
              </h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to cancel your room booking? Admin
                approval is required.
              </p>

              <div>
                <label className="text-sm font-medium">Reason (Optional)</label>
                <textarea
                  className="w-full mt-1.5 p-2 border rounded-lg bg-muted/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                  rows={3}
                  placeholder="Tell us why you want to cancel..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancellationReason("");
                    setError("");
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-destructive hover:bg-destructive/90 min-h-[44px]"
                  onClick={handleRequestCancellation}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Home, CreditCard, Calendar, FileText } from "lucide-react";
import { getCurrentUser, getMyBookings, getMyPayments } from "@/api";
import { Button } from "@/components/ui/button";

export default function TenantDashboard() {
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Active booking: APPROVED or APPROVED_PENDING_PAYMENT with move-in date today or in the past
  const activeBooking = useMemo(() => {
    const active = bookings.find((b) => {
      const s = String(b.status || "").toUpperCase();
      const isApprovedStatus = s === "APPROVED" || s === "APPROVED_PENDING_PAYMENT";
      const moveInDate = b.moveInDate ? new Date(b.moveInDate) : null;
      moveInDate?.setHours(0, 0, 0, 0);
      const isMoveInPassed = moveInDate && moveInDate <= today;
      return isApprovedStatus && isMoveInPassed;
    });
    return active || null;
  }, [bookings]);

  // Upcoming/Future booking: any non-rejected booking with move-in date in the future
  const upcomingBooking = useMemo(() => {
    const upcoming = bookings.find((b) => {
      const s = String(b.status || "").toUpperCase();
      const isRejected = s === "REJECTED" || s === "CANCELLED" || s === "EXPIRED";
      if (isRejected) return false;

      const moveInDate = b.moveInDate ? new Date(b.moveInDate) : null;
      moveInDate?.setHours(0, 0, 0, 0);
      const isMoveInFuture = moveInDate && moveInDate > today;
      return isMoveInFuture;
    });
    return upcoming || null;
  }, [bookings]);

  const paymentSummary = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;

    const current = payments.find(
      (p) => String(p?.month || "") === currentMonth,
    );
    const upcoming = payments.find((p) => String(p?.month || "") === nextMonth);
    const fallbackRent = Number(
      activeBooking?.room?.rent || upcomingBooking?.room?.rent || 0
    );
    const currentMonthRent = Number(
      current?.rentAmount ?? current?.amount ?? fallbackRent,
    );
    const pendingAmount = Number(
      current?.pendingAmount ?? current?.borrowedAmount ?? 0,
    );
    const nextMonthRent = Number(
      upcoming?.rentAmount ?? upcoming?.amount ?? fallbackRent + pendingAmount,
    );

    return {
      currentMonthRent,
      pendingAmount,
      nextMonthRent,
    };
  }, [payments, activeBooking, upcomingBooking]);

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
    if (!token) {
      setError("Please sign in to view dashboard.");
      return;
    }

    let active = true;
    const load = async () => {
      try {
        setError("");
        const [me, myBookings, myPayments] = await Promise.all([
          getCurrentUser(token),
          getMyBookings(token),
          getMyPayments(token),
        ]);
        if (!active) return;
        setUser(me);
        setBookings(Array.isArray(myBookings) ? myBookings : []);
        setPayments(Array.isArray(myPayments) ? myPayments : []);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      }
    };

    void load();

    // Listen for updates from admin panel
    function handleDataUpdated() {
      load();
    }
    window.addEventListener("rooms:updated", handleDataUpdated);

    return () => {
      active = false;
      window.removeEventListener("rooms:updated", handleDataUpdated);
    };
  }, []);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Tenant";

  const currentRoomToDisplay = activeBooking || upcomingBooking;

  return (
    <DashboardLayout type="tenant">
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <h2 className="text-xl md:text-2xl font-bold font-display">
          Welcome back, {displayName}
        </h2>
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Stats Cards - Mobile First: 1 column on mobile, 2 on tablet, 4 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title={activeBooking ? "Current Room" : "Upcoming Room"}
            value={currentRoomToDisplay?.room?.name || "-"}
            icon={Home}
          />
          <StatsCard
            title="Current Month Rent"
            value={`Rs ${paymentSummary.currentMonthRent.toLocaleString("en-IN")}`}
            icon={CreditCard}
          />
          <StatsCard
            title="Pending Amount"
            value={`Rs ${paymentSummary.pendingAmount.toLocaleString("en-IN")}`}
            icon={Calendar}
          />
          <StatsCard
            title="Next Month Rent"
            value={`Rs ${paymentSummary.nextMonthRent.toLocaleString("en-IN")}`}
            icon={Calendar}
          />
        </div>

        {/* Current/Upcoming Room Details - Card that stacks on mobile */}
        {currentRoomToDisplay && (
          <div className="bg-card rounded-lg border p-4 md:p-6 shadow-card">
            <h3 className="text-lg font-semibold font-display mb-4">
              {activeBooking ? "Current Room" : "Upcoming Room"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Room</span>
                <p className="font-medium">{currentRoomToDisplay?.room?.name || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Move-in Date</span>
                <p className="font-medium">
                  {currentRoomToDisplay?.moveInDate
                    ? new Date(currentRoomToDisplay.moveInDate).toLocaleDateString(
                        "en-IN",
                      )
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p>
                  <StatusBadge
                    variant={
                      activeBooking
                        ? "approved"
                        : "pending"
                    }
                  >
                    {activeBooking ? "active" : "upcoming"}
                  </StatusBadge>
                </p>
              </div>
            </div>

            {/* View Agreement Button */}
            {currentRoomToDisplay?.agreement?.agreementUrl && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() =>
                    window.open(currentRoomToDisplay.agreement.agreementUrl, "_blank")
                  }
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Rental Agreement
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

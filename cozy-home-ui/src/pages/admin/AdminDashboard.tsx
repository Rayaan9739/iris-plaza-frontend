import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Home, Users, FileCheck, DollarSign, Wrench } from "lucide-react";
import {
  getAdminStats,
  getAllPayments,
  getPendingBookings,
  getOccupancyData,
  getAdminTenants,
} from "@/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = {
  primary: "#0d9488",
  secondary: "#64748b",
  occupied: "#0d9488",
  available: "#e2e8f0",
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueTenants, setRevenueTenants] = useState<any[]>([]);

  useEffect(() => {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin.");
      setLoading(false);
      return;
    }

    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [statsData, bookingsData, paymentData, occupancy, tenants] =
          await Promise.all([
            getAdminStats(token),
            getPendingBookings(token),
            getAllPayments(token),
            getOccupancyData(token),
            getAdminTenants(token),
          ]);
        if (!active) return;
        setStats(statsData || null);
        setPendingBookings(Array.isArray(bookingsData) ? bookingsData : []);
        setPayments(Array.isArray(paymentData) ? paymentData : []);
        setOccupancyData(occupancy || null);
        const normalizedTenants = Array.isArray(tenants) ? tenants : [];
        const total = normalizedTenants.reduce((sum: number, tenant: any) => {
          return sum + Number(tenant.room?.rent || 0);
        }, 0);
        setRevenueTenants(normalizedTenants);
        setTotalRevenue(total);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Failed to load admin dashboard",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const recentBookingActivity = useMemo(() => {
    const mapped = pendingBookings
      .filter((req) => {
        const status = String(req?.status || "").toUpperCase();
        return status === "PENDING" || status === "VERIFICATION_PENDING";
      })
      .map((req) => ({
        id: req.id,
        label: `${req?.user?.firstName || ""} ${req?.user?.lastName || ""} - ${req?.room?.name || "-"}`.trim(),
        roomName: req?.room?.name || "-",
        date: req?.createdAt
          ? new Date(req.createdAt).toLocaleDateString("en-IN")
          : "-",
        status:
          String(req?.status || "pending").toLowerCase() === "rejected"
            ? "rejected"
            : "pending",
      }));
    // Sort by room number (extract numeric part from roomName)
    mapped.sort((a, b) => {
      const extractRoomNumber = (roomName: string) => {
        const match = roomName.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      return extractRoomNumber(a.roomName) - extractRoomNumber(b.roomName);
    });
    return mapped.slice(0, 5);
  }, [pendingBookings]);

  const recentPaymentActivity = useMemo(
    () =>
      payments.slice(0, 3).map((p) => {
        const status = String(p?.status || "").toUpperCase();
        const badge =
          status === "COMPLETED"
            ? "paid"
            : status === "FAILED"
              ? "overdue"
              : "pending";
        return {
          id: p.id,
          tenantName:
            [p?.user?.firstName, p?.user?.lastName].filter(Boolean).join(" ") ||
            "Unknown",
          amount: Number(p?.amountPaid ?? p?.amount ?? 0),
          date: p?.createdAt
            ? new Date(p.createdAt).toLocaleDateString("en-IN")
            : "-",
          status: badge,
        };
      }),
    [payments],
  );

  const pieData = useMemo(() => {
    if (!occupancyData) return [];
    return [
      { name: "Occupied", value: occupancyData.occupiedRooms },
      { name: "Available", value: occupancyData.availableRooms },
    ];
  }, [occupancyData]);

  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      return {
        label: date.toLocaleString("en-IN", { month: "short" }),
        start: new Date(date.getFullYear(), date.getMonth(), 1),
      };
    });

    return months.map((m) => {
      const revenue = revenueTenants.reduce((sum: number, tenant: any) => {
        if (!tenant?.room) return sum;

        const end = tenant.room?.occupiedUntil
          ? new Date(tenant.room.occupiedUntil)
          : null;

        if (!end || end >= m.start) {
          return sum + Number(tenant.room?.rent || 0);
        }

        return sum;
      }, 0);

      return {
        month: m.label,
        revenue,
      };
    });
  }, [revenueTenants]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-primary font-bold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout type="admin">
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <h2 className="text-xl md:text-2xl font-bold font-display">
          Dashboard
        </h2>
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Stats Grid - Mobile First: 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title="Total Rooms"
            value={loading ? "..." : String(stats?.totalRooms ?? 0)}
            icon={Home}
          />
          <StatsCard
            title="Available Rooms"
            value={loading ? "..." : String(stats?.availableRooms ?? 0)}
            icon={Home}
          />
          <StatsCard
            title="Occupied Rooms"
            value={loading ? "..." : String(stats?.occupiedRooms ?? 0)}
            icon={Users}
          />
          <StatsCard
            title="Total Tenants"
            value={loading ? "..." : String(stats?.totalTenants ?? 0)}
            icon={Users}
          />
          <StatsCard
            title="Pending Booking Requests"
            value={loading ? "..." : String(stats?.pendingBookingRequests ?? 0)}
            icon={FileCheck}
          />
          <StatsCard
            title="Pending Maintenance Requests"
            value={
              loading ? "..." : String(stats?.pendingMaintenanceRequests ?? 0)
            }
            icon={Wrench}
          />
          <StatsCard
            title="Total Monthly Revenue"
            value={
              loading ? "..." : `\u20B9 ${totalRevenue.toLocaleString("en-IN")}`
            }
            icon={DollarSign}
          />
        </div>

        {/* Charts - Stack on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Revenue Chart */}
          <div className="bg-card rounded-lg border p-4 md:p-6 shadow-card">
            <h3 className="font-semibold font-display mb-4">
              Revenue Overview
            </h3>
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    className="text-xs"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `\u20B9${Number(v) / 1000}k`}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value) =>
                      `\u20B9 ${Number(value).toLocaleString("en-IN")}`
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill={COLORS.primary}
                    radius={[4, 4, 0, 0]}
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Occupancy Chart */}
          <div className="bg-card rounded-lg border p-4 md:p-6 shadow-card">
            <h3 className="font-semibold font-display mb-4">Occupancy Rate</h3>
            {occupancyData && occupancyData.totalRooms > 0 ? (
              <div className="h-64 md:h-72 flex flex-col items-center">
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              index === 0 ? COLORS.occupied : COLORS.available
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-sm">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2">
                  <p className="text-3xl font-bold text-primary">
                    {occupancyData.occupancyRate}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Occupancy Rate
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No occupancy data available yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity - Mobile Card Layout */}
        <div className="bg-card rounded-lg border shadow-card overflow-hidden">
          <div className="p-4 md:p-6 border-b">
            <h3 className="font-semibold font-display">Recent Activity</h3>
          </div>
          <div className="divide-y">
            {recentBookingActivity.map((req) => (
              <div
                key={req.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{req.label}</p>
                  <p className="text-xs text-muted-foreground">{req.date}</p>
                </div>
                <StatusBadge variant={req.status as any}>
                  {req.status}
                </StatusBadge>
              </div>
            ))}
            {recentPaymentActivity.map((p) => (
              <div
                key={p.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    Payment: {p.tenantName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rs {p.amount.toLocaleString("en-IN")} - {p.date}
                  </p>
                </div>
                <StatusBadge variant={p.status as any}>{p.status}</StatusBadge>
              </div>
            ))}
            {!loading &&
              recentBookingActivity.length === 0 &&
              recentPaymentActivity.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">
                  No recent activity.
                </div>
              )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

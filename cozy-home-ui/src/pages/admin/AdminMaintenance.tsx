import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import {
  approveAdminMaintenanceRequest,
  getAdminMaintenanceRequests,
  rejectAdminMaintenanceRequest,
} from "@/api";
import { Button } from "@/components/ui/button";

export default function AdminMaintenance() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState<any[]>([]);

  async function loadRequests() {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const maintenanceData = await getAdminMaintenanceRequests(token);
      setRequests(Array.isArray(maintenanceData) ? maintenanceData : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load maintenance requests",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  async function handleApprove(requestId: string) {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin.");
      return;
    }
    try {
      setError("");
      await approveAdminMaintenanceRequest(token, requestId);
      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve maintenance request",
      );
    }
  }

  async function handleReject(requestId: string) {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin.");
      return;
    }
    try {
      setError("");
      await rejectAdminMaintenanceRequest(token, requestId);
      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reject maintenance request",
      );
    }
  }

  const rows = useMemo(
    () =>
      requests.map((req) => {
        const category = String(req?.category || "").toUpperCase();
        const status = String(req?.status || "PENDING").toLowerCase();

        return {
          id: req.id,
          tenantName:
            [req?.user?.firstName, req?.user?.lastName].filter(Boolean).join(" ") ||
            [req?.tenant?.firstName, req?.tenant?.lastName].filter(Boolean).join(" ") ||
            "Unknown",
          title: req?.title || "-",
          category,
          roomName: req?.room?.name || req?.booking?.room?.name || "-",
          description: req?.description || "-",
          status,
          canTakeAction: status === "pending",
        };
      }),
    [requests],
  );

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold font-display">Maintenance Requests</h2>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="bg-card rounded-lg border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Tenant
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Room
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      Loading maintenance requests...
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3 font-medium">{req.tenantName}</td>
                      <td className="p-3 text-muted-foreground">{req.title}</td>
                      <td className="p-3 text-muted-foreground">{req.category}</td>
                      <td className="p-3 text-muted-foreground">{req.roomName}</td>
                      <td className="p-3 text-muted-foreground">{req.description}</td>
                      <td className="p-3">
                        <StatusBadge variant={req.status as any}>
                          {req.status}
                        </StatusBadge>
                      </td>
                      <td className="p-3 flex gap-2">
                        {req.canTakeAction ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-success border-success/30 hover:bg-success/10"
                              onClick={() => handleApprove(req.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => handleReject(req.id)}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      No maintenance requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

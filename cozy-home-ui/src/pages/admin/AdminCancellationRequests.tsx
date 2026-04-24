import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import {
  getPendingCancellationRequests,
  approveCancellationRequest,
  rejectCancellationRequest,
} from "@/api";

type CancellationRequestRow = {
  id: string;
  tenantName: string;
  phone: string;
  roomName: string;
  moveInDate: string;
  moveOutDate: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
};

function mapStatus(status: string): "pending" | "approved" | "rejected" {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "APPROVED") return "approved";
  if (normalized === "REJECTED") return "rejected";
  return "pending";
}

export default function AdminCancellationRequests() {
  const [rows, setRows] = useState<CancellationRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);

  async function loadRequests() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await getPendingCancellationRequests(token);
      const data = Array.isArray(response?.data) ? response.data : [];

      const mapped: CancellationRequestRow[] = data.map((item: any) => ({
        id: item.id,
        tenantName:
          [item?.tenant?.firstName, item?.tenant?.lastName]
            .filter(Boolean)
            .join(" ") || "Unknown",
        phone: String(item?.tenant?.phone || "-"),
        roomName: String(item?.booking?.room?.name || "-"),
        moveInDate: item?.booking?.moveInDate
          ? new Date(item.booking.moveInDate).toLocaleDateString("en-IN")
          : "-",
        moveOutDate: item?.booking?.moveOutDate
          ? new Date(item.booking.moveOutDate).toLocaleDateString("en-IN")
          : "-",
        requestDate: item?.requestedAt
          ? new Date(item.requestedAt).toLocaleDateString("en-IN")
          : new Date(item?.createdAt || Date.now()).toLocaleDateString("en-IN"),
        status: mapStatus(item?.status),
        reason: item?.reason,
      }));

      // Sort by room number (extract numeric part from roomName)
      const sortedMapped = mapped.sort((a, b) => {
        const extractRoomNumber = (roomName: string) => {
          const match = roomName.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        };
        return extractRoomNumber(a.roomName) - extractRoomNumber(b.roomName);
      });

      setRows(sortedMapped);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load cancellation requests",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const selectedRequest = useMemo(
    () => rows.find((r) => r.id === selected) || null,
    [rows, selected],
  );

  async function handleApprove(requestId: string) {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Admin access token not found.");
      return;
    }

    try {
      setActionInProgress(requestId);
      setError("");
      await approveCancellationRequest(token, requestId);
      await loadRequests();
      setSelected(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve request",
      );
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleReject(requestId: string) {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Admin access token not found.");
      return;
    }

    try {
      setActionInProgress(requestId);
      setError("");
      await rejectCancellationRequest(token, requestId, rejectReason);
      await loadRequests();
      setSelected(null);
      setShowRejectDialog(null);
      setRejectReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject request");
    } finally {
      setActionInProgress(null);
    }
  }

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold font-display">
          Room Cancellation Requests
        </h2>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {loading && (
          <p className="text-sm text-muted-foreground">Loading requests...</p>
        )}

        {!loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No pending cancellation requests.
          </p>
        )}

        {!loading && rows.length > 0 && (
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="bg-card rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelected(row.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-sm">{row.tenantName}</p>
                      <StatusBadge variant={row.status}>
                        {row.status}
                      </StatusBadge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <p className="font-medium">Room</p>
                        <p>{row.roomName}</p>
                      </div>
                      <div>
                        <p className="font-medium">Phone</p>
                        <p>{row.phone}</p>
                      </div>
                      <div>
                        <p className="font-medium">Move-in</p>
                        <p>{row.moveInDate}</p>
                      </div>
                      <div>
                        <p className="font-medium">Move-out</p>
                        <p>{row.moveOutDate}</p>
                      </div>
                    </div>
                  </div>
                  {row.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(row.id);
                        }}
                        disabled={actionInProgress === row.id}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRejectDialog(row.id);
                        }}
                        disabled={actionInProgress === row.id}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg border shadow-lg max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-semibold font-display">
                Cancellation Request Details
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Tenant</p>
                  <p className="font-semibold">{selectedRequest.tenantName}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Phone</p>
                  <p>{selectedRequest.phone}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Room</p>
                  <p className="font-semibold">{selectedRequest.roomName}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    Move-in Date
                  </p>
                  <p>{selectedRequest.moveInDate}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    Move-out Date
                  </p>
                  <p>{selectedRequest.moveOutDate}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    Request Date
                  </p>
                  <p>{selectedRequest.requestDate}</p>
                </div>
                {selectedRequest.reason && (
                  <div>
                    <p className="font-medium text-muted-foreground">Reason</p>
                    <p className="whitespace-pre-wrap">
                      {selectedRequest.reason}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelected(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {showRejectDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg border shadow-lg max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-semibold font-display">
                Reject Request
              </h3>
              <p className="text-sm text-muted-foreground">
                Provide a reason for rejecting this cancellation request.
              </p>

              <textarea
                className="w-full p-2 border rounded-lg bg-muted/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={3}
                placeholder="Rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={actionInProgress === showRejectDialog}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectDialog(null);
                    setRejectReason("");
                  }}
                  disabled={actionInProgress === showRejectDialog}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() =>
                    showRejectDialog && handleReject(showRejectDialog)
                  }
                  disabled={actionInProgress === showRejectDialog}
                >
                  {actionInProgress === showRejectDialog
                    ? "Rejecting..."
                    : "Reject"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

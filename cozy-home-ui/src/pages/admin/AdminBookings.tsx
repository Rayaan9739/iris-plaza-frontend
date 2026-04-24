import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import {
  approveBooking,
  getPendingBookings,
  rejectBooking,
  getAgreementByBooking,
  signAgreementAsAdmin,
} from "@/api";
import { Button } from "@/components/ui/button";
import {
  X,
  Eye,
  FileText,
  Image as ImageIcon,
  File,
  Pen,
  Download,
} from "lucide-react";

type BookingSource = "WALK_IN" | "BROKER";

type BookingDoc = {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileType: "pdf" | "image" | "other";
  status: "uploaded" | "pending" | "approved" | "rejected" | "submitted";
  uploadedAt?: string;
};

type BookingRow = {
  id: string;
  tenantName: string;
  phone: string;
  roomName: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "payment_pending";
  bookingSource: BookingSource;
  brokerName: string | null;
  documents: BookingDoc[];
  agreement?: {
    id: string;
    agreementUrl?: string;
    status: string;
    adminSigned: boolean;
    tenantSigned: boolean;
  };
};

function toDocFileType(
  mimeType?: string,
  fileUrl?: string,
): "pdf" | "image" | "other" {
  const mime = String(mimeType || "").toLowerCase();
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("image")) return "image";
  if (
    String(fileUrl || "")
      .toLowerCase()
      .endsWith(".pdf")
  )
    return "pdf";
  if (/\.(jpg|jpeg|png|webp)$/i.test(String(fileUrl || ""))) return "image";
  return "other";
}

function mapDocStatus(
  status: string,
): "uploaded" | "pending" | "approved" | "rejected" | "submitted" {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "APPROVED") return "approved";
  if (normalized === "REJECTED") return "rejected";
  if (normalized === "SUBMITTED") return "submitted";
  return "pending";
}

function mapBookingStatus(
  status: string,
): "pending" | "approved" | "rejected" | "payment_pending" {
  const normalized = String(status || "").toUpperCase();
  if (
    normalized === "PENDING" ||
    normalized === "PENDING_APPROVAL" ||
    normalized === "VERIFICATION_PENDING" ||
    normalized === "RESERVED"
  ) {
    return "pending";
  }
  if (normalized === "APPROVED") return "approved";
  if (normalized === "APPROVED_PENDING_PAYMENT") return "payment_pending";
  if (
    normalized === "REJECTED" ||
    normalized === "CANCELLED" ||
    normalized === "EXPIRED"
  ) {
    return "rejected";
  }
  return "approved";
}

function normalizeBookingSource(value: unknown): BookingSource {
  return String(value || "").toUpperCase() === "BROKER" ? "BROKER" : "WALK_IN";
}

function normalizeBrokerName(value: unknown): string | null {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function formatBookingSource(
  bookingSource: BookingSource,
  brokerName: string | null,
) {
  return bookingSource === "BROKER"
    ? (brokerName || "Broker")
    : "Walk-ins";
}

function normalizeAgreement(
  value: unknown,
): BookingRow["agreement"] | undefined {
  if (!value || typeof value !== "object") return undefined;

  const agreement = value as Record<string, unknown>;
  const id = String(agreement.id || "").trim();
  if (!id) return undefined;

  const agreementUrl =
    typeof agreement.agreementUrl === "string"
      ? agreement.agreementUrl
      : undefined;

  return {
    id,
    agreementUrl,
    status: String(agreement.status || "DRAFT"),
    adminSigned: Boolean(agreement.adminSigned),
    tenantSigned: Boolean(agreement.tenantSigned),
  };
}

export default function AdminBookings() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<BookingDoc | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signingBookingId, setSigningBookingId] = useState<string | null>(null);
  const [signingAgreement, setSigningAgreement] = useState<
    BookingRow["agreement"] | null
  >(null);

  const selectedBooking = useMemo(
    () => rows.find((b) => b.id === selected) || null,
    [rows, selected],
  );

  async function loadBookings() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await getPendingBookings(token);

      console.log("ADMIN BOOKINGS DATA:", JSON.stringify(data, null, 2));

      // Fetch agreements for approved bookings
      const mapped: BookingRow[] = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (item) => {
          const bookingSource = normalizeBookingSource(item?.bookingSource);
          const brokerName =
            bookingSource === "BROKER"
              ? normalizeBrokerName(item?.brokerName)
              : null;
          let agreement: BookingRow["agreement"] | undefined = undefined;

          // If booking is approved, try to get the agreement
          if (item.status === "APPROVED") {
            try {
              const agreementData = await getAgreementByBooking(token, item.id);
              agreement = normalizeAgreement(agreementData);
            } catch (e) {
              // Agreement might not exist yet
              console.log("No agreement found for booking:", item.id);
            }
          }

          return {
            id: item.id,
            tenantName:
              [item?.user?.firstName, item?.user?.lastName]
                .filter(Boolean)
                .join(" ") || "Unknown",
            phone: String(item?.user?.phone || "-"),
            roomName: String(item?.room?.name || "-"),
            date: item?.startDate
              ? new Date(item.startDate).toLocaleDateString("en-IN")
              : new Date(item?.createdAt || Date.now()).toLocaleDateString("en-IN"),
            status: mapBookingStatus(item?.status),
            bookingSource,
            brokerName,
            documents: (Array.isArray(item?.documents)
              ? item.documents
              : []
            ).map((doc: Record<string, unknown>) => ({
              id: String(doc.id || ""),
              name: String(doc.name || "Document"),
              type: String(doc.type || "OTHER"),
              fileUrl: String(doc.fileUrl || ""),
              fileType: toDocFileType(
                typeof doc.mimeType === "string" ? doc.mimeType : undefined,
                typeof doc.fileUrl === "string" ? doc.fileUrl : undefined,
              ),
              status: mapDocStatus(String(doc.status || "PENDING")),
              uploadedAt:
                typeof doc.uploadedAt === "string" ? doc.uploadedAt : undefined,
            })),
            agreement,
          };
        }),
      );
      // Sort by status priority first (pending on top, approved at bottom),
      // then by room number within the same status group.
      const statusPriority: Record<BookingRow["status"], number> = {
        pending: 0,
        payment_pending: 1,
        rejected: 2,
        approved: 3,
      };

      const sortedMapped = mapped.sort((a, b) => {
        const statusDiff = statusPriority[a.status] - statusPriority[b.status];
        if (statusDiff !== 0) return statusDiff;

        const extractRoomNumber = (roomName: string) => {
          const match = roomName.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        };
        return extractRoomNumber(a.roomName) - extractRoomNumber(b.roomName);
      });
      setRows(sortedMapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleApprove(id: string) {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin.");
      return;
    }
    try {
      setError("");
      await approveBooking(token, id);
      await loadBookings();
      setSelected(null);
      // Emit event to update rooms on home page immediately
      window.dispatchEvent(new Event("rooms:updated"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve booking",
      );
    }
  }

  async function handleReject(id: string) {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin.");
      return;
    }
    try {
      setError("");
      await rejectBooking(token, id);
      await loadBookings();
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject booking");
    }
  }

  async function handleOpenSignature(
    bookingId: string,
    agreement: BookingRow["agreement"],
  ) {
    setSigningBookingId(bookingId);
    setSigningAgreement(agreement);
    setShowSignature(true);
  }

  async function handleSignAgreement(signatureDataUrl: string) {
    const token = localStorage.getItem("accessToken");
    if (!token || !signingBookingId) {
      setError("Admin access token not found. Please sign in as admin.");
      return;
    }
    try {
      setError("");
      await signAgreementAsAdmin(token, signingBookingId, signatureDataUrl);
      setShowSignature(false);
      setSigningBookingId(null);
      setSigningAgreement(null);
      await loadBookings();
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign agreement");
    }
  }

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "image":
        return <ImageIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold font-display">Booking Requests</h2>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="bg-card rounded-lg border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Applicant
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Room
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Source
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-6 text-center text-muted-foreground"
                    >
                      Loading booking requests...
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
                      <td className="p-3 text-muted-foreground">
                        {req.roomName}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        <span
                          className={
                            req.bookingSource === "BROKER" ? "text-primary" : ""
                          }
                        >
                          {formatBookingSource(
                            req.bookingSource,
                            req.brokerName,
                          )}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{req.date}</td>
                      <td className="p-3">
                        <StatusBadge variant={req.status}>
                          {req.status}
                        </StatusBadge>
                      </td>
                      <td className="p-3 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelected(req.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {req.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-success border-success/30 hover:bg-success/10"
                              onClick={() => handleApprove(req.id)}
                            >
                              Approve Request
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
                        )}
                        {req.status === "payment_pending" && (
                          <span className="text-xs text-muted-foreground italic">
                            Awaiting Payment
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedBooking && (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-foreground/20 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-card w-full max-w-md h-full border-l shadow-elevated p-6 overflow-auto animate-slide-in-right"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold font-display">
                  Booking Details
                </h3>
                <button onClick={() => setSelected(null)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Applicant
                  </span>
                  <p className="font-medium">{selectedBooking.tenantName}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <p className="font-medium">{selectedBooking.phone}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Room</span>
                  <p className="font-medium">{selectedBooking.roomName}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Move-in</span>
                  <p className="font-medium">{selectedBooking.date}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Source</span>
                  <p className="font-medium">
                    {selectedBooking.bookingSource === "BROKER" ? (
                      <span className="text-primary">
                        Broker{" "}
                        {selectedBooking.brokerName
                          ? `(Name: ${selectedBooking.brokerName})`
                          : ""}
                      </span>
                    ) : (
                      <span>Walk-in</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
                  <p>
                    <StatusBadge variant={selectedBooking.status}>
                      {selectedBooking.status}
                    </StatusBadge>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Documents
                  </span>
                  <div className="mt-2 space-y-2">
                    {selectedBooking.documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setPreviewDoc(doc)}
                        className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          {getFileTypeIcon(doc.fileType)}
                          <span className="text-sm font-medium">
                            {doc.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            View
                          </span>
                          <StatusBadge variant={doc.status}>
                            {doc.status}
                          </StatusBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedBooking.status === "pending" && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                      onClick={() => handleApprove(selectedBooking.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleReject(selectedBooking.id)}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {/* Agreement Section for Approved Bookings */}
                {selectedBooking.status === "approved" &&
                  selectedBooking.agreement && (
                    <div className="border-t pt-4 mt-4">
                      <span className="text-sm text-muted-foreground">
                        Agreement
                      </span>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Status:</span>
                          <StatusBadge
                            variant={
                              selectedBooking.agreement.status === "ACTIVE"
                                ? "approved"
                                : "pending"
                            }
                          >
                            {selectedBooking.agreement.status || "DRAFT"}
                          </StatusBadge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Admin Signed:</span>
                          <span
                            className={
                              selectedBooking.agreement.adminSigned
                                ? "text-green-600"
                                : "text-yellow-600"
                            }
                          >
                            {selectedBooking.agreement.adminSigned
                              ? "Yes"
                              : "No"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Tenant Signed:</span>
                          <span
                            className={
                              selectedBooking.agreement.tenantSigned
                                ? "text-green-600"
                                : "text-yellow-600"
                            }
                          >
                            {selectedBooking.agreement.tenantSigned
                              ? "Yes"
                              : "No"}
                          </span>
                        </div>
                        {selectedBooking.agreement.agreementUrl && (
                          <div className="flex gap-2 mt-2">
                            <a
                              href={selectedBooking.agreement.agreementUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1"
                            >
                              <Button
                                variant="outline"
                                className="w-full"
                                size="sm"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </a>
                            {!selectedBooking.agreement.adminSigned && (
                              <Button
                                className="flex-1"
                                size="sm"
                                onClick={() =>
                                  handleOpenSignature(
                                    selectedBooking.id,
                                    selectedBooking.agreement,
                                  )
                                }
                              >
                                <Pen className="h-4 w-4 mr-2" />
                                Sign Agreement
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />

        {/* Signature Dialog */}
        {showSignature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
            <SignatureCanvas
              onSave={handleSignAgreement}
              onCancel={() => {
                setShowSignature(false);
                setSigningBookingId(null);
                setSigningAgreement(null);
              }}
              title="Sign as Landlord/Admin"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

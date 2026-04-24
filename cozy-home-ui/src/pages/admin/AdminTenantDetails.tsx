import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getAdminTenantById } from "@/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, User, Home, Calendar, File, Eye } from "lucide-react";

type BookingSource = "WALK_IN" | "BROKER";

function normalizeBookingSource(value: unknown): BookingSource {
  return String(value || "").toUpperCase() === "BROKER" ? "BROKER" : "WALK_IN";
}

function normalizeBrokerName(value: unknown): string | null {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function formatBookingSource(bookingSource: unknown, brokerName: unknown) {
  const normalizedSource = normalizeBookingSource(bookingSource);
  const normalizedBrokerName =
    normalizedSource === "BROKER" ? normalizeBrokerName(brokerName) : null;

  return normalizedSource === "BROKER"
    ? (normalizedBrokerName || "Broker")
    : "Walk-ins";
}

function formatIndianDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear());
  return `${day}-${month}-${year}`;
}

type TenantDocument = {
  id: string;
  type: string;
  url: string;
};

type TenantBooking = {
  id: string;
  status: string;
  moveInDate?: string | null;
  moveOutDate?: string | null;
  bookingSource?: BookingSource | string | null;
  brokerName?: string | null;
};

type TenantRoom = {
  name?: string | null;
  floor?: number | null;
  rent?: number | null;
  deposit?: number | null;
};

type TenantAgreement = {
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  agreementUrl?: string | null;
  url?: string | null;
};

type TenantDetails = {
  name: string;
  phone?: string | null;
  email?: string | null;
  status: string;
  tenantType?: string | null;
  expectedMoveIn?: string | null;
  booking?: TenantBooking | null;
  room?: TenantRoom | null;
  agreement?: TenantAgreement | null;
  documents?: TenantDocument[];
};

export default function AdminTenantDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenant() {
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("access_token");
      if (!token) {
        setError("Admin access token not found. Please sign in as admin.");
        setLoading(false);
        return;
      }

      if (!id) {
        setError("Tenant ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await getAdminTenantById(token, id);
        setTenant(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tenant details");
      } finally {
        setLoading(false);
      }
    }

    void loadTenant();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout type="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading tenant details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !tenant) {
    return (
      <DashboardLayout type="admin">
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tenants")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
          <p className="text-destructive">{error || "Tenant not found"}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tenants")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold font-display">Tenant Details</h2>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Tenant Info Card */}
        <div className="bg-card rounded-lg border shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Tenant Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{tenant.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{tenant.phone || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{tenant.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                tenant.tenantType === "FUTURE"
                  ? "bg-blue-100 text-blue-800"
                  : tenant.status === "APPROVED" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-yellow-100 text-yellow-800"
              }`}>
                {tenant.tenantType === "FUTURE" ? "Upcoming" : tenant.status}
              </span>
            </div>
            {tenant.tenantType === "FUTURE" && tenant.expectedMoveIn && (
              <div>
                <p className="text-sm text-muted-foreground">Expected Move-In</p>
                <p className="font-medium">
                  {formatIndianDate(tenant.expectedMoveIn)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Booking Info Card */}
        <div className="bg-card rounded-lg border shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Booking Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Move-in Date</p>
              <p className="font-medium">
                {tenant.booking?.moveInDate 
                  ? formatIndianDate(tenant.booking.moveInDate)
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Move-out Date</p>
              <p className="font-medium">
                {tenant.booking?.moveOutDate 
                  ? formatIndianDate(tenant.booking.moveOutDate)
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Booking Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                tenant.booking?.status === "APPROVED" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {tenant.booking?.status || "-"}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Booking ID</p>
              <p className="font-medium text-sm">{tenant.booking?.id || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Booking Source</p>
              <p className="font-medium">
                <span
                  className={
                    normalizeBookingSource(tenant.booking?.bookingSource) ===
                    "BROKER"
                      ? "text-primary"
                      : ""
                  }
                >
                  {formatBookingSource(
                    tenant.booking?.bookingSource,
                    tenant.booking?.brokerName,
                  )}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Room Details Card */}
        <div className="bg-card rounded-lg border shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Home className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Room Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Room Name</p>
              <p className="font-medium">{tenant.room?.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Floor</p>
              <p className="font-medium">{tenant.room?.floor ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Rent</p>
              <p className="font-medium">
                {tenant.room?.rent ? `Rs ${tenant.room.rent.toLocaleString("en-IN")}` : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Security Deposit</p>
              <p className="font-medium">
                {tenant.room?.deposit ? `Rs ${tenant.room.deposit.toLocaleString("en-IN")}` : "-"}
              </p>
            </div>
        </div>

        {/* Agreement Card */}
       </div>
           <div className="bg-card rounded-lg border shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Rental Agreement</h3>
          </div>
          {tenant.agreement ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Agreement Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tenant.agreement.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : tenant.agreement.status === "EXPIRED"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {tenant.agreement.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatIndianDate(tenant.agreement.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatIndianDate(tenant.agreement.endDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(tenant.agreement?.agreementUrl || tenant.agreement?.url, "_blank")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Agreement PDF
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No rental agreement found</p>
          )}
        </div>

        {/* Documents Card */}
        <div className="bg-card rounded-lg border shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <File className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Uploaded Documents</h3>
          </div>
          {tenant.documents && tenant.documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenant.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 flex flex-col items-center gap-2"
                >
                  <File className="h-8 w-8 text-muted-foreground" />
                  <p className="font-medium text-sm">{doc.type}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const docUrl = doc.url;
                        const fullUrl = /^https?:\/\//i.test(docUrl)
                          ? docUrl
                          : `${import.meta.env.VITE_API_URL || ''}${docUrl}`;
                        setViewingDoc(fullUrl);
                      }}
                    >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No documents uploaded</p>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Document Viewer</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}>
                X
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[80vh]">
              {viewingDoc.endsWith(".pdf") ? (
                <iframe
                  src={viewingDoc}
                  className="w-full h-[70vh]"
                  title="Document Viewer"
                />
              ) : (
                <img
                  src={viewingDoc}
                  alt="Document"
                  className="w-full h-auto"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

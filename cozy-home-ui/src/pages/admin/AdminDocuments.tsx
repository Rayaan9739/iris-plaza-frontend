import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { getAllDocuments } from "@/api";
import { FileText } from "lucide-react";

function mapDocStatus(status: string): "uploaded" | "pending" | "approved" | "rejected" {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "APPROVED") return "approved";
  if (normalized === "REJECTED") return "rejected";
  return "pending";
}

export default function AdminDocuments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);

  async function loadDocuments() {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("access_token");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await getAllDocuments(token);
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);


  const cards = useMemo(
    () =>
      documents.map((doc) => ({
        id: doc.id,
        name: doc.name || "Document",
        tenantName: [doc?.user?.firstName, doc?.user?.lastName].filter(Boolean).join(" ") || "Unknown",
        roomName: doc?.booking?.room?.name || "-",
        status: mapDocStatus(doc.status),
      })),
    [documents],
  );

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold font-display">Document Verification</h2>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && (
            <div className="text-sm text-muted-foreground">Loading documents...</div>
          )}
          {!loading && cards.map((doc) => (
            <div key={doc.id} className="bg-card rounded-lg border p-5 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.tenantName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge variant={doc.status}>{doc.status}</StatusBadge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Room: {doc.roomName}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}


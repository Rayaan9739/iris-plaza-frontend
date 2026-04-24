import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FileUploadCard } from "@/components/FileUploadCard";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { getMyDocuments, getMyAgreement, getAgreementByBooking, signAgreementAsTenant, API_URL } from "@/api";
import { FileText, Loader2, Pen, Download, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentViewer } from "@/components/DocumentViewer";

type DocStatus = "uploaded" | "pending" | "approved" | "rejected";

interface Document {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileName?: string;
  status: string;
  bookingId?: string;
}

interface CardData {
  title: string;
  status: DocStatus;
  fileName?: string;
  documentUrl?: string;
}

export default function TenantDocuments() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);
  const [agreement, setAgreement] = useState<any>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signingError, setSigningError] = useState("");

  // Check if URL is a PDF
  const isPdfUrl = (url: string) => {
    return url?.toLowerCase().includes('.pdf') || url?.toLowerCase().includes('raw=');
  };

  // Fetch all documents including rental agreement
  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
    if (!token) {
      setError("Please sign in to view documents.");
      setLoading(false);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        setError("");
        setSigningError("");
        // Use /documents/my which returns all documents including rental agreement
        const data = await getMyDocuments(token);
        
        // Also fetch agreement data
        try {
          const agreementData = await getMyAgreement(token);
          if (agreementData?.agreement) {
            setAgreement(agreementData.agreement);
          } else if (data.find((d: Document) => d.type === "AGREEMENT")) {
            // If agreement document exists but not in /agreements/my, try to get by booking
            const agreementDoc = data.find((d: Document) => d.type === "AGREEMENT");
            if (agreementDoc?.bookingId) {
              const byBooking = await getAgreementByBooking(token, agreementDoc.bookingId);
              setAgreement(byBooking);
            }
          }
        } catch (e) {
          console.log("No agreement found:", e);
        }
        
        if (!active) return;
        setDocs(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Failed to load documents",
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

  // Group documents by type
  const documents = useMemo(() => {
    const aadhaar = docs.find(d => d.type === "AADHAAR");
    const collegeId = docs.find(d => d.type === "COLLEGE_ID");
    const tenantPhoto = docs.find(d => d.type === "TENANT_PHOTO");
    const agreement = docs.find(d => d.type === "AGREEMENT");
    return { aadhaar, collegeId, tenantPhoto, agreement };
  }, [docs]);

  const cards = useMemo((): CardData[] => {
    const mapStatus = (value?: string): DocStatus => {
      const status = String(value || "").toUpperCase();
      if (status === "APPROVED") return "approved";
      if (status === "REJECTED") return "rejected";
      if (status === "PENDING") return "pending";
      return "uploaded";
    };

    return [
      { 
        title: "Aadhaar Card", 
        status: documents.aadhaar ? mapStatus(documents.aadhaar.status) : "pending",
        fileName: documents.aadhaar?.fileName,
        documentUrl: documents.aadhaar?.fileUrl
      },
      { 
        title: "College ID", 
        status: documents.collegeId ? mapStatus(documents.collegeId.status) : "pending",
        fileName: documents.collegeId?.fileName,
        documentUrl: documents.collegeId?.fileUrl
      },
      { 
        title: "Tenant Photo", 
        status: documents.tenantPhoto ? mapStatus(documents.tenantPhoto.status) : "pending",
        fileName: documents.tenantPhoto?.fileName,
        documentUrl: documents.tenantPhoto?.fileUrl
      },
    ];
  }, [documents]);

  const hasAgreement = documents.agreement?.fileUrl;

  const handleSignAgreement = async (signatureDataUrl: string) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
    if (!token || !agreement?.bookingId) {
      setSigningError("Please sign in to sign the agreement.");
      return;
    }
    try {
      setSigningError("");
      await signAgreementAsTenant(token, agreement.bookingId, signatureDataUrl);
      setShowSignature(false);
      // Refresh agreement data
      const agreementData = await getAgreementByBooking(token, agreement.bookingId);
      setAgreement(agreementData);
    } catch (err) {
      setSigningError(err instanceof Error ? err.message : "Failed to sign agreement");
    }
  };

  return (
    <DashboardLayout type="tenant">
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold font-display">Documents</h2>
        {error && <p className="text-sm text-destructive">{error}</p>}
        
        {/* Rental Agreement Section */}
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5" />
            <h3 className="font-semibold">Rental Agreement</h3>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasAgreement || agreement ? (
            <>
              {/* Agreement Status */}
              {agreement && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Status:</span>
                    <span className={`text-sm font-semibold ${
                      agreement.status === "ACTIVE" 
                        ? "text-green-600" 
                        : agreement.status === "SIGNED" || agreement.status === "PENDING_SIGNATURE"
                        ? "text-blue-600"
                        : "text-yellow-600"
                    }`}>
                      {agreement.status === "ACTIVE" 
                        ? "Active" 
                        : agreement.status === "SIGNED" 
                        ? "Signed (Awaiting Activation)"
                        : agreement.status === "PENDING_SIGNATURE"
                        ? "Pending Signature"
                        : "Draft"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      {agreement.tenantSigned ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>Your Signature</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {agreement.adminSigned ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>Admin Signature</span>
                    </div>
                  </div>
                  {signingError && (
                    <p className="text-sm text-destructive mt-2">{signingError}</p>
                  )}
                </div>
              )}

              <DocumentViewer 
                url={`${API_URL}/agreements/view/${documents.agreement?.bookingId || agreement?.bookingId}`} 
                title="Rental Agreement"
                className="h-[500px]"
              />

              {/* Download Agreement Button - Show for all agreement statuses */}
              {(documents.agreement?.fileUrl || agreement?.agreementUrl) && (
                <div className="mt-4">
                  <a
                    href={agreement?.agreementUrl || documents.agreement?.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Agreement (DOCX)
                    </Button>
                  </a>
                </div>
              )}

              {/* Sign Button */}
              {agreement && !agreement.tenantSigned && agreement.status !== "ACTIVE" && (
                <div className="mt-4">
                  <Button
                    onClick={() => setShowSignature(true)}
                    className="w-full"
                  >
                    <Pen className="h-4 w-4 mr-2" />
                    Sign Agreement
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Draw your signature to sign the agreement
                  </p>
                </div>
              )}

              {/* Active Agreement - Download Button */}
              {agreement?.status === "ACTIVE" && (
                <div className="mt-4">
                  <a
                    href={`${API_URL}/agreements/booking/${agreement.bookingId}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Signed Agreement
                    </Button>
                  </a>
                </div>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Not available yet
            </span>
          )}
        </div>

        {/* Document Cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((doc) => (
            <FileUploadCard
              key={doc.title}
              title={doc.title}
              status={doc.status}
              fileName={doc.fileName}
              documentUrl={doc.documentUrl}
              onUpload={() => {}}
              onPreview={() => {
                if (doc.documentUrl && documents.aadhaar?.id) { // We need the document ID for the view endpoint
                  // Find the document ID for the corresponding type
                  const fullDoc = docs.find(d => d.fileUrl === doc.documentUrl);
                  if (fullDoc) {
                    setPreviewPdf(`${API_URL}/documents/${fullDoc.id}/view`);
                  }
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] overflow-auto">
            <button
              className="absolute top-2 right-2 bg-white rounded-full p-2 text-black hover:bg-gray-200 z-10"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewPdf && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewPdf(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setPreviewPdf(null)}
            >
              Close Viewer ×
            </button>
            <DocumentViewer 
              url={previewPdf} 
              title="Document Preview" 
              className="h-[80vh]"
            />
          </div>
        </div>
      )}

      {/* Signature Dialog */}
      {showSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
          <SignatureCanvas
            onSave={handleSignAgreement}
            onCancel={() => setShowSignature(false)}
            title="Sign Your Rental Agreement"
          />
        </div>
      )}
    </DashboardLayout>
  );
}

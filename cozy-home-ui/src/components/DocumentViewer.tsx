import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentViewerProps {
  url: string;
  title?: string;
  className?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  url, 
  title = "Document", 
  className 
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let currentBlobUrl: string | null = null;

    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = 
          localStorage.getItem("access_token") || 
          localStorage.getItem("accessToken");

        if (!token) {
          throw new Error("No authorization token found");
        }

        // Determine if it's already a full URL or needs processing
        // If it's a Cloudinary URL or local relative path, we want to fetch it via our backend proxy
        // Typical structure: url could be document ID or raw URL
        // However, based on implementation plan, we should always go through backend for auth
        
        let fetchUrl = url;
        // If URL doesn't start with http, assume it's a document ID and use our new view endpoint
        // Otherwise, if it's already a secure Cloudinary URL, we still proxy it through backend
        // to ensure JwtAuthGuard protection on our side.
        
        // Let's assume the 'url' prop passed is either the document ID or the full URL.
        // If it's the full URL, we extract the document ID or similar if possible, 
        // OR we use a specific proxy path.
        
        // For simplicity, let's assume we pass the document ID or a specific path.
        // In TenantDocuments.tsx, we have doc.fileUrl.
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) throw new Error("Unauthorized access");
          if (response.status === 404) throw new Error("Document not found");
          throw new Error(`Failed to load document (${response.status})`);
        }

        const blob = await response.blob();
        if (!active) return;

        currentBlobUrl = URL.createObjectURL(blob);
        setPdfUrl(currentBlobUrl);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load document");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDocument();

    return () => {
      active = false;
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [url]);

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-12 bg-muted/30 rounded-lg", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground font-medium">Loading secure document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-12 bg-destructive/5 border border-destructive/20 rounded-lg", className)}>
        <AlertCircle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-sm text-destructive font-semibold mb-1">Preview failed</p>
        <p className="text-xs text-muted-foreground text-center max-w-[240px]">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 text-xs text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!pdfUrl) return null;

  return (
    <div className={cn("relative w-full h-[600px] bg-card border rounded-lg overflow-hidden shadow-sm", className)}>
      <iframe
        src={pdfUrl}
        title={title}
        className="w-full h-full border-none"
      />
      
      {/* Overlay to catch clicks if needed, though usually iframe handles interaction */}
      <div className="absolute top-0 right-0 p-2 pointer-events-none">
        <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-medium border shadow-xs flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-primary" />
          <span>Secure PDF View</span>
        </div>
      </div>
    </div>
  );
};

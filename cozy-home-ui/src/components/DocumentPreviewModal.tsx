import { useEffect, useCallback } from "react";
import { X, Download, FileText, Image as ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileType: "pdf" | "image" | "other";
  status: "uploaded" | "pending" | "approved" | "rejected" | "submitted";
  uploadedAt?: string;
}

interface DocumentPreviewModalProps {
  document: DocumentItem | null;
  onClose: () => void;
}

export function DocumentPreviewModal({
  document: doc,
  onClose,
}: DocumentPreviewModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (doc) {
      window.document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [doc, handleKeyDown]);

  if (!doc) return null;

  const renderPreview = () => {
    switch (doc.fileType) {
      case "pdf":
        return (
          <iframe
            src={doc.fileUrl}
            className="w-full h-full min-h-[60vh] border-0 rounded-md"
            title={doc.name}
          />
        );
      case "image":
        return (
          <div className="flex items-center justify-center h-full p-4">
            <img
              src={doc.fileUrl}
              alt={doc.name}
              className="max-w-full max-h-[70vh] object-contain rounded-md shadow-lg"
            />
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <File className="h-24 w-24 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">{doc.name}</p>
            <p className="text-sm text-muted-foreground mb-4">
              This file type cannot be previewed directly.
            </p>
            <Button asChild>
              <a
                href={doc.fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4 mr-2" />
                Download File
              </a>
            </Button>
          </div>
        );
    }
  };

  const getFileTypeIcon = () => {
    switch (doc.fileType) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "image":
        return <ImageIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-5xl h-[90vh] bg-card rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-card shrink-0">
          <div className="flex items-center gap-3">
            {getFileTypeIcon()}
            <div>
              <h3 className="font-semibold text-lg">{doc.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {doc.fileType} Document
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {doc.fileType !== "pdf" && doc.fileType !== "image" && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={doc.fileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6 bg-muted/20">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}

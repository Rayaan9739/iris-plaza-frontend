import { cn } from "@/lib/utils";
import {
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface FileUploadCardProps {
  title: string;
  status: "uploaded" | "pending" | "approved" | "rejected";
  fileName?: string;
  documentUrl?: string;
  onUpload?: () => void;
  onPreview?: () => void;
  className?: string;
}

const statusIcons = {
  uploaded: Upload,
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

export function FileUploadCard({
  title,
  status,
  fileName,
  documentUrl,
  onUpload,
  onPreview,
  className,
}: FileUploadCardProps) {
  const Icon = statusIcons[status];
  const isPdf = documentUrl?.toLowerCase().endsWith(".pdf");
  // Use Cloudinary URLs directly if they start with http
  const fullUrl = documentUrl?.startsWith("http") ? documentUrl : undefined;

  return (
    <div className={cn("bg-card rounded-lg border p-6 shadow-card", className)}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold font-display text-card-foreground">
          {title}
        </h4>
        <StatusBadge variant={status}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </StatusBadge>
      </div>
      {status === "pending" ? (
        <button
          onClick={onUpload}
          className="w-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-8 hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer"
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Click to upload</span>
          <span className="text-xs text-muted-foreground mt-1">
            PDF, JPG, PNG up to 10MB
          </span>
        </button>
      ) : fullUrl ? (
        <div className="space-y-3">
          {isPdf ? (
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-card-foreground break-words flex-1">
                {fileName || "document.pdf"}
              </span>
              <button
                onClick={onPreview}
                className="inline-flex items-center gap-1 px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                <Eye className="h-3 w-3" />
                <span>View</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <img
                src={fullUrl}
                alt={title}
                className="w-full h-48 rounded-lg object-cover border border-border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={onPreview}
              />
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <Eye className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-card-foreground break-words flex-1">
                  {fileName || "image"}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Icon
            className={cn(
              "h-5 w-5",
              status === "approved"
                ? "text-success"
                : status === "rejected"
                  ? "text-destructive"
                  : "text-info",
            )}
          />
          <span className="text-sm text-card-foreground">
            {fileName || "document.pdf"}
          </span>
        </div>
      )}
    </div>
  );
}

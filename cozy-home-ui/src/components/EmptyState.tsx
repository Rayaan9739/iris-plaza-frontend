import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        {icon || <FileText className="h-8 w-8 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold font-display text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        AVAILABLE: "bg-success/10 text-success border border-success/20",
        RESERVED: "bg-destructive/10 text-destructive border border-destructive/20",
        OCCUPIED: "bg-black text-white border border-black",
        MAINTENANCE: "bg-muted text-muted-foreground border border-border",
        available: "bg-accent text-accent-foreground border border-primary/20",
        unavailable: "bg-muted text-muted-foreground border border-border",
        reserved: "bg-muted text-muted-foreground border border-border",
        occupied: "bg-muted text-muted-foreground border border-border",
        pending: "bg-warning/10 text-warning border border-warning/20",
        paid: "bg-success/10 text-success border border-success/20",
        overdue: "bg-destructive/10 text-destructive border border-destructive/20",
        approved: "bg-success/10 text-success border border-success/20",
        upcoming: "bg-blue-100 text-blue-700 border border-blue-200",
        payment_pending: "bg-warning/10 text-warning border border-warning/20",
        rejected: "bg-destructive/10 text-destructive border border-destructive/20",
        uploaded: "bg-info/10 text-info border border-info/20",
        submitted: "bg-info/10 text-info border border-info/20",
        open: "bg-warning/10 text-warning border border-warning/20",
        "in-progress": "bg-info/10 text-info border border-info/20",
        resolved: "bg-success/10 text-success border border-success/20",
        low: "bg-muted text-muted-foreground border border-border",
        medium: "bg-warning/10 text-warning border border-warning/20",
        high: "bg-destructive/10 text-destructive border border-destructive/20",
      },
    },
    defaultVariants: {
      variant: "available",
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}

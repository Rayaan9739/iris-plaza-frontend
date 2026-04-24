import React from "react";
import { Button } from "@/components/ui/button";

interface InvoiceCardProps {
  id: string;
  billingPeriod: string;
  amount: number;
  status: "paid" | "due" | "overdue";
  onDownloadPDF: () => void;
}

export function InvoiceCard({
  billingPeriod,
  amount,
  status,
  onDownloadPDF,
}: InvoiceCardProps) {
  const statusStyles = {
    paid: {
      label: "Paid",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    due: {
      label: "Due",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    overdue: {
      label: "Overdue",
      className: "bg-red-100 text-red-700 border-red-200",
    },
  };

  const config = statusStyles[status];

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500 mb-1">{billingPeriod}</p>
          <h4 className="text-2xl font-bold text-slate-900">
            ₹{amount.toLocaleString("en-IN")}
          </h4>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
        >
          {config.label}
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onDownloadPDF}
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Download PDF
      </Button>
    </div>
  );
}

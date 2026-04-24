import React from "react";
import { Button } from "@/components/ui/button";

interface PaymentSummaryCardProps {
  month: string;
  amount: number;
  dueDate: string;
  status: "paid" | "due" | "overdue";
  lateFee?: number;
  onPayNow: () => void;
}

export function PaymentSummaryCard({
  month,
  amount,
  dueDate,
  status,
  lateFee,
  onPayNow,
}: PaymentSummaryCardProps) {
  const statusConfig = {
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

  const config = statusConfig[status];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-slate-500 mb-1">{month}</p>
          <h3 className="text-3xl font-bold text-slate-900">
            ₹{amount.toLocaleString("en-IN")}
          </h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}
        >
          {config.label}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Due Date</span>
          <span className="font-medium text-slate-900">{dueDate}</span>
        </div>
        {lateFee && lateFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Late Fee</span>
            <span className="font-medium text-red-600">₹{lateFee.toLocaleString("en-IN")}</span>
          </div>
        )}
      </div>

      {status !== "paid" && (
        <>
          {lateFee && lateFee > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">
                ⚠️ Late payment fee applicable. Pay now to avoid additional charges.
              </p>
            </div>
          )}
          <Button
            onClick={onPayNow}
            className="w-full py-6 text-lg font-semibold"
          >
            Pay Now
          </Button>
        </>
      )}

      {status === "paid" && (
        <Button
          variant="outline"
          className="w-full py-6 text-lg font-semibold"
          disabled
        >
          Payment Completed
        </Button>
      )}
    </div>
  );
}

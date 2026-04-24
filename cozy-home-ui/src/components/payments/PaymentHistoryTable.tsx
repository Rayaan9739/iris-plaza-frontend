import React from "react";
import { Button } from "@/components/ui/button";

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  month: string;
  amount: number;
  paymentDate?: string;
  status: "paid" | "due" | "overdue";
}

interface PaymentHistoryTableProps {
  payments: PaymentRecord[];
  isLoading?: boolean;
  onViewDetails: (payment: PaymentRecord) => void;
  onDownloadReceipt: (payment: PaymentRecord) => void;
}

export function PaymentHistoryTable({
  payments,
  isLoading,
  onViewDetails,
  onDownloadReceipt,
}: PaymentHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">Payment History</h3>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="h-4 bg-slate-200 rounded w-20" />
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-4 bg-slate-200 rounded w-20" />
              <div className="h-4 bg-slate-200 rounded w-16" />
              <div className="h-8 bg-slate-200 rounded w-24 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No Payment History
        </h3>
        <p className="text-slate-500">
          Your payment history will appear here once you make your first
          payment.
        </p>
      </div>
    );
  }

  const statusStyles = {
    paid: "bg-green-100 text-green-700",
    due: "bg-yellow-100 text-yellow-700",
    overdue: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-900">Payment History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                Invoice ID
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                Month
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                Payment Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                Status
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                  {payment.invoiceId}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {payment.month}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                  ₹{payment.amount.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {payment.paymentDate || "-"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      statusStyles[payment.status]
                    }`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(payment)}
                    >
                      View
                    </Button>
                    {payment.status === "paid" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadReceipt(payment)}
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Receipt
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing 1 to {payments.length} of {payments.length} entries
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

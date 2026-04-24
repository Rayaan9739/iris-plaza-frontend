import React from "react";

interface StatsWidgetProps {
  totalPaidThisYear: number;
  pendingAmount: number;
  nextDueDate: string;
}

export function StatsWidget({
  totalPaidThisYear,
  pendingAmount,
  nextDueDate,
}: StatsWidgetProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">
        Payment Overview
      </h3>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Paid This Year</p>
            <p className="text-xl font-bold text-emerald-600">
              ₹{totalPaidThisYear.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-500">Pending Amount</p>
            <p className="text-xl font-bold text-yellow-600">
              ₹{pendingAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-500">Next Due Date</p>
            <p className="text-xl font-bold text-blue-600">{nextDueDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

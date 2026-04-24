import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  month: string;
  lateFee?: number;
  onConfirmPayment?: (amount: number) => Promise<void> | void;
}

type PaymentStep = "summary" | "processing" | "success";

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  month,
  lateFee = 0,
  onConfirmPayment,
}: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>("summary");
  const [transactionId, setTransactionId] = useState("");

  const totalAmount = amount + lateFee;

  const handlePayment = async () => {
    setStep("processing");

    if (onConfirmPayment) {
      await onConfirmPayment(totalAmount);
    } else {
      // fallback for legacy usage
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    
    // Generate transaction ID
    const txId = "TXN" + Date.now().toString().slice(-10);
    setTransactionId(txId);
    
    setStep("success");
  };

  const handleClose = () => {
    setStep("summary");
    setTransactionId("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {step === "summary" && "Payment Summary"}
            {step === "processing" && "Processing Payment"}
            {step === "success" && "Payment Successful"}
          </h3>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "summary" && (
            <>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600">Billing Period</span>
                  <span className="font-medium text-slate-900">{month}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600">Rent Amount</span>
                  <span className="font-medium text-slate-900">
                    ₹{amount.toLocaleString("en-IN")}
                  </span>
                </div>
                {lateFee > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-600">Late Fee</span>
                    <span className="font-medium text-red-600">
                      ₹{lateFee.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3">
                  <span className="text-lg font-semibold text-slate-900">
                    Total Amount
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <Button onClick={handlePayment} className="w-full py-6 text-lg">
                Pay ₹{totalAmount.toLocaleString("en-IN")}
              </Button>
            </>
          )}

          {step === "processing" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 border-4 border-emerald-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" />
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-2">
                Processing Payment
              </h4>
              <p className="text-slate-500">
                Please wait while we process your payment...
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-4">
              <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-2">
                Payment Successful!
              </h4>
              <p className="text-slate-500 mb-6">
                Your payment has been processed successfully.
              </p>
              
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-500 mb-1">Transaction ID</p>
                <p className="font-mono font-semibold text-slate-900">
                  {transactionId}
                </p>
              </div>

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

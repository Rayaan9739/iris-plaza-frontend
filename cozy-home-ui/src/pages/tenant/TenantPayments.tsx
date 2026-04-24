import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  PaymentSummaryCard,
  PaymentHistoryTable,
  InvoiceCard,
  PaymentModal,
  StatsWidget,
  PaymentRecord,
} from "@/components/payments";
import {
  getMyApprovedBooking,
  getMyPayments,
  payMyPayment,
  downloadInvoice,
  uploadPaymentScreenshot,
} from "@/api";
import { QRCodeSVG } from "qrcode.react";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string, fallback: Date) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return fallback.toLocaleString("en-IN", { month: "long", year: "numeric" });
  }
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function addMonthKeepingDay(source: Date) {
  const day = source.getDate();
  const target = new Date(source.getFullYear(), source.getMonth() + 1, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(day, lastDay),
  );
}

export function TenantPayments() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [upiModalOpen, setUpiModalOpen] = useState(false);

  const token =
    localStorage.getItem("access_token") || localStorage.getItem("accessToken");

  const load = async () => {
    if (!token) {
      setError("Please sign in to view payments.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [bookingData, paymentData] = await Promise.all([
        getMyApprovedBooking(token),
        getMyPayments(token),
      ]);
      setBooking(bookingData || null);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const approvalDate = useMemo(() => {
    const approvedHistory = Array.isArray(booking?.statusHistory)
      ? booking.statusHistory.find((h: any) =>
          ["APPROVED", "APPROVED_PENDING_PAYMENT"].includes(
            String(h?.status || "").toUpperCase(),
          ),
        )
      : null;
    const raw =
      approvedHistory?.createdAt ||
      booking?.moveInDate ||
      booking?.startDate ||
      booking?.createdAt;
    const dt = raw ? new Date(raw) : null;
    return dt && !Number.isNaN(dt.getTime()) ? dt : null;
  }, [booking]);

  const dueDateText = useMemo(() => {
    if (!approvalDate) return "-";
    return addMonthKeepingDay(approvalDate).toLocaleDateString("en-IN");
  }, [approvalDate]);

  const paymentHistory: PaymentRecord[] = useMemo(
    () =>
      payments.map((p, index) => {
        const status = String(p.status || "").toUpperCase();
        const mappedStatus: "paid" | "due" | "overdue" =
          status === "COMPLETED"
            ? "paid"
            : status === "FAILED"
              ? "overdue"
              : "due";
        const createdDate = p.createdAt ? new Date(p.createdAt) : new Date();
        const amountPaid = Number(p.paidAmount ?? p.amountPaid ?? 0);
        return {
          id: p.id,
          invoiceId:
            p.gatewayOrderId ||
            `INV-${createdDate.getFullYear()}-${String(index + 1).padStart(3, "0")}`,
          month: monthLabel(String(p.month || ""), createdDate),
          amount: amountPaid,
          paymentDate:
            status === "COMPLETED"
              ? new Date(
                  p.updatedAt || p.createdAt || Date.now(),
                ).toLocaleDateString("en-IN")
              : undefined,
          status: mappedStatus,
        };
      }),
    [payments],
  );

  const currentPaymentRaw = useMemo(() => {
    const currentMonth = monthKey(new Date());
    return (
      payments.find((p) => String(p?.month || "") === currentMonth) ||
      payments.find(
        (p) => String(p?.status || "").toUpperCase() !== "COMPLETED",
      ) ||
      payments[0] ||
      null
    );
  }, [payments]);

  const currentAmount = Number(
    currentPaymentRaw?.rentAmount ??
      currentPaymentRaw?.amount ??
      booking?.room?.rent ??
      0,
  );
  const currentMonth = monthLabel(
    String(currentPaymentRaw?.month || monthKey(new Date())),
    new Date(),
  );
  const currentStatus: "paid" | "due" | "overdue" =
    String(currentPaymentRaw?.status || "").toUpperCase() === "COMPLETED"
      ? "paid"
      : String(currentPaymentRaw?.status || "").toUpperCase() === "FAILED"
        ? "overdue"
        : "due";
  const lateFee = 0;

  const invoices = paymentHistory.map((p) => ({
    id: p.id,
    billingPeriod: p.month,
    amount: p.amount,
    status: p.status,
  }));

  const totalPaidThisYear = payments
    .filter((p) => String(p?.status || "").toUpperCase() === "COMPLETED")
    .reduce((sum, p) => {
      const paid = Number(p?.paidAmount ?? p?.amountPaid ?? p?.amount ?? 0);
      return sum + paid;
    }, 0);

  const pendingAmount = Number(
    currentPaymentRaw?.pendingAmount ?? currentPaymentRaw?.borrowedAmount ?? 0,
  );

  const handlePayNow = () => {
    // Show UPI payment modal instead of automatic redirect
    setUpiModalOpen(true);
  };

  const handleConfirmPayment = async (amount: number) => {
    if (!token) {
      setError("Please sign in to pay.");
      return;
    }
    if (!currentPaymentRaw?.id) {
      setError("No payment record available for this month.");
      return;
    }

    await payMyPayment(token, {
      paymentId: currentPaymentRaw.id,
      amount,
    });

    await load();
  };

  const handleViewDetails = (payment: PaymentRecord) => {
    console.log("View details:", payment);
  };

  const handleDownloadReceipt = (payment: PaymentRecord) => {
    console.log("Download receipt:", payment);
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    if (!token) {
      console.error("No token available");
      return;
    }

    try {
      const blob = await downloadInvoice(token, invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download failed", error);
    }
  };

  const handleUploadScreenshot = () => {
    setUploadModalOpen(true);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!token) {
      setError("Please sign in to upload screenshot");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload jpg, png, or pdf");
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File too large. Maximum size is 10MB");
      return;
    }

    if (!currentPaymentRaw?.id) {
      setError("No payment record available");
      return;
    }

    setUploading(true);
    setError("");

    try {
      await uploadPaymentScreenshot(token, currentPaymentRaw.id, file);
      setUploadModalOpen(false);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload screenshot",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header - Mobile First */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Payments
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            Manage your monthly rent payments and view transaction history
          </p>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </div>

        {/* No active booking - show empty state */}
        {!booking && !loading && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No payments due</p>
            <p className="text-sm text-muted-foreground mt-1">
              You don't have an active room booking.
            </p>
          </div>
        )}

        {/* Main Content - Mobile First: Stack on mobile, side by side on desktop */}
        {booking && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Payment Summary */}
            <div className="lg:col-span-1 space-y-4 md:space-y-6">
              <PaymentSummaryCard
                month={currentMonth}
                amount={currentAmount}
                dueDate={dueDateText}
                status={currentStatus}
                lateFee={lateFee}
                onPayNow={handlePayNow}
              />
              <StatsWidget
                totalPaidThisYear={totalPaidThisYear}
                pendingAmount={pendingAmount}
                nextDueDate={dueDateText}
              />
            </div>

            {/* Right Column - History and Invoices */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {/* Payment History Table */}
              <PaymentHistoryTable
                payments={paymentHistory.slice(0, 3)}
                isLoading={loading}
                onViewDetails={handleViewDetails}
                onDownloadReceipt={handleDownloadReceipt}
              />

              {/* Bills & Invoices */}
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">
                  Bills & Invoices
                </h3>
                {/* Invoice Cards - Mobile First: 1 column on mobile, 2 on tablet, 3 on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {invoices.slice(0, 3).map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      id={invoice.id}
                      billingPeriod={invoice.billingPeriod}
                      amount={invoice.amount}
                      status={invoice.status}
                      onDownloadPDF={() => handleDownloadPDF(invoice.id)}
                    />
                  ))}
                  {/* Upload Screenshot Card - Touch friendly */}
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors min-h-[120px]"
                    onClick={handleUploadScreenshot}
                  >
                    <svg
                      className="w-8 h-8 text-slate-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-slate-600 text-center">
                      Upload Screenshot
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      jpg, png, pdf (max 10MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={currentAmount}
        month={currentMonth}
        lateFee={lateFee}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Upload Screenshot Modal - Mobile Optimized */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Upload Payment Screenshot
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              After making payment via UPI, please upload the payment screenshot
              for verification.
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileUpload}
              className="w-full border border-slate-300 rounded-md p-2 md:p-3 mb-4 text-sm"
              disabled={uploading}
            />
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2.5 md:py-2 text-slate-600 hover:bg-slate-100 rounded-md min-h-[44px]"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  document
                    .querySelector<HTMLInputElement>('input[type="file"]')
                    ?.click()
                }
                className="px-4 py-2.5 md:py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 min-h-[44px]"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Select File"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPI Payment Modal - Mobile Optimized */}
      {upiModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Pay via UPI</h3>

            <div className="flex flex-col items-center mb-4">
              <QRCodeSVG
                value={`upi://pay?pa=mohammedrayaan217@okhdfcbank&pn=Mohammed%20Rayaan&am=${currentAmount}&cu=INR`}
                size={180}
                level="H"
              />
            </div>

            <div className="bg-slate-50 rounded-md p-4 mb-4">
              <p className="text-sm font-medium text-slate-700 mb-2">UPI ID:</p>
              <p className="text-base md:text-lg font-semibold text-slate-900 break-all">
                mohammedrayaan217@okhdfcbank
              </p>
              <p className="text-sm font-medium text-slate-700 mt-3 mb-1">
                Amount:
              </p>
              <p className="text-2xl font-bold text-green-600">
                ₹{currentAmount.toLocaleString()}
              </p>
            </div>

            <div className="text-sm text-slate-600 mb-4">
              <p className="font-medium mb-2">How to pay:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open your UPI app (GPay, PhonePe, Paytm, etc.)</li>
                <li>Scan the QR code or enter the UPI ID</li>
                <li>Enter the amount and pay</li>
                <li>Take a screenshot of payment confirmation</li>
                <li>Click "Upload Screenshot" below</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setUpiModalOpen(false)}
                className="flex-1 px-4 py-2.5 md:py-2 text-slate-600 hover:bg-slate-100 rounded-md min-h-[44px]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setUpiModalOpen(false);
                  setUploadModalOpen(true);
                }}
                className="flex-1 px-4 py-2.5 md:py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 min-h-[44px]"
              >
                Upload Screenshot
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default TenantPayments;

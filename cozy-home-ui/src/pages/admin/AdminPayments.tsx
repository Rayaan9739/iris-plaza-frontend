import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { getAllPayments, markPaymentPaid } from "@/api";
import { Button } from "@/components/ui/button";
import { AdminPaymentModal } from "@/components/admin/AdminPaymentModal";

interface PaymentRow {
  id: string;
  tenantName: string;
  roomName: string;
  amount: number;
  amountPaid: number;
  borrowedAmount: number;
  month: string;
  status: string;
  canMarkPaid: boolean;
}

export default function AdminPayments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);

  async function loadPayments() {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const paymentData = await getAllPayments(token);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPayments();
  }, []);

  async function handleRecordPayment(data: {
    amountReceived: number;
    note: string;
    paymentMethod: string;
  }) {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Admin access token not found. Please sign in as admin.");
    }

    await markPaymentPaid(
      token,
      selectedPayment!.id,
      data.amountReceived,
      data.note,
      data.paymentMethod
    );
    await loadPayments();
  }

  function openPaymentModal(payment: PaymentRow) {
    setSelectedPayment(payment);
    setModalOpen(true);
  }

  const rows = useMemo(
    () =>
      payments.map((p) => {
        const tenantName =
          [p?.user?.firstName, p?.user?.lastName].filter(Boolean).join(" ") ||
          "Unknown";
        const roomName = p?.booking?.room?.name || "-";
        const amount = Number(p?.amount || 0);
        const amountPaid = Number(p?.amountPaid ?? amount);
        const borrowedAmount = Number(p?.borrowedAmount ?? 0);
        const month = String(p?.month || p?.rentCycle?.month || "-");
        const statusRaw = String(p?.status || "").toUpperCase();
        const status =
          statusRaw === "COMPLETED"
            ? "paid"
            : statusRaw === "PARTIAL"
              ? "partial"
              : statusRaw === "FAILED"
                ? "overdue"
                : "pending";
        return {
          id: p.id,
          tenantName,
          roomName,
          amount,
          amountPaid,
          borrowedAmount,
          month,
          status,
          canMarkPaid: statusRaw !== "COMPLETED",
        };
      }),
    [payments],
  );

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold font-display">Payment Monitoring</h2>
          <div className="text-sm text-muted-foreground">
            {rows.filter(r => r.status !== "paid").length} pending payment(s)
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="bg-card rounded-lg border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Tenant
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Room
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Monthly Rent
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Amount Paid
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">
                    Pending
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Month
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      Loading payments...
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((p) => (
                    <tr
                      key={p.id}
                      className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${
                        p.status === "overdue" ? "bg-destructive/5" : ""
                      }`}
                    >
                      <td className="p-3 font-medium">{p.tenantName}</td>
                      <td className="p-3 text-muted-foreground">{p.roomName}</td>
                      <td className="p-3">Rs {p.amount.toLocaleString("en-IN")}</td>
                      <td className="p-3">Rs {p.amountPaid.toLocaleString("en-IN")}</td>
                      <td className="p-3 hidden md:table-cell">
                        <span className={p.borrowedAmount > 0 ? "text-destructive" : "text-muted-foreground"}>
                          Rs {p.borrowedAmount.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{p.month}</td>
                      <td className="p-3">
                        <StatusBadge variant={p.status as any}>{p.status}</StatusBadge>
                      </td>
                      <td className="p-3">
                        {p.canMarkPaid ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPaymentModal(p)}
                          >
                            Record
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Received</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      No payments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminPaymentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        payment={selectedPayment}
        onSubmit={handleRecordPayment}
      />
    </DashboardLayout>
  );
}

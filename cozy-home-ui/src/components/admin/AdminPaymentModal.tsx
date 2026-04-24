import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentData {
  id: string;
  tenantName: string;
  roomName: string;
  amount: number;
  amountPaid: number;
  borrowedAmount: number;
  month: string;
}

interface AdminPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentData | null;
  onSubmit: (data: {
    amountReceived: number;
    note: string;
    paymentMethod: string;
  }) => Promise<void>;
}

export function AdminPaymentModal({
  open,
  onOpenChange,
  payment,
  onSubmit,
}: AdminPaymentModalProps) {
  const [amountReceived, setAmountReceived] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const remainingAmount = payment
    ? Number(payment.amount) - Number(payment.amountPaid)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;

    const amount = parseFloat(amountReceived);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amount > remainingAmount) {
      setError(`Amount cannot exceed remaining amount: Rs ${remainingAmount.toLocaleString("en-IN")}`);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onSubmit({
        amountReceived: amount,
        note,
        paymentMethod,
      });
      // Reset form
      setAmountReceived("");
      setNote("");
      setPaymentMethod("CASH");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAmountReceived("");
      setNote("");
      setPaymentMethod("CASH");
      setError("");
    }
    onOpenChange(isOpen);
  };

  const handleSetFullAmount = () => {
    setAmountReceived(remainingAmount.toString());
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment received from {payment.tenantName} for Room {payment.roomName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Payment Details */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Rent:</span>
                <span className="font-medium">Rs {Number(payment.amount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-medium">Rs {Number(payment.amountPaid).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2 mt-2">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium text-destructive">
                  Rs {remainingAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount Received */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount Received (Rs)</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="flex-1"
                />
                {remainingAmount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSetFullAmount}
                    className="whitespace-nowrap"
                  >
                    Full Amount
                  </Button>
                )}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Input
                id="note"
                placeholder="Add a note about this payment"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

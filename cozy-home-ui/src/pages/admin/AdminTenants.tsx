import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import {
  getAdminTenants,
  removeAdminTenant,
  createOfflineTenant,
  getAdminRooms,
} from "@/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Trash, Plus, X } from "lucide-react";

function mapTenantStatus(
  status: unknown,
  tenantType?: string,
): "approved" | "upcoming" | "payment_pending" | "pending" | "rejected" {
  const normalizedType = String(tenantType || "").toUpperCase();
  if (normalizedType === "FUTURE") return "upcoming";
  const normalized = String(status || "").toUpperCase();
  if (normalized === "APPROVED") return "approved";
  if (normalized === "APPROVED_PENDING_PAYMENT") return "payment_pending";
  if (normalized === "REJECTED") return "rejected";
  return "pending";
}

function getStatusLabel(
  status: string,
  tenantType?: string,
): string {
  const normalizedType = String(tenantType || "").toUpperCase();
  if (normalizedType === "FUTURE") return "Upcoming";
  if (status === "approved") return "Active";
  if (status === "payment_pending") return "Payment Pending";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

type BookingSource = "WALK_IN" | "BROKER";

interface RoomOption {
  id: string;
  name: string;
  rent: number;
  isAvailable: boolean;
  status: string;
}

interface CreateTenantForm {
  firstName: string;
  lastName: string;
  phone: string;
  roomId: string;
  moveInDate: string;
  moveOutDate: string;
  bookingSource: BookingSource;
  brokerName: string;
  isFutureBooking: boolean;
  expectedMoveIn: string;
  rentAmount: string;
}

const emptyForm: CreateTenantForm = {
  firstName: "",
  lastName: "",
  phone: "",
  roomId: "",
  moveInDate: "",
  moveOutDate: "",
  bookingSource: "WALK_IN",
  brokerName: "",
  isFutureBooking: false,
  expectedMoveIn: "",
  rentAmount: "",
};

export default function AdminTenants() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tenants, setTenants] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateTenantForm>({ ...emptyForm });
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadTenants() {
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
      const tenantData = await getAdminTenants(token);
      if (tenantData == null) {
        throw new Error("Failed to load tenants. Please refresh and try again.");
      }
      const normalized = Array.isArray(tenantData)
        ? tenantData
        : Array.isArray(tenantData?.tenants)
          ? tenantData.tenants
          : Array.isArray(tenantData?.data)
            ? tenantData.data
            : [];
      setTenants(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }

  async function loadRooms() {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) return;
    try {
      const roomsData = await getAdminRooms(token);
      if (roomsData == null) {
        return;
      }
      const normalizedRooms: RoomOption[] = Array.isArray(roomsData)
        ? roomsData.map((r: any) => ({
            id: r.id,
            name: r.name,
            rent: Number(r.rent ?? 0),
            isAvailable: r.isAvailable ?? true,
            status: r.status || "AVAILABLE",
          }))
        : [];
      setRooms(normalizedRooms);
    } catch {
      // silently fail - rooms will be empty
    }
  }

  useEffect(() => {
    void loadTenants();
  }, []);

  function openModal() {
    setForm({ ...emptyForm });
    setFormError("");
    setShowModal(true);
    void loadRooms();
  }

  function closeModal() {
    setShowModal(false);
    setForm({ ...emptyForm });
    setFormError("");
  }

  function updateForm(field: keyof CreateTenantForm, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      setFormError("Admin access token not found.");
      return;
    }

    if (!form.firstName || !form.phone || !form.roomId) {
      setFormError("First name, phone, and room are required.");
      return;
    }

    if (form.isFutureBooking && !form.expectedMoveIn) {
      setFormError("Expected move-in date is required for future bookings.");
      return;
    }

    if (!form.isFutureBooking && !form.moveInDate) {
      setFormError("Move-in date is required.");
      return;
    }

    if (form.bookingSource === "BROKER" && !form.brokerName.trim()) {
      setFormError("Broker name is required when booking source is Broker.");
      return;
    }

    if (form.isFutureBooking && !form.expectedMoveIn) {
      setFormError("Expected move-in date is required for future bookings.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName || undefined,
        phone: form.phone,
        roomId: form.roomId,
        moveInDate: form.isFutureBooking ? form.expectedMoveIn : form.moveInDate,
        moveOutDate: form.moveOutDate || undefined,
        bookingSource: form.bookingSource,
        brokerName: form.bookingSource === "BROKER" ? form.brokerName : undefined,
        isFutureBooking: form.isFutureBooking,
        expectedMoveIn: form.isFutureBooking ? form.expectedMoveIn : undefined,
        rentAmount: form.rentAmount ? Number(form.rentAmount) : undefined,
      };

      const created = await createOfflineTenant(token, payload);
      if (!created) {
        throw new Error("Could not create tenant. Please check room dates and try again.");
      }
      closeModal();
      await loadTenants();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create tenant",
      );
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    void loadTenants();
  }, []);

  async function handleRemoveTenant(userId: string) {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin.");
      return;
    }

    if (!confirm("Remove this tenant and free the room?")) {
      return;
    }

    try {
      setError("");
      await removeAdminTenant(token, userId);
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove tenant");
    }
  }

  const rows = useMemo(() => {
    const mapped = tenants.map((t) => {
      const user = t?.user || t;
      const room = t?.room || {};
      const tenantType = t?.tenantType;
      const status = mapTenantStatus(t?.status, tenantType);
      return {
        id: t?.userId || user?.id,
        rowKey: `${t?.userId || user?.id}-${t?.bookingId || "booking"}`,
        name:
          t?.name ||
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          "Unknown",
        phone: user?.phone || t?.phone || "-",
        roomName: room?.name || "-",
        moveInDate: t?.moveInDate
          ? new Date(t.moveInDate).toLocaleDateString("en-IN")
          : "-",
        rent: Number(t?.rent ?? room?.rent ?? 0),
        status,
        tenantType,
        statusLabel: getStatusLabel(status, tenantType),
      };
    });
    // Sort by room number (extract numeric part from roomName)
    return mapped.sort((a, b) => {
      const extractRoomNumber = (roomName: string) => {
        const match = roomName.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      return extractRoomNumber(a.roomName) - extractRoomNumber(b.roomName);
    });
  }, [tenants]);

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-display">Tenant Management</h2>
          <Button onClick={openModal} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Tenant
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="bg-card rounded-lg border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Phone
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Room
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Move-in Date
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Rent
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-muted-foreground"
                    >
                      Loading tenants...
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((t) => (
                    <tr
                      key={t.rowKey}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3 font-medium">{t.name}</td>
                      <td className="p-3 text-muted-foreground">{t.phone}</td>
                      <td className="p-3 text-muted-foreground">
                        {t.roomName}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {t.moveInDate}
                      </td>
                      <td className="p-3">
                        Rs {t.rent.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3">
                        <StatusBadge variant={t.status as any}>
                          {t.statusLabel}
                        </StatusBadge>
                      </td>
                      <td className="p-3 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/tenants/${t.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTenant(t.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-muted-foreground"
                    >
                      No tenants found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
              <h3 className="text-lg font-semibold">Create Tenant</h3>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {formError && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                  {formError}
                </p>
              )}

              {/* Future Booking Toggle */}
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFutureBooking}
                    onChange={(e) =>
                      updateForm("isFutureBooking", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
                <span className="text-sm font-medium">Future Booking</span>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => updateForm("firstName", e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => updateForm("lastName", e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Room *
                </label>
                <Select
                  value={form.roomId}
                  onValueChange={(value) => updateForm("roomId", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} - Rs {room.rent.toLocaleString("en-IN")}
                        {room.isAvailable ? "" : " (Occupied)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Move-in Date - shown when NOT future booking */}
              {!form.isFutureBooking && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Move-in Date *
                    </label>
                    <input
                      type="date"
                      value={form.moveInDate}
                      onChange={(e) => updateForm("moveInDate", e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Move-out Date
                    </label>
                    <input
                      type="date"
                      value={form.moveOutDate}
                      onChange={(e) =>
                        updateForm("moveOutDate", e.target.value)
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    />
                  </div>
                </div>
              )}

              {/* Custom Rent */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Custom Rent Amount
                </label>
                <input
                  type="number"
                  value={form.rentAmount}
                  onChange={(e) => updateForm("rentAmount", e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="Leave empty to use room rent"
                />
              </div>

              {/* Future Booking Details - shown when toggle is on */}
              {form.isFutureBooking && (
                <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
                  <h4 className="text-sm font-semibold text-primary">
                    Future Booking Details
                  </h4>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Expected Move-In Date *
                    </label>
                    <input
                      type="date"
                      value={form.expectedMoveIn}
                      onChange={(e) =>
                        updateForm("expectedMoveIn", e.target.value)
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Booking Source
                    </label>
                    <select
                      value={form.bookingSource}
                      onChange={(e) =>
                        updateForm("bookingSource", e.target.value as BookingSource)
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    >
                      <option value="WALK_IN">Walk-in</option>
                      <option value="BROKER">Broker</option>
                    </select>
                  </div>

                  {form.bookingSource === "BROKER" && (
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Broker Name *
                      </label>
                      <input
                        type="text"
                        value={form.brokerName}
                        onChange={(e) =>
                          updateForm("brokerName", e.target.value)
                        }
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Booking Source - shown when NOT future booking */}
              {!form.isFutureBooking && (
                <>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Booking Source
                    </label>
                    <select
                      value={form.bookingSource}
                      onChange={(e) =>
                        updateForm("bookingSource", e.target.value as BookingSource)
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    >
                      <option value="WALK_IN">Walk-in</option>
                      <option value="BROKER">Broker</option>
                    </select>
                  </div>

                  {form.bookingSource === "BROKER" && (
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Broker Name *
                      </label>
                      <input
                        type="text"
                        value={form.brokerName}
                        onChange={(e) =>
                          updateForm("brokerName", e.target.value)
                        }
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        required
                      />
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting
                    ? "Creating..."
                    : form.isFutureBooking
                      ? "Create Future Booking"
                      : "Create Tenant"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

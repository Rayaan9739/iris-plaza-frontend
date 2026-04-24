import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getAdminRooms, updateAdminRoom, getAdminTenants, updateAdminTenant, createOfflineTenant, uploadVerificationFile, createDocumentRecord } from "@/api";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, X, Calendar, User, Phone, Briefcase, Edit, Home, IndianRupee, FileText, type LucideIcon } from "lucide-react";

interface Room {
  id: string;
  name: string;
  type: string;
  status: string;
  isAvailable: boolean;
  occupiedUntil: string | null;
  floor: number;
  rent: number;
}

/* ─── Mark Available form state ─── */
interface AvailableForm {
  availableFrom: string; // YYYY-MM-DD
}

/* ─── Mark Occupied form state ─── */
interface OccupiedForm {
  tenantName: string;
  phone: string;
  bookingSource: string;
  brokerName: string;
  rent: number;
  occupiedUntil: string;
}

const BOOKING_SOURCES = [
  { value: "WALK_IN", label: "Walk-in" },
  { value: "BROKER", label: "Broker" },
];

/* ─── Tenant interface ─── */
interface Tenant {
  id: string;
  bookingId?: string;
  name: string;
  phone: string;
  email: string;
  status?: string;
  tenantType?: string;
  bookingSource?: string;
  brokerName?: string;
  room?: {
    id: string;
    name: string;
    rent: number;
    status?: string;
    occupiedUntil?: string | null;
  };
}

/* ─── Update Tenant modal state ─── */
interface UpdateTenantModalState {
  tenant: Tenant | null;
  userId: string;
  roomId: string;
  roomName: string;
  isNewTenant: boolean; // true = add new tenant, false = update existing
}

/* ─── Update Tenant form state ─── */
interface UpdateTenantForm {
  firstName: string;
  lastName: string;
  phone: string;
  updateRoomId: string;
  roomChangeDate: string;
  extendOccupiedUntil: string;
  newRent: number;
  bookingSource: string;
  brokerName: string;
  createFutureBooking: boolean;
  futureTenantName: string;
  futureTenantPhone: string;
  futureBookingSource: string;
  futureBrokerName: string;
  futureExpectedMoveIn: string;
  futureMoveOutDate: string;
  futureRent: number;
  futureDocuments: File[];
}

interface FutureBookingCreateResponse {
  booking?: {
    id?: string | null;
  } | null;
  user?: {
    id?: string | null;
  } | null;
}

const today = () => new Date().toISOString().split("T")[0];
const oneDayBefore = (dateStr: string) => {
  const parsed = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setUTCDate(parsed.getUTCDate() - 1);
  return parsed.toISOString().split("T")[0];
};
const splitTenantName = (fullName: string) => {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};
const formatIndianDate = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}-${month}-${year}`;
};

/* ─── Shared modal wrapper (moved outside to prevent remount) ─── */
const Modal = ({ title, onClose, onConfirm, confirmLabel, confirmClass, children, onSubmit, formError }: {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmClass: string;
  children: React.ReactNode;
  onSubmit?: (e?: React.FormEvent) => void;
  formError?: string | null;
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
      return;
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/50 backdrop-blur-sm">
      <div className="min-h-full flex items-start justify-center p-4 sm:items-center">
        <div className="bg-background border rounded-xl shadow-2xl w-full max-w-md max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30 shrink-0">
            <h2 className="text-base font-semibold">{title}</h2>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              {children}
              {formError && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {formError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-muted/20 shrink-0">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="submit" className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors ${confirmClass}`}>
                {confirmLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ─── Input helper (already outside) ─── */
const Field = ({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors";

export default function AdminRoomManagement() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  /* ─── Modal states ─── */
  const [availableModal, setAvailableModal] = useState<{ roomId: string; roomName: string } | null>(null);
  const [occupiedModal, setOccupiedModal] = useState<{ roomId: string; roomName: string } | null>(null);
  const [updateTenantModal, setUpdateTenantModal] = useState<UpdateTenantModalState | null>(null);

  const [availableForm, setAvailableForm] = useState<AvailableForm>({ availableFrom: today() });
  const [availableDocuments, setAvailableDocuments] = useState<File[]>([]);
  const [occupiedForm, setOccupiedForm] = useState<OccupiedForm>({
    tenantName: "",
    phone: "",
    bookingSource: "",
    brokerName: "",
    rent: 0,
    occupiedUntil: "",
  });
  const [updateTenantForm, setUpdateTenantForm] = useState<UpdateTenantForm>({
    bookingSource: "",
    brokerName: "",

    firstName: "",
    lastName: "",
    phone: "",
    updateRoomId: "",
    roomChangeDate: "",
    extendOccupiedUntil: "",
    newRent: 0,
    createFutureBooking: false,
    futureTenantName: "",
    futureTenantPhone: "",
    futureBookingSource: "WALK_IN",
    futureBrokerName: "",
    futureExpectedMoveIn: "",
    futureMoveOutDate: "",
    futureRent: 0,
    futureDocuments: [],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  /* ─── Data fetching ─── */
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");
      const data = await getAdminRooms(token);
      // Sort rooms by name numerically (101, 102, 103...)
      const sortedData = [...data].sort((a, b) => {
        const numA = parseInt(a.name, 10);
        const numB = parseInt(b.name, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });
      setRooms(sortedData);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }
    const loadData = async () => {
      await Promise.all([fetchRooms(), fetchTenants()]);
    };
    void loadData();
  }, [navigate]);

  useEffect(() => {
    const hasOpenModal =
      !!availableModal || !!occupiedModal || !!updateTenantModal;
    if (!hasOpenModal) return;

    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
    };
  }, [availableModal, occupiedModal, updateTenantModal]);

  /* ─── Data fetching ─── */
  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");
      const data = await getAdminTenants(token);
      setTenants(data as Tenant[]);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
    }
  };

  /* ─── Open modals ─── */
  const openAvailableModal = (room: Room) => {
    setAvailableForm({ availableFrom: today() });
    setAvailableDocuments([]);
    setFormError(null);
    setAvailableModal({ roomId: room.id, roomName: room.name });
  };

  const openOccupiedModal = (room: Room) => {
    setOccupiedForm({ tenantName: "", phone: "", bookingSource: "", brokerName: "", rent: room.rent || 0, occupiedUntil: "" });
    setFormError(null);
    setOccupiedModal({ roomId: room.id, roomName: room.name });
  };

  const openUpdateTenantModal = (tenant: Tenant, userId: string) => {
    // Parse name into first and last name
    const nameParts = tenant.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    
    setUpdateTenantForm({
      firstName,
      lastName,
      phone: tenant.phone,
      updateRoomId: tenant.room?.id || "",
      roomChangeDate: "",
      extendOccupiedUntil: "",
      newRent: tenant.room?.rent || 0,
      bookingSource: tenant.bookingSource || "WALK_IN",
      brokerName: tenant.brokerName || "",
      createFutureBooking: false,
      futureTenantName: "",
      futureTenantPhone: "",
      futureBookingSource: "WALK_IN",
      futureBrokerName: "",
      futureExpectedMoveIn: "",
      futureMoveOutDate: "",
      futureRent: tenant.room?.rent || 0,
      futureDocuments: [],
    });
    setFormError(null);
    setUpdateTenantModal({ 
      tenant, 
      userId,
      roomId: tenant.room?.id || "",
      roomName: tenant.room?.name || "",
      isNewTenant: false
    });
  };

  /* ─── Confirm handlers ─── */
  const confirmMarkAvailable = async () => {
    if (!availableModal) return;
    if (!availableForm.availableFrom) {
      setFormError("Please select a date.");
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to mark "${availableModal.roomName}" as Available?\n\n` +
      `Available from: ${formatIndianDate(availableForm.availableFrom)}\n\n` +
      `This will update the room status in the database.`
    );
    if (!confirmed) return;

    setFormError(null);
    setUpdating(availableModal.roomId);
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");
      await updateAdminRoom(token, availableModal.roomId, {
        status: "AVAILABLE",
        isAvailable: true,
        occupiedUntil: availableForm.availableFrom === today() ? null : availableForm.availableFrom,
      });

      if (availableDocuments.length > 0) {
        const activeTenant = tenants.find(
          (t) =>
            t.room?.id === availableModal.roomId &&
            String(t.tenantType || "ACTIVE").toUpperCase() !== "FUTURE",
        );

        if (activeTenant?.bookingId) {
          for (const [index, file] of availableDocuments.entries()) {
            const uploaded = await uploadVerificationFile(token, file, "OTHER");
            await createDocumentRecord(token, {
              userId: activeTenant.id,
              bookingId: activeTenant.bookingId,
              name: `MARK_AVAILABLE_DOC_${index + 1}`,
              type: "OTHER",
              fileUrl: uploaded.fileUrl,
              fileName: uploaded.fileName,
              fileSize: uploaded.fileSize,
              mimeType: uploaded.mimeType,
              status: "SUBMITTED",
            });
          }
        }
      }

      // Close modal only after successful update
      setAvailableModal(null);
      setAvailableDocuments([]);
      await Promise.all([fetchRooms(), fetchTenants()]);
      window.dispatchEvent(new Event("rooms:updated"));
      alert("Room marked as available successfully!");
    } catch (err) {
      console.error("Failed to mark room as available:", err);
      alert("Failed to update room status");
    } finally {
      setUpdating(null);
    }
  };

  const confirmMarkOccupied = async () => {
    if (!occupiedModal) return;
    if (!occupiedForm.tenantName.trim()) {
      setFormError("Tenant name is required.");
      return;
    }
    if (!occupiedForm.phone.trim()) {
      setFormError("Phone number is required.");
      return;
    }
    if (!occupiedForm.bookingSource) {
      setFormError("Please select a booking source.");
      return;
    }
    if (occupiedForm.bookingSource === "BROKER" && !occupiedForm.brokerName.trim()) {
      setFormError("Broker name is required when booking source is Broker.");
      return;
    }
    if (!occupiedForm.rent || occupiedForm.rent <= 0) {
      setFormError("Rent amount is required and must be greater than 0.");
      return;
    }
    if (!occupiedForm.occupiedUntil) {
      setFormError("Please select the move-out / occupied-until date.");
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to mark "${occupiedModal.roomName}" as Occupied?\n\n` +
      `Tenant: ${occupiedForm.tenantName}\n` +
      `Phone: ${occupiedForm.phone}\n` +
      `Booking Source: ${occupiedForm.bookingSource === "BROKER" ? (occupiedForm.brokerName || "Broker") : "Walk-ins"}\n` +
      `Rent: ₹${occupiedForm.rent}\n` +
      `Occupied Until: ${formatIndianDate(occupiedForm.occupiedUntil)}\n\n` +
      `This will update the room status in the database.`
    );
    if (!confirmed) return;

    setFormError(null);
    setUpdating(occupiedModal.roomId);
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");
      // Send booking-style payload for mark-occupied flow
      await updateAdminRoom(token, occupiedModal.roomId, {
        status: "OCCUPIED",
        tenantName: occupiedForm.tenantName.trim(),
        tenantPhone: occupiedForm.phone.trim(),
        bookingSource: occupiedForm.bookingSource,
        brokerName: occupiedForm.bookingSource === "BROKER" ? occupiedForm.brokerName : null,
        occupiedUntil: occupiedForm.occupiedUntil,
      });
      // Close modal only after successful update
      setOccupiedModal(null);
      await Promise.all([fetchRooms(), fetchTenants()]);
      window.dispatchEvent(new Event("rooms:updated"));
      alert("Room marked as occupied successfully!");
    } catch (err) {
      console.error("Failed to mark room as occupied:", err);
      alert("Failed to update room status");
    } finally {
      setUpdating(null);
    }
  };

  const confirmUpdateTenant = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!updateTenantModal) return;
    if (!updateTenantForm.firstName.trim()) {
      setFormError("First name is required.");
      return;
    }

    // Validate booking source
    if (updateTenantForm.bookingSource === "BROKER" && !updateTenantForm.brokerName.trim()) {
      setFormError("Broker name is required when booking source is Broker.");
      return;
    }

    const isRoomChanged =
      !!updateTenantForm.updateRoomId &&
      updateTenantForm.updateRoomId !== (updateTenantModal.tenant.room?.id || "");

    if (isRoomChanged && !updateTenantForm.roomChangeDate) {
      setFormError("Please select the move date for the updated room.");
      return;
    }

    if (
      updateTenantForm.roomChangeDate &&
      updateTenantForm.roomChangeDate < today()
    ) {
      setFormError("Room change date cannot be in the past.");
      return;
    }

    if (updateTenantForm.createFutureBooking && isRoomChanged) {
      setFormError("Room transfer and future booking cannot be done together in one action.");
      return;
    }

    const computedFutureOccupiedUntil = updateTenantForm.createFutureBooking
      ? (updateTenantForm.futureMoveOutDate || oneDayBefore(updateTenantForm.futureExpectedMoveIn))
      : "";

    if (updateTenantForm.createFutureBooking) {
      if (!updateTenantModal.roomId) {
        setFormError("Current room is missing for future booking creation.");
        return;
      }
      if (!updateTenantForm.futureTenantName.trim()) {
        setFormError("Future tenant name is required.");
        return;
      }
      if (!updateTenantForm.futureTenantPhone.trim()) {
        setFormError("Future tenant phone is required.");
        return;
      }
      if (!updateTenantForm.futureExpectedMoveIn) {
        setFormError("Expected move-in date is required for future booking.");
        return;
      }
      if (updateTenantForm.futureExpectedMoveIn <= today()) {
        setFormError("Expected move-in date must be in the future.");
        return;
      }
      if (
        updateTenantForm.futureMoveOutDate &&
        updateTenantForm.futureMoveOutDate <= updateTenantForm.futureExpectedMoveIn
      ) {
        setFormError("Future move-out date must be after expected move-in date.");
        return;
      }
      if (!updateTenantForm.futureBookingSource) {
        setFormError("Please select a booking source for the future booking.");
        return;
      }
      if (
        updateTenantForm.futureBookingSource === "BROKER" &&
        !updateTenantForm.futureBrokerName.trim()
      ) {
        setFormError("Broker name is required for a broker future booking.");
        return;
      }
      if (!computedFutureOccupiedUntil) {
        setFormError("Unable to calculate occupied-until date from expected move-in.");
        return;
      }
    }

    // Get current source label
    const currentSourceLabel = updateTenantModal.tenant.bookingSource === "BROKER" 
      ? (updateTenantModal.tenant.brokerName || "Broker")
      : "Walk-ins";
    const newSourceLabel = updateTenantForm.bookingSource === "BROKER" 
      ? (updateTenantForm.brokerName || "Broker")
      : "Walk-ins";
    const isSourceChanged = updateTenantForm.bookingSource && updateTenantForm.bookingSource !== (updateTenantModal.tenant.bookingSource || "WALK_IN");

    const confirmed = window.confirm(
      `Are you sure you want to update tenant "${updateTenantModal.tenant.name}"?\n\n` +
      `Changes:\n` +
      `${updateTenantForm.firstName || updateTenantForm.lastName ? `- Name: ${updateTenantModal.tenant.name} -> ${updateTenantForm.firstName} ${updateTenantForm.lastName}\n` : ''}` +
      `${updateTenantForm.phone ? `- Phone: ${updateTenantModal.tenant.phone} -> ${updateTenantForm.phone}\n` : ''}` +
      `${isSourceChanged ? `- Source: ${currentSourceLabel} -> ${newSourceLabel}\n` : ''}` +
      `${isRoomChanged ? `- Room: ${updateTenantModal.tenant.room?.name} -> ${rooms.find(r => r.id === updateTenantForm.updateRoomId)?.name || updateTenantForm.updateRoomId}\n` : ''}` +
      `${isRoomChanged ? `- Move Date: ${formatIndianDate(updateTenantForm.roomChangeDate)}\n` : ''}` +
      `${!updateTenantForm.createFutureBooking && updateTenantForm.extendOccupiedUntil ? `- Extend Occupied Until: ${formatIndianDate(updateTenantForm.extendOccupiedUntil)}\n` : ''}` +
      `${updateTenantForm.newRent && updateTenantForm.newRent !== updateTenantModal.tenant.room?.rent ? `- Rent: Rs ${updateTenantModal.tenant.room?.rent} -> Rs ${updateTenantForm.newRent}\n` : ''}` +
      `${updateTenantForm.createFutureBooking ? `- Future Booking Tenant: ${updateTenantForm.futureTenantName}\n` : ''}` +
      `${updateTenantForm.createFutureBooking ? `- Future Booking Phone: ${updateTenantForm.futureTenantPhone}\n` : ''}` +
      `${updateTenantForm.createFutureBooking ? `- Future Move-In Date: ${formatIndianDate(updateTenantForm.futureExpectedMoveIn)}\n` : ''}` +
      `${updateTenantForm.createFutureBooking && updateTenantForm.futureMoveOutDate ? `- Future Move-Out Date: ${formatIndianDate(updateTenantForm.futureMoveOutDate)}\n` : ''}` +
      `${updateTenantForm.createFutureBooking ? `- Current Tenant Occupied Until: ${formatIndianDate(computedFutureOccupiedUntil)}\n` : ''}` +
      `\nThis will update the database records.`
    );

    if (!confirmed) return;

    setFormError(null);
    setUpdating(updateTenantModal.userId);
    let tenantUpdated = false;
    let futureBookingCreated = false;
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");
      await updateAdminTenant(token, updateTenantModal.userId, {
        firstName: updateTenantForm.firstName,
        lastName: updateTenantForm.lastName,
        phone: updateTenantForm.phone,
        updateRoomId: isRoomChanged ? updateTenantForm.updateRoomId : undefined,
        newRoomId: isRoomChanged ? updateTenantForm.updateRoomId : undefined,
        roomChangeDate: isRoomChanged ? updateTenantForm.roomChangeDate : undefined,
        extendOccupiedUntil: updateTenantForm.createFutureBooking
          ? undefined
          : updateTenantForm.extendOccupiedUntil || undefined,
        newRent: updateTenantForm.newRent || undefined,
        bookingSource: updateTenantForm.bookingSource || undefined,
        brokerName: updateTenantForm.bookingSource === "BROKER" ? updateTenantForm.brokerName || undefined : undefined,
      });
      tenantUpdated = true;

      if (updateTenantForm.createFutureBooking) {
        const futureTenant = splitTenantName(updateTenantForm.futureTenantName);
        let futureBookingResponse: FutureBookingCreateResponse | null = null;

        futureBookingResponse = await createOfflineTenant(token, {
          firstName: futureTenant.firstName,
          lastName: futureTenant.lastName || undefined,
          phone: updateTenantForm.futureTenantPhone.trim(),
          roomId: updateTenantModal.roomId,
          moveInDate: updateTenantForm.futureExpectedMoveIn,
          moveOutDate: updateTenantForm.futureMoveOutDate || undefined,
          bookingSource: updateTenantForm.futureBookingSource,
          brokerName:
            updateTenantForm.futureBookingSource === "BROKER"
              ? updateTenantForm.futureBrokerName.trim()
              : undefined,
          isFutureBooking: true,
          expectedMoveIn: updateTenantForm.futureExpectedMoveIn,
          rentAmount:
            updateTenantForm.futureRent && updateTenantForm.futureRent > 0
              ? updateTenantForm.futureRent
              : undefined,
        });
        futureBookingCreated = true;

        if (
          updateTenantForm.futureDocuments.length > 0 &&
          futureBookingResponse?.booking?.id &&
          futureBookingResponse?.user?.id
        ) {
          for (const [index, file] of updateTenantForm.futureDocuments.entries()) {
            const uploaded = await uploadVerificationFile(token, file, "OTHER");
            await createDocumentRecord(token, {
              userId: futureBookingResponse.user.id,
              bookingId: futureBookingResponse.booking.id,
              name: `FUTURE_BOOKING_DOC_${index + 1}`,
              type: "OTHER",
              fileUrl: uploaded.fileUrl,
              fileName: uploaded.fileName,
              fileSize: uploaded.fileSize,
              mimeType: uploaded.mimeType,
              status: "SUBMITTED",
            });
          }
        }

        await updateAdminTenant(token, updateTenantModal.userId, {
          moveOutDate: computedFutureOccupiedUntil,
          extendOccupiedUntil: computedFutureOccupiedUntil,
        });
      }

      setUpdateTenantModal(null);
      await fetchTenants();
      await fetchRooms();
      window.dispatchEvent(new Event("rooms:updated"));
      alert(
        updateTenantForm.createFutureBooking
          ? "Tenant updated and future booking created successfully!"
          : "Tenant updated successfully!",
      );
    } catch (err) {
      console.error("Failed to update tenant:", err);
      if (futureBookingCreated) {
        alert("Future booking was created, but occupied-until update failed. Please retry tenant update once.");
      } else if (tenantUpdated && updateTenantForm.createFutureBooking) {
        alert("Tenant details were updated, but future booking failed. Please retry Create Future Booking.");
      } else {
        alert("Failed to update tenant details");
      }
    } finally {
      setUpdating(null);
    }
  };

  /* ─── Helpers ─── */
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "—";
    try {
      const parsed = new Date(dateStr);
      if (Number.isNaN(parsed.getTime())) return dateStr;
      const day = String(parsed.getDate()).padStart(2, "0");
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const year = String(parsed.getFullYear());
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  const currentTenantRoomId = updateTenantModal?.tenant.room?.id || "";
  const isUpdateRoomChanged =
    !!updateTenantModal &&
    !!updateTenantForm.updateRoomId &&
    updateTenantForm.updateRoomId !== currentTenantRoomId;

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Room Management</h1>
          <p className="text-muted-foreground">Manually control room occupancy</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Room Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Occupied Until</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Availability</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="border-t">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{room.name}</div>
                        <div className="text-sm text-muted-foreground">Floor {room.floor}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{room.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          room.status === "OCCUPIED"
                            ? "bg-red-100 text-red-800"
                            : room.status === "AVAILABLE"
                            ? "bg-green-100 text-green-800"
                            : room.status === "RESERVED"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(room.occupiedUntil)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {room.isAvailable ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Available</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-600">Unavailable</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {room.status !== "OCCUPIED" ? (
                          <button
                            onClick={() => openOccupiedModal(room)}
                            disabled={updating === room.id}
                            className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            {updating === room.id ? "Updating…" : "Mark Occupied"}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openAvailableModal(room)}
                              disabled={updating === room.id}
                              className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {updating === room.id ? "Updating…" : "Mark Available"}
                            </button>
                            {room.status === "OCCUPIED" && (
                              <button
                                onClick={() => {
                                  // Always edit the current ACTIVE tenant when a room has upcoming bookings too.
                                  const tenant =
                                    tenants.find(
                                      (t) =>
                                        t.room?.id === room.id &&
                                        String(t.tenantType || "ACTIVE").toUpperCase() !== "FUTURE",
                                    ) || tenants.find((t) => t.room?.id === room.id);
                                  if (tenant) {
                                    openUpdateTenantModal(tenant, tenant.id);
                                  } else {
                                    // If no tenant found but room is occupied, show a message
                                    alert("No tenant found for this room. Please mark the room as available first.");
                                  }
                                }}
                                disabled={updating === room.id}
                                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                Edit Tenant
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rooms.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No rooms found</div>
            )}
          </div>
        )}
      </div>

      {/* ─── Mark Available Modal ─── */}
      {availableModal && (
        <Modal
          title={`Mark "${availableModal.roomName}" as Available`}
          onClose={() => setAvailableModal(null)}
          onConfirm={confirmMarkAvailable}
          confirmLabel="Confirm — Mark Available"
          confirmClass="bg-green-600 hover:bg-green-700"
          formError={formError}
        >
          <p className="text-sm text-muted-foreground">
            Choose when this room should become available. You can make it available immediately or set a future date.
          </p>
          <Field icon={Calendar} label="Available From">
            <input
              type="date"
              value={availableForm.availableFrom}
              onChange={(e) => setAvailableForm({ availableFrom: e.target.value })}
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave as today to make the room immediately available.
            </p>
          </Field>

          <Field icon={FileText} label="Documents (Optional)">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              multiple
              onChange={(e) =>
                setAvailableDocuments(Array.from(e.target.files || []))
              }
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {availableDocuments.length > 0
                ? `${availableDocuments.length} file(s) selected`
                : "Upload only if needed."}
            </p>
          </Field>
        </Modal>
      )}

      {/* ─── Mark Occupied Modal ─── */}
      {occupiedModal && (
        <Modal
          title={`Mark "${occupiedModal.roomName}" as Occupied`}
          onClose={() => setOccupiedModal(null)}
          onConfirm={confirmMarkOccupied}
          confirmLabel="Confirm — Mark Occupied"
          confirmClass="bg-red-600 hover:bg-red-700"
          formError={formError}
        >
          <p className="text-sm text-muted-foreground">Enter tenant details to mark this room as occupied.</p>

          <Field icon={User} label="Tenant Name *">
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={occupiedForm.tenantName}
              onChange={(e) => setOccupiedForm((f) => ({ ...f, tenantName: e.target.value }))}
              className={inputCls}
            />
          </Field>

          <Field icon={Phone} label="Phone Number *">
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={occupiedForm.phone}
              onChange={(e) => setOccupiedForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputCls}
            />
          </Field>

          <Field icon={Briefcase} label="Booking Source *">
            <select
              value={occupiedForm.bookingSource}
              onChange={(e) => setOccupiedForm((f) => ({ ...f, bookingSource: e.target.value, brokerName: e.target.value !== "BROKER" ? "" : f.brokerName }))}
              className={inputCls}
            >
              <option value="">— Select source —</option>
              {BOOKING_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          {occupiedForm.bookingSource === "BROKER" && (
            <Field icon={User} label="Broker Name *">
              <input
                type="text"
                placeholder="e.g. John Real Estate"
                value={occupiedForm.brokerName}
                onChange={(e) => setOccupiedForm((f) => ({ ...f, brokerName: e.target.value }))}
                className={inputCls}
              />
            </Field>
          )}

          <Field icon={IndianRupee} label="Rent Amount (₹) *">
            <input
              type="number"
              min="1"
              placeholder="e.g. 15000"
              value={occupiedForm.rent || ""}
              onChange={(e) => setOccupiedForm((f) => ({ ...f, rent: parseInt(e.target.value) || 0 }))}
              className={inputCls}
            />
          </Field>

          <Field icon={Calendar} label="Occupied Until (Move-out Date) *">
            <input
              type="date"
              min={today()}
              value={occupiedForm.occupiedUntil}
              onChange={(e) => setOccupiedForm((f) => ({ ...f, occupiedUntil: e.target.value }))}
              className={inputCls}
            />
          </Field>
        </Modal>
      )}

      {/* ─── Update Tenant Modal ─── */}
      {updateTenantModal && (
        <Modal
          title={`Update Tenant: ${updateTenantModal.tenant.name}`}
          onClose={() => setUpdateTenantModal(null)}
          onConfirm={confirmUpdateTenant}
          onSubmit={confirmUpdateTenant}
          confirmLabel={updateTenantForm.createFutureBooking ? "Add Future Booking" : "Update Tenant"}
          confirmClass="bg-blue-600 hover:bg-blue-700"
          formError={formError}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Update tenant details, extend occupied-until date, or schedule a room transfer.
          </p>

          <Field icon={User} label="First Name *">
            <input
              type="text"
              placeholder="e.g. Rahul"
              value={updateTenantForm.firstName}
              onChange={(e) => setUpdateTenantForm((f) => ({ ...f, firstName: e.target.value }))}
              className={inputCls}
            />
          </Field>

          <Field icon={User} label="Last Name">
            <input
              type="text"
              placeholder="e.g. Sharma"
              value={updateTenantForm.lastName}
              onChange={(e) => setUpdateTenantForm((f) => ({ ...f, lastName: e.target.value }))}
              className={inputCls}
            />
          </Field>

          <Field icon={Phone} label="Phone Number">
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={updateTenantForm.phone}
              onChange={(e) => setUpdateTenantForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputCls}
            />
          </Field>

          <Field icon={Briefcase} label="Booking Source">
            <select
              value={updateTenantForm.bookingSource}
              onChange={(e) => setUpdateTenantForm((f) => ({ ...f, bookingSource: e.target.value, brokerName: e.target.value === "BROKER" ? f.brokerName : "" }))}
              className={inputCls}
            >
              <option value="">-- Select Source --</option>
              {BOOKING_SOURCES.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </Field>

          {updateTenantForm.bookingSource === "BROKER" && (
            <Field icon={User} label="Broker Name">
              <input
                type="text"
                placeholder="e.g. John Agent"
                value={updateTenantForm.brokerName}
                onChange={(e) => setUpdateTenantForm((f) => ({ ...f, brokerName: e.target.value }))}
                className={inputCls}
              />
            </Field>
          )}

          <Field icon={Home} label="Update Room">
            <select
              value={updateTenantForm.updateRoomId}
              onChange={(e) =>
                setUpdateTenantForm((f) => ({ ...f, updateRoomId: e.target.value }))
              }
              className={inputCls}
            >
              <option value={currentTenantRoomId}>-- Keep current room --</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Floor {r.floor}) - INR {r.rent}/month [{r.status}]
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              All rooms are listed. For occupied rooms, choose a future move date.
            </p>
          </Field>

          {isUpdateRoomChanged && (
            <Field icon={Calendar} label="Move Date *">
              <input
                type="date"
                min={today()}
                value={updateTenantForm.roomChangeDate}
                onChange={(e) =>
                  setUpdateTenantForm((f) => ({ ...f, roomChangeDate: e.target.value }))
                }
                className={inputCls}
              />
              <p className="text-xs text-muted-foreground mt-1">
                On this date, current room becomes available and selected room becomes occupied.
              </p>
            </Field>
          )}

          <Field icon={Calendar} label="Extend Occupied Until (Optional)">
            <input
              type="date"
              value={updateTenantForm.extendOccupiedUntil}
              disabled={updateTenantForm.createFutureBooking}
              onChange={(e) =>
                setUpdateTenantForm((f) => ({ ...f, extendOccupiedUntil: e.target.value }))
              }
              className={`${inputCls} ${updateTenantForm.createFutureBooking ? "cursor-not-allowed opacity-60" : ""}`}
            />
            {updateTenantForm.createFutureBooking && (
              <p className="text-xs text-muted-foreground mt-1">
                This will be auto-set from the future move-in date.
              </p>
            )}
          </Field>

          <Field icon={Home} label="Tenant Rent (₹)">
            <input
              type="number"
              placeholder="e.g. 15000"
              value={updateTenantForm.newRent}
              onChange={(e) => setUpdateTenantForm((f) => ({ ...f, newRent: Number(e.target.value) }))}
              className={inputCls}
            />
          </Field>
          <div className="rounded-lg border bg-muted/20 px-3 py-2">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={updateTenantForm.createFutureBooking}
                onChange={(e) =>
                  setUpdateTenantForm((f) => ({
                    ...f,
                    createFutureBooking: e.target.checked,
                    futureBookingSource: e.target.checked
                      ? f.futureBookingSource || "WALK_IN"
                      : "WALK_IN",
                    futureBrokerName: e.target.checked ? f.futureBrokerName : "",
                    futureMoveOutDate: e.target.checked ? f.futureMoveOutDate : "",
                    futureDocuments: e.target.checked ? f.futureDocuments : [],
                  }))
                }
                className="h-4 w-4 rounded border-border"
              />
              Create Future Booking
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              This creates a new upcoming tenant booking for the same room.
            </p>
          </div>

          {updateTenantForm.createFutureBooking && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/30 px-3 py-3 space-y-3">
              <h3 className="text-sm font-semibold text-blue-900">Future Booking</h3>

              <Field icon={User} label="Tenant Name *">
                <input
                  type="text"
                  placeholder="e.g. Ananya Sharma"
                  value={updateTenantForm.futureTenantName}
                  onChange={(e) =>
                    setUpdateTenantForm((f) => ({
                      ...f,
                      futureTenantName: e.target.value,
                    }))
                  }
                  className={inputCls}
                />
              </Field>

              <Field icon={Phone} label="Phone *">
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={updateTenantForm.futureTenantPhone}
                  onChange={(e) =>
                    setUpdateTenantForm((f) => ({
                      ...f,
                      futureTenantPhone: e.target.value,
                    }))
                  }
                  className={inputCls}
                />
              </Field>

              <Field icon={Briefcase} label="Booking Source *">
                <select
                  value={updateTenantForm.futureBookingSource}
                  onChange={(e) =>
                    setUpdateTenantForm((f) => ({
                      ...f,
                      futureBookingSource: e.target.value,
                      futureBrokerName: e.target.value === "BROKER" ? f.futureBrokerName : "",
                    }))
                  }
                  className={inputCls}
                >
                  {BOOKING_SOURCES.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </Field>

              {updateTenantForm.futureBookingSource === "BROKER" && (
                <Field icon={User} label="Broker Name *">
                  <input
                    type="text"
                    placeholder="e.g. Prime Realty"
                    value={updateTenantForm.futureBrokerName}
                    onChange={(e) =>
                      setUpdateTenantForm((f) => ({
                        ...f,
                        futureBrokerName: e.target.value,
                      }))
                    }
                    className={inputCls}
                  />
                </Field>
              )}

              <Field icon={Calendar} label="Expected Move-In Date *">
                <input
                  type="date"
                  min={today()}
                  value={updateTenantForm.futureExpectedMoveIn}
                  onChange={(e) =>
                    setUpdateTenantForm((f) => ({
                      ...f,
                      futureExpectedMoveIn: e.target.value,
                    }))
                  }
                  className={inputCls}
                />
              </Field>

              <Field icon={Calendar} label="Move-Out Date">
                <input
                  type="date"
                  min={updateTenantForm.futureExpectedMoveIn || today()}
                  value={updateTenantForm.futureMoveOutDate}
                  onChange={(e) =>
                    setUpdateTenantForm((f) => ({
                      ...f,
                      futureMoveOutDate: e.target.value,
                    }))
                  }
                  className={inputCls}
                />
              </Field>

              <Field icon={IndianRupee} label="Rent (INR)">
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 15000"
                  value={updateTenantForm.futureRent || ""}
                  onChange={(e) =>
                    setUpdateTenantForm((f) => ({
                      ...f,
                      futureRent: Number(e.target.value) || 0,
                    }))
                  }
                  className={inputCls}
                />
              </Field>

              <Field icon={FileText} label="Documents (Optional)">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple
                  onChange={(e) =>
                    setUpdateTenantForm((f) => ({
                      ...f,
                      futureDocuments: Array.from(e.target.files || []),
                    }))
                  }
                  className={inputCls}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {updateTenantForm.futureDocuments.length > 0
                    ? `${updateTenantForm.futureDocuments.length} file(s) selected`
                    : "Upload only if needed."}
                </p>
              </Field>

              {updateTenantForm.futureExpectedMoveIn && (
                <p className="text-xs text-blue-800">
                  Current tenant occupied-until will be set to{" "}
                  <span className="font-medium">
                    {formatIndianDate(
                      updateTenantForm.futureMoveOutDate ||
                        oneDayBefore(updateTenantForm.futureExpectedMoveIn) ||
                        "",
                    ) || "N/A"}
                  </span>{" "}
                  after future booking is created.
                </p>
              )}
            </div>
          )}
        </Modal>
      )}
    </DashboardLayout>
  );
}


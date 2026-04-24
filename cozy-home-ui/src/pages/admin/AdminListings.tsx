import { FormEvent, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { type Room } from "@/data/mockData";
import {
  createAdminRoom,
  createAdminAmenity,
  deleteAdminAmenity,
  getAdminAmenities,
  getAdminRooms,
  updateAdminRoom,
  deleteAdminRoom,
} from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Pencil, Trash } from "lucide-react";

const ROOM_TYPES = ["ONE_BHK", "TWO_BHK", "PENTHOUSE"];
const ROOM_TYPE_LABELS: Record<string, string> = {
  ONE_BHK: "One BHK / Studio",
  TWO_BHK: "Two BHK",
  PENTHOUSE: "Penthouse",
};

type AmenityOption = {
  id: string;
  name: string;
};

type AdminRoom = Room & {
  amenityDetails?: AmenityOption[];
};

const MAX_MEDIA_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

const VALID_ROOM_TYPES = new Set(ROOM_TYPES);

function normalizeRoomType(value: string) {
  const normalized = String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();
  const legacyMap: Record<string, string> = {
    STUDIO: "ONE_BHK",
    SINGLE: "ONE_BHK",
    DOUBLE: "ONE_BHK",
    THREE_BHK: "TWO_BHK",
    SUITE: "PENTHOUSE",
    PENT_HOUSE: "PENTHOUSE",
  };
  const mapped = legacyMap[normalized] ?? normalized;
  if (VALID_ROOM_TYPES.has(mapped)) {
    return mapped;
  }
  return "ONE_BHK";
}

function formatOccupiedUntil(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getRoomStatusLabel(room: Room) {
  const status = String(room.status || "AVAILABLE");
  const occupiedUntil = formatOccupiedUntil(room.occupiedUntil);
  if (status === "AVAILABLE") return "Available";
  if (status === "RESERVED") return "Reserved";
  if (status === "OCCUPIED") {
    return occupiedUntil ? `Available from ${occupiedUntil}` : "Occupied";
  }
  if (status === "MAINTENANCE") return "Maintenance";
  return status;
}

function mapRoomStatusVariant(
  status?: string,
): "AVAILABLE" | "RESERVED" | "OCCUPIED" | "MAINTENANCE" {
  const normalized = String(status || "AVAILABLE").toUpperCase();
  if (normalized === "RESERVED") return "RESERVED";
  if (normalized === "OCCUPIED") return "OCCUPIED";
  if (normalized === "MAINTENANCE") return "MAINTENANCE";
  return "AVAILABLE";
}

const defaultForm = {
  name: "",
  type: "ONE_BHK",
  rent: "",
  deposit: "",
  area: "",
  floor: "",
  description: "",
  amenities: [] as string[],
  rules: [""] as string[],
};

export default function AdminListings() {
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [amenitiesLoading, setAmenitiesLoading] = useState(true);
  const [error, setError] = useState("");
  const [amenityError, setAmenityError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  // media state: files selected for upload and existing items when editing
  const [mediaInputs, setMediaInputs] = useState<Array<File | null>>([]);
  const [existingMedia, setExistingMedia] = useState<
    Array<{ type: string; url: string }>
  >([]);
  const [editingRoom, setEditingRoom] = useState<AdminRoom | null>(null);
  const [amenityOptions, setAmenityOptions] = useState<AmenityOption[]>([]);
  const [newAmenityName, setNewAmenityName] = useState("");

  const sortedRooms = useMemo(() => {
    const extractRoomNumber = (name: string) => {
      const match = String(name || "").match(/\d+/);
      return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
    };

    return [...rooms].sort((a, b) => {
      const numberA = extractRoomNumber(a.name);
      const numberB = extractRoomNumber(b.name);

      if (numberA !== numberB) {
        return numberA - numberB;
      }

      return String(a.name).localeCompare(String(b.name), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [rooms]);

  async function fetchRooms(showLoader = true) {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("access_token");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin first.");
      if (showLoader) setLoading(false);
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      }
      setError("");
      const data = await getAdminRooms(token);
      setRooms(data as AdminRoom[]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load listings";
      setError(message);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  async function fetchAmenities(showLoader = true) {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      if (showLoader) setAmenitiesLoading(false);
      return;
    }

    try {
      if (showLoader) {
        setAmenitiesLoading(true);
      }
      setAmenityError("");
      const data = await getAdminAmenities(token);
      setAmenityOptions(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load amenities";
      setAmenityError(message);
    } finally {
      if (showLoader) {
        setAmenitiesLoading(false);
      }
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchRooms(true), fetchAmenities(true)]);
    };
    void loadInitialData();
  }, []);

  // populate form when editingRoom changes (separate from showModal to avoid
  // race where both states update simultaneously)
  useEffect(() => {
    if (editingRoom) {
      const r = editingRoom;
      const selectedAmenityIdsFromRoom =
        Array.isArray(r.amenityDetails) && r.amenityDetails.length
          ? r.amenityDetails.map((item) => item.id)
          : (Array.isArray(r.amenities) ? r.amenities : [])
              .map((name) => {
                const match = amenityOptions.find(
                  (amenity) => amenity.name === name,
                );
                return match?.id || null;
              })
              .filter(Boolean) as string[];
      setForm({
        name: r.name,
        type: normalizeRoomType(String(r.type || "")),
        rent: String(r.rent),
        deposit: String(r.deposit),
        area: String(r.area),
        floor: String(r.floor),
        description: r.description || "",
        amenities: selectedAmenityIdsFromRoom,
        rules: r.rules?.length ? r.rules : [""],
      });
      // prepare existing media list from normalized room
      const media: Array<{ type: string; url: string }> = [];
      if (r.videoUrl) {
        media.push({ type: "video", url: r.videoUrl });
      }
      if (Array.isArray(r.images)) {
        r.images.forEach((url) => media.push({ type: "image", url }));
      }
      setExistingMedia(media);
      setMediaInputs([]);
      setFormErrors({});
      setError("");
      setSuccessMsg("");
    }
  }, [editingRoom, amenityOptions]);

  useEffect(() => {
    if (showModal && !editingRoom) {
      // fresh add modal
      setForm(defaultForm);
      setExistingMedia([]);
      setMediaInputs([]);
      setFormErrors({});
      setError("");
      setSuccessMsg("");
      setNewAmenityName("");
    }
    if (!showModal) {
      setEditingRoom(null);
    }
  }, [showModal]);

  useEffect(() => {
    return () => {
      // cleanup not needed for new media inputs
    };
  }, []);

  // media helpers for add/remove inputs
  function addMediaInput() {
    setMediaInputs((prev) => [...prev, null]);
  }

  function handleMediaChange(
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setMediaInputs((prev) => prev.map((f, i) => (i === index ? null : f)));
      return;
    }

    if (!ALLOWED_MEDIA_MIME_TYPES.has(file.type)) {
      setError("Only JPG, PNG, WEBP, MP4, MOV, and WEBM files are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_MEDIA_FILE_SIZE) {
      setError("Each media file must be 100MB or smaller.");
      e.target.value = "";
      return;
    }

    setError("");
    setMediaInputs((prev) => prev.map((f, i) => (i === index ? file : f)));
  }

  function removeMediaInput(index: number) {
    setMediaInputs((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingMedia(index: number) {
    setExistingMedia((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleAmenity(amenity: string) {
    setForm((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((item) => item !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  }

  async function handleAddAmenity() {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      setAmenityError("Admin access token not found.");
      return;
    }

    const name = newAmenityName.trim();
    if (!name) {
      setAmenityError("Amenity name is required.");
      return;
    }

    try {
      setAmenityError("");
      const created = await createAdminAmenity(token, name);
      setAmenityOptions((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewAmenityName("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add amenity";
      setAmenityError(message);
    }
  }

  async function handleDeleteAmenity(amenityId: string) {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      setAmenityError("Admin access token not found.");
      return;
    }

    try {
      setAmenityError("");
      await deleteAdminAmenity(token, amenityId);
      setAmenityOptions((prev) => prev.filter((item) => item.id !== amenityId));
      setForm((prev) => ({
        ...prev,
        amenities: prev.amenities.filter((id) => id !== amenityId),
      }));
      await fetchRooms(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete amenity";
      setAmenityError(message);
    }
  }

  function updateRule(index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      rules: prev.rules.map((rule, idx) => (idx === index ? value : rule)),
    }));
  }

  function addRule() {
    setForm((prev) => ({ ...prev, rules: [...prev.rules, ""] }));
  }

  function removeRule(index: number) {
    setForm((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, idx) => idx !== index),
    }));
  }

  function validateForm() {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) {
      errors.name = "Room name is required.";
    }
    const typeValue = form.type;
    if (!ROOM_TYPES.includes(typeValue)) {
      errors.type = "Room type must be one of: " + ROOM_TYPES.join(", ") + ".";
    }

    const rentRaw = String(form.rent).trim();
    const depositRaw = String(form.deposit).trim();
    const areaRaw = String(form.area).trim();
    const floorRaw = String(form.floor).trim();

    if (!rentRaw) {
      errors.rent = "Rent is required.";
    } else if (!Number.isFinite(Number(rentRaw)) || Number(rentRaw) <= 0) {
      errors.rent = "Rent must be a valid number greater than 0.";
    }
    if (!depositRaw) {
      errors.deposit = "Deposit is required.";
    } else if (!Number.isFinite(Number(depositRaw)) || Number(depositRaw) < 0) {
      errors.deposit = "Deposit must be a valid number 0 or greater.";
    }
    if (!areaRaw) {
      errors.area = "Area is required.";
    } else if (!Number.isFinite(Number(areaRaw)) || Number(areaRaw) <= 0) {
      errors.area = "Area must be a valid number greater than 0.";
    }
    if (!floorRaw) {
      errors.floor = "Floor is required.";
    } else if (!Number.isFinite(Number(floorRaw)) || Number(floorRaw) < 0) {
      errors.floor = "Floor must be a valid number 0 or greater.";
    }

    return errors;
  }

  async function handleSaveRoom(event: FormEvent) {
    event.preventDefault();

    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin first.");
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setFormErrors(validationErrors);
      setError("");
      return;
    }

    try {
      setCreating(true);
      setFormErrors({});
      setError("");
      setSuccessMsg("");

      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("type", normalizeRoomType(form.type));
      formData.append("rent", String(Number(form.rent)));
      formData.append("deposit", String(Number(form.deposit)));
      formData.append("area", String(Number(form.area)));
      formData.append("floor", String(Number(form.floor)));
      formData.append("description", form.description.trim());

      formData.append("amenities", JSON.stringify(form.amenities));
      formData.append(
        "rules",
        JSON.stringify(form.rules.map((r) => r.trim()).filter(Boolean)),
      );

      // Always send existingMedia (including empty array) so backend can
      // correctly clear/replace media during update.
      formData.append("existingMedia", JSON.stringify(existingMedia));

      mediaInputs.forEach((file) => {
        if (file) {
          formData.append("media", file);
        }
      });

      if (editingRoom) {
        await updateAdminRoom(token, editingRoom.id, formData);
      } else {
        await createAdminRoom(token, formData);
      }

      await fetchRooms(false);
      globalThis.dispatchEvent(new CustomEvent("rooms:updated"));
      setShowModal(false);
      setEditingRoom(null);
      setForm(defaultForm);
      setExistingMedia([]);
      setMediaInputs([]);
      setFormErrors({});
      setError("");
      setSuccessMsg(
        editingRoom ? "Room updated successfully." : "Room added successfully.",
      );
      setNewAmenityName("");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : editingRoom
            ? "Failed to update room"
            : "Failed to create room";
      setError(message);
    } finally {
      setCreating(false);
    }
  }

  function openNewRoomModal() {
    setEditingRoom(null);
    setShowModal(true);
  }

  function openEditRoomModal(room: AdminRoom) {
    setEditingRoom(room);
    setShowModal(true);
  }

  async function handleDeleteRoom(roomId: string) {
    if (!confirm("Are you sure you want to delete this room?")) return;
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      setError("Admin access token not found. Please sign in as admin first.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await deleteAdminRoom(token, roomId);
      await fetchRooms(false);
      globalThis.dispatchEvent(new CustomEvent("rooms:updated"));
      setSuccessMsg("Room deleted successfully.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete room";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-display">
            Listing Management
          </h2>
          <Button onClick={openNewRoomModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

        <div className="bg-card rounded-lg border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Room Name
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Rent
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Deposit
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Area
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Floor
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-6 text-center text-muted-foreground"
                    >
                      Loading listings...
                    </td>
                  </tr>
                )}
                {!loading &&
                  sortedRooms.map((room) => (
                    <tr
                      key={room.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3 font-medium">{room.name}</td>
                      <td className="p-3 capitalize text-muted-foreground">
                        {ROOM_TYPE_LABELS[String(room.type).toUpperCase()] ??
                          String(room.type).replace(/_/g, " ")}
                      </td>
                      <td className="p-3">₹{room.rent}</td>
                      <td className="p-3">₹{room.deposit}</td>
                      <td className="p-3">{room.area}</td>
                      <td className="p-3">{room.floor}</td>
                      <td className="p-3">
                        <StatusBadge
                          variant={mapRoomStatusVariant(String(room.status))}
                        >
                          {getRoomStatusLabel(room)}
                        </StatusBadge>
                      </td>
                      <td className="p-3 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditRoomModal(room)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false);
              setEditingRoom(null);
            }}
          >
            <form
              className="bg-card rounded-xl border shadow-elevated p-6 w-full max-w-md mx-4 animate-fade-in max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSaveRoom}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold font-display">
                  {editingRoom ? "Edit Room" : "Add Room"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRoom(null);
                  }}
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {error && (
                <p className="text-sm text-destructive mb-2">{error}</p>
              )}

              <div className="space-y-4">
                <div>
                  <Label>
                    Room Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="Room 101"
                    value={form.name}
                    required
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, name: e.target.value }));
                      setFormErrors((prev) => ({ ...prev, name: "" }));
                      setError("");
                    }}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-destructive">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Type <span className="text-destructive">*</span>
                    </Label>
                    <select
                      className="mt-1.5 w-full rounded-md border px-3 py-2"
                      value={form.type}
                      required
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }));
                        setFormErrors((prev) => ({ ...prev, type: "" }));
                        setError("");
                      }}
                    >
                      {ROOM_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {ROOM_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                    {formErrors.type && (
                      <p className="text-sm text-destructive">
                        {formErrors.type}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Rent <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={1}
                      step="any"
                      placeholder="20000"
                      value={form.rent}
                      required
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, rent: e.target.value }));
                        setFormErrors((prev) => ({ ...prev, rent: "" }));
                        setError("");
                      }}
                    />
                    {formErrors.rent && (
                      <p className="text-sm text-destructive">
                        {formErrors.rent}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>
                      Deposit <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={0}
                      step="any"
                      placeholder="1700"
                      value={form.deposit}
                      required
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          deposit: e.target.value,
                        }));
                        setFormErrors((prev) => ({ ...prev, deposit: "" }));
                        setError("");
                      }}
                    />
                    {formErrors.deposit && (
                      <p className="text-sm text-destructive">
                        {formErrors.deposit}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Area <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={1}
                      step="1"
                      placeholder="200"
                      value={form.area}
                      required
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, area: e.target.value }));
                        setFormErrors((prev) => ({ ...prev, area: "" }));
                        setError("");
                      }}
                    />
                    {formErrors.area && (
                      <p className="text-sm text-destructive">
                        {formErrors.area}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>
                      Floor <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={0}
                      step="1"
                      placeholder="1"
                      value={form.floor}
                      required
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, floor: e.target.value }));
                        setFormErrors((prev) => ({ ...prev, floor: "" }));
                        setError("");
                      }}
                    />
                    {formErrors.floor && (
                      <p className="text-sm text-destructive">
                        {formErrors.floor}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="Optional room description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label>Media</Label>
                  <div className="mt-2 space-y-2">
                    {existingMedia.map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {m.type === "image" ? (
                          <img
                            src={m.url}
                            className="h-16 w-16 object-cover rounded"
                          />
                        ) : (
                          <video
                            src={m.url}
                            className="h-16 w-16 rounded"
                            controls
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExistingMedia(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {mediaInputs.map((file, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,video/mp4,video/mov,video/webm"
                          onChange={(e) => handleMediaChange(i, e)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMediaInput(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMediaInput}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Media
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Amenities</Label>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenityOptions.map((amenity) => (
                      <label
                        key={amenity.id}
                        className="flex items-center justify-between gap-2 text-sm rounded border px-2 py-1.5"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={form.amenities.includes(amenity.id)}
                            onChange={() => toggleAmenity(amenity.id)}
                            className="shrink-0"
                          />
                          <span className="break-words">{amenity.name}</span>
                        </span>
                        <button
                          type="button"
                          className="text-xs text-destructive hover:underline"
                          onClick={() => handleDeleteAmenity(amenity.id)}
                        >
                          Delete
                        </button>
                      </label>
                    ))}
                    {!amenitiesLoading && amenityOptions.length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-full">
                        No amenities found.
                      </p>
                    )}
                  </div>
                  <div className="mt-3">
                    <Label>Add New Amenity</Label>
                    <div className="mt-1.5 flex gap-2">
                      <Input
                        placeholder="e.g. WiFi"
                        value={newAmenityName}
                        onChange={(e) => setNewAmenityName(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddAmenity}
                      >
                        Add
                      </Button>
                    </div>
                    {amenityError && (
                      <p className="text-sm text-destructive mt-1">{amenityError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label>House Rules</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRule}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Rule
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {form.rules.map((rule, index) => (
                      <div key={`rule-${index}`} className="flex gap-2">
                        <Input
                          value={rule}
                          placeholder="No smoking"
                          onChange={(e) => updateRule(index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeRule(index)}
                          disabled={form.rules.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      setShowModal(false);
                      setEditingRoom(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1" type="submit" disabled={creating}>
                    {creating
                      ? editingRoom
                        ? "Updating..."
                        : "Adding..."
                      : editingRoom
                        ? "Update Room"
                        : "Add Room"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

const API_URL = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const API_PREFIX = "/api";

const ALLOWED_ROOM_TYPES = new Set(["ONE_BHK", "TWO_BHK", "PENTHOUSE"]);
const TOKEN_KEYS = ["token", "access_token", "accessToken"];
const LEGACY_ROOM_TYPE_MAP = {
  STUDIO: "ONE_BHK",
  SINGLE: "ONE_BHK",
  DOUBLE: "ONE_BHK",
  THREE_BHK: "TWO_BHK",
  SUITE: "PENTHOUSE",
  PENT_HOUSE: "PENTHOUSE",
};

function getStoredToken() {
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return "";
}

function clearAuthData() {
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("current_user");
  localStorage.removeItem("user");
  localStorage.removeItem("user_role");
}

function toErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string") {
    // Clean up common backend error messages
    const cleaned = payload
      .replace(/\n/g, ": ")
      .replace(/\s+/g, " ")
      .trim();
    // If it's a validation error or prisma error, make it user-friendly
    if (cleaned.includes("prisma") || cleaned.includes("P")) {
      return "An internal error occurred. Please try again later.";
    }
    // Limit message length
    if (cleaned.length > 100) {
      return cleaned.substring(0, 100) + "...";
    }
    return cleaned;
  }
  if (Array.isArray(payload.message)) return payload.message.join(", ");
  if (typeof payload.message === "string") return payload.message;
  return fallback;
}

function toNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapRoomType(type) {
  const normalized = String(type || "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();
  const mapped = LEGACY_ROOM_TYPE_MAP[normalized] || normalized;
  if (!ALLOWED_ROOM_TYPES.has(mapped)) {
    throw new Error("Invalid room type.");
  }
  return mapped;
}

function normalizeRoomTypeForUi(type) {
  try {
    return mapRoomType(type);
  } catch {
    return "ONE_BHK";
  }
}

function isValidMonthKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value.trim());
}

async function request(path, options = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const finalPath = normalizedPath.startsWith("/api")
    ? normalizedPath
    : `${API_PREFIX}${normalizedPath}`;
  const url = API_URL.endsWith("/api") && finalPath.startsWith("/api")
    ? `${API_URL}${finalPath.slice(4)}`
    : `${API_URL}${finalPath}`;
  const token = getStoredToken();

  const isForm = options.body instanceof FormData;
  const shouldSerializeJsonBody =
    !isForm &&
    options.body !== undefined &&
    options.body !== null &&
    typeof options.body !== "string";

  const headers = {
    ...(options.headers || {}),
  };

  if (!isForm) {
    headers["Content-Type"] = "application/json";
  }

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs ?? 15000);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions = {
    method: options.method || "GET",
    credentials: "include",
    headers,
    signal: controller.signal,
    body: shouldSerializeJsonBody
      ? JSON.stringify(options.body)
      : options.body,
  };

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please check backend server.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.error("API ERROR:", data);
    const message =
      (data && typeof data.message === "string" && data.message) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function normalizeRoom(room) {
  const relationImages = Array.isArray(room.images) ? room.images : [];
  const mediaFromRelation = relationImages
    .map((item) => {
      const url = String(item?.url || "").trim();
      if (!url) return null;
      return {
        type: item?.caption === "ROOM_VIDEO" ? "video" : "image",
        url,
        order: Number(item?.order ?? 0),
      };
    })
    .filter(Boolean);

  const media =
    Array.isArray(room.media) && room.media.length
      ? room.media
          .map((item, index) => {
            const url = String(item?.url || "").trim();
            if (!url) return null;
            const type =
              String(item?.type || "").toLowerCase() === "video"
                ? "video"
                : "image";
            return {
              type,
              url,
              order: Number(item?.order ?? index),
            };
          })
          .filter(Boolean)
      : mediaFromRelation;

  media.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));

  const images = media
    .filter((item) => item.type === "image")
    .map((item) => item.url);
  const videoUrl =
    media.find((item) => item.type === "video")?.url ||
    String(room.videoUrl || "");
  const previewMedia = media.length
    ? { type: media[0].type, url: media[0].url }
    : null;
  const amenityDetails = Array.isArray(room.amenities)
    ? room.amenities
        .map((item) => {
          const source = item?.amenity || item;
          const id = String(source?.id || "").trim();
          const name = String(source?.name || "").trim();
          if (!id || !name) return null;
          return { id, name };
        })
        .filter(Boolean)
    : [];
  const amenities = amenityDetails.map((item) => item.name);

  return {
    id: room.id,
    name: room.name,
    type: normalizeRoomTypeForUi(room.type),
    rent: Number(room.rent),
    deposit: Number(room.deposit),
    status: String(room.status || "AVAILABLE"),
    amenities,
    amenityDetails,
    description: typeof room.description === "string" ? room.description : "",
    rules: Array.isArray(room.rules) ? room.rules : [],
    videoUrl,
    images,
    previewMedia,
    area: Number(room.area),
    floor: Number(room.floor),
    media,
    occupiedUntil: room.occupiedUntil || null,
    availabilityStatus: room.availabilityStatus || null,
    availableFrom: room.availableFrom || null,
    // Management fields for admin operations
    managementRent: room.managementRent ?? null,
    managementStatus: room.managementStatus ?? null,
    managementIsAvailable: room.managementIsAvailable ?? null,
    managementOccupiedUntil: room.managementOccupiedUntil ?? null,
    isAvailable: room.isAvailable ?? true,
  };
}

export async function getRooms() {
  const rooms = await request("/api/rooms");
  return Array.isArray(rooms) ? rooms.map(normalizeRoom) : [];
}

export async function getAvailableRooms(selectedMonth) {
  let query = "";
  if (selectedMonth && isValidMonthKey(selectedMonth)) {
    query = `?month=${encodeURIComponent(selectedMonth.trim())}`;
  }
  const rooms = await request(`/rooms/available${query}`);
  return Array.isArray(rooms) ? rooms.map(normalizeRoom) : [];
}

export async function getAdminRooms(token) {
  const rooms = await request("/api/admin/rooms", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return Array.isArray(rooms) ? rooms.map(normalizeRoom) : [];
}

export async function getAdminRoom(token, id) {
  const room = await request(`/admin/rooms/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return normalizeRoom(room);
}

export async function getAdminAmenities(token) {
  return request("/api/admin/amenities", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createAdminAmenity(token, name) {
  return request("/api/admin/amenities", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: { name },
  });
}

export async function deleteAdminAmenity(token, amenityId) {
  return request(`/admin/amenities/${amenityId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getRoomById(id) {
  const room = await request(`/rooms/${id}`);
  return normalizeRoom(room);
}

export async function signUp(payload) {
  return request("/api/auth/signup", {
    method: "POST",
    body: payload,
  });
}

export async function login(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function setDob(payload) {
  return request("/api/auth/set-dob", {
    method: "POST",
    body: payload,
  });
}

export async function createAdminRoom(token, formData) {
  const data = await request("/api/admin/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return normalizeRoom(data);
}

// keep uploadRoomVideo for backwards compatibility but new form sends media directly
export async function uploadRoomVideo(token, file) {
  const formData = new FormData();
  formData.append("video", file);

  return request("/api/admin/upload/video", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
}

export async function createBooking(token, payload) {
  if (!payload) {
    throw new Error("Booking payload missing.");
  }

  const roomId = String(payload.roomId || "").trim();
  const moveInDate = String(payload.moveInDate || "").trim();
  const moveOutDate = String(payload.moveOutDate || "").trim();

  if (!roomId) {
    throw new Error("Room ID is required.");
  }

  if (!moveInDate || !moveOutDate) {
    throw new Error("Move-in and move-out dates are required.");
  }

  const rawBookingSource = String(
    payload.bookingSource ?? payload.source ?? "WALK_IN",
  )
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  const bookingSource =
    rawBookingSource === "WALKIN" ? "WALK_IN" : rawBookingSource;

  if (bookingSource !== "WALK_IN" && bookingSource !== "BROKER") {
    throw new Error("Booking source must be WALK_IN or BROKER.");
  }

  const normalizedBrokerName =
    bookingSource === "BROKER"
      ? String(payload.brokerName ?? "").trim()
      : "";

  if (bookingSource === "BROKER" && !normalizedBrokerName) {
    throw new Error("Broker name is required when booking source is BROKER.");
  }

  const bookingPayload = {
    roomId,
    moveInDate,
    moveOutDate,
    bookingSource,
    brokerName: bookingSource === "BROKER" ? normalizedBrokerName : null,
  };

  console.log("FINAL BOOKING PAYLOAD:", bookingPayload);

  return request("/api/bookings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: bookingPayload,
  });
}

export async function getPendingBookings(token) {
  return request("/api/admin/bookings", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAllBookings(token) {
  return request("/api/admin/bookings", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function approveBooking(token, bookingId) {
  return request(`/admin/bookings/${bookingId}/approve`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function rejectBooking(token, bookingId) {
  return request(`/admin/bookings/${bookingId}/reject`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getCurrentUser(token) {
  return request("/api/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAdminStats(token) {
  return request("/api/admin/dashboard", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAdminTenants(token) {
  return request("/api/admin/tenants", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAdminTenantById(token, tenantId) {
  return request(`/admin/tenants/${tenantId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function removeAdminTenant(token, tenantId) {
  return request(`/admin/tenants/${tenantId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateAdminTenant(token, tenantId, data) {
  return request(`/admin/tenants/${tenantId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: data,
  });
}

export async function createOfflineTenant(token, data) {
  return request("/api/admin/tenants/create-offline", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: data,
  });
}

export async function uploadVerificationFile(token, file, documentType) {
  const formData = new FormData();
  formData.append("file", file);

  const suffix = documentType
    ? `?documentType=${encodeURIComponent(documentType)}`
    : "";

  return request(`/documents/upload/file${suffix}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
}

export async function createDocumentRecord(token, payload) {
  return request("/api/documents/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminRoom(token, roomId, formData) {
  const data = await request(`/admin/rooms/${roomId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return normalizeRoom(data);
}

export async function deleteAdminRoom(token, roomId) {
  return request(`/admin/rooms/${roomId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getMyBookings(token) {
  return request("/api/bookings/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getMyApprovedBooking(token) {
  return request("/api/bookings/my", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getMyActiveBooking(token) {
  return request("/api/bookings/my-active-booking", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getMyRoom(token) {
  return request("/api/bookings/my-room", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getMyAgreement(token) {
  return request("/api/agreements/my", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getMyPayments(token) {
  return request("/api/payments/my", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function payMyPayment(token, payload) {
  return request("/api/payments/pay", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getPaymentSummary(token) {
  return request("/api/payments/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAllPayments(token) {
  return request("/api/admin/payments", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function markPaymentPaid(token, paymentId, amountReceived, note, paymentMethod) {
  return request(`/admin/payments/${paymentId}/mark-paid`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      amountReceived,
      note,
      paymentMethod,
    },
  });
}

export async function getMyDocuments(token) {
  return request("/api/documents/my", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAllDocuments(token) {
  return request("/api/admin/documents", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateDocumentStatus(
  token,
  documentId,
  status,
  rejectReason,
) {
  const normalized = String(status || "").toUpperCase();
  const path =
    normalized === "APPROVED"
      ? `/admin/documents/${documentId}/approve`
      : `/admin/documents/${documentId}/reject`;
  return request(path, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body:
      rejectReason
        ? {
            rejectReason,
          }
        : {},
  });
}

export async function getMyMaintenanceTickets(token) {
  return request("/api/maintenance/my", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createMaintenanceTicket(token, payload) {
  return request("/api/maintenance/request", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getAdminMaintenanceRequests(token) {
  return request("/api/admin/maintenance", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function approveAdminMaintenanceRequest(token, requestId) {
  return request(`/admin/maintenance/${requestId}/approve`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function rejectAdminMaintenanceRequest(token, requestId) {
  return request(`/admin/maintenance/${requestId}/reject`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateMyProfile(token, payload) {
  return request("/api/users/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

// ================= NOTIFICATIONS =================

export async function getMyNotifications(token) {
  return request("/api/notifications/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function markNotificationsRead(token) {
  return request("/api/notifications/me/read-all", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createCancellationRequest(token, bookingId, reason) {
  return request("/api/cancellation-request", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      bookingId,
      reason,
    },
  });
}

export async function getMyRequest(token) {
  return request("/api/cancellation-request/my-request", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getPendingCancellationRequests(token) {
  return request("/api/cancellation-request/pending", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function approveCancellationRequest(token, requestId) {
  return request(`/cancellation-request/${requestId}/approve`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function rejectCancellationRequest(
  token,
  requestId,
  rejectionReason,
) {
  return request(`/cancellation-request/${requestId}/reject`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      rejectionReason,
    },
  });
}

export async function downloadInvoice(token, paymentId) {
  // DownloadInvoice returns a blob, so we need special handling
  const url = `${API_URL}${API_PREFIX}/payments/invoice/${paymentId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to download invoice (${response.status})`);
  }

  return response.blob();
}

export async function uploadPaymentScreenshot(token, paymentId, file) {
  return request("/api/payments/upload-screenshot", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: (() => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("paymentId", paymentId);
      return formData;
    })(),
  });
}

export async function adminApprovePayment(token, paymentId) {
  return request(`/payments/admin/${paymentId}/approve`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function adminRejectPayment(token, paymentId, reason) {
  return request(`/payments/admin/${paymentId}/reject`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: { reason },
  });
}

// Notifications API - Extended functions
export async function getUnreadNotificationCount(token) {
  return request("/api/notifications/me/unread-count", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function markAllNotificationsRead(token) {
  return request("/api/notifications/me/read-all", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function markNotificationRead(token, notificationId) {
  return request(`/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Admin Charts API
export async function getMonthlyRevenue(token) {
  return request("/api/admin/charts/revenue", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getOccupancyData(token) {
  return request("/api/admin/charts/occupancy", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Agreement signing APIs
export async function signAgreementAsTenant(token, bookingId, signature) {
  return request(`/agreements/booking/${bookingId}/sign`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: { signature },
  });
}

export async function signAgreementAsAdmin(token, bookingId, signature) {
  return request(`/agreements/admin/booking/${bookingId}/sign`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: { signature },
  });
}

export async function getAgreementByBooking(token, bookingId) {
  return request(`/agreements/booking/${bookingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export { API_URL };

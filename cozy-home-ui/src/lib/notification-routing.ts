export type AppRole = "ADMIN" | "TENANT";

type NotificationLike = {
  type?: string | null;
  title?: string | null;
  metadata?: unknown;
};

function extractPathFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const path = (metadata as { path?: unknown }).path;
  if (typeof path === "string" && path.startsWith("/")) {
    return path;
  }
  return null;
}

export function getNotificationTargetPath(
  notification: NotificationLike,
  role: AppRole,
): string | null {
  const metadataPath = extractPathFromMetadata(notification?.metadata);
  if (metadataPath) return metadataPath;

  const type = String(notification?.type || "").toUpperCase();
  const title = String(notification?.title || "").toUpperCase();

  // Handle booking-related notifications
  if (
    title.includes("BOOKING") ||
    type === "NEW_BOOKING_REQUEST" ||
    type === "BOOKING_APPROVED" ||
    type === "BOOKING_REJECTED"
  ) {
    return role === "ADMIN" ? "/admin/bookings" : "/users/me";
  }

  if (
    type === "RENT_REMINDER" ||
    type === "RENT_OVERDUE" ||
    type === "PAYMENT_APPROVED" ||
    type === "PAYMENT_REJECTED"
  ) {
    return role === "ADMIN" ? "/admin/payments" : "/users/me/payments";
  }

  if (type === "DOCUMENT_APPROVED" || type === "DOCUMENT_REJECTED") {
    return role === "ADMIN" ? "/admin/documents" : "/users/me/documents";
  }

  if (type === "MAINTENANCE_UPDATE") {
    return role === "ADMIN" ? "/admin/maintenance" : "/users/me/maintenance";
  }

  return null;
}

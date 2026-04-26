type NotificationLike = {
  title?: string | null;
  message?: string | null;
  metadata?: unknown;
};

function getMetadataPhone(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const phone = (metadata as { phone?: unknown }).phone;
  return typeof phone === "string" ? phone : null;
}

export function extractNotificationPhone(notification: NotificationLike): string | null {
  const metadataPhone = getMetadataPhone(notification.metadata);
  const phoneLine =
    metadataPhone ||
    notification.message?.match(/^Phone:\s*(.+)$/im)?.[1]?.trim() ||
    null;

  if (!phoneLine || /not\s+provided/i.test(phoneLine)) {
    return null;
  }

  const digits = phoneLine.replace(/\D/g, "");
  if (digits.length < 10) {
    return null;
  }

  if (phoneLine.trim().startsWith("+")) {
    return digits;
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }

  return digits;
}

export function getWhatsAppUrl(phone: string) {
  return `https://wa.me/${phone}`;
}

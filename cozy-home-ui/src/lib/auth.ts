const TOKEN_KEYS = ["token", "access_token", "accessToken"];

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function getAccessToken() {
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return "";
}

export function persistToken(token: string) {
  TOKEN_KEYS.forEach((key) => localStorage.setItem(key, token));
}

export function clearAuthStorage() {
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("current_user");
  localStorage.removeItem("user");
  localStorage.removeItem("user_role");
  // Clear saved login credentials when user logs out
  localStorage.removeItem("iris_plaza_saved_phone");
  localStorage.removeItem("iris_plaza_saved_dob");
  localStorage.removeItem("iris_plaza_saved_password");
  localStorage.removeItem("iris_plaza_remember_me");
}

export function isTokenExpired(token: string) {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

export function isAuthenticated() {
  const token = getAccessToken();
  if (!token) return false;

  if (isTokenExpired(token)) {
    return false;
  }

  return true;
}

export function getCurrentUser() {
  const raw = localStorage.getItem("current_user") || localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getCurrentUserRole() {
  const role = localStorage.getItem("user_role") || getCurrentUser()?.role || "";
  return String(role || "").toUpperCase();
}

import { tKey } from "@/lib/i18n/translate";

const ERROR_KEYS: Record<string, string> = {
  "login-failed": "web.api.error.login-failed",
  "admin-exists": "web.api.error.admin-exists",
  "username-exists": "web.api.error.username-exists",
  "user-not-found": "web.api.error.user-not-found",
  "invalid-token": "web.api.error.invalid-token",
  "permission-denied": "web.api.error.permission-denied",
  "internal-server-error": "web.api.error.internal-server-error",
  "network-error": "web.api.error.network-error",
  "invalid-password": "web.api.error.invalid-password",
  "wrong-password": "web.api.error.wrong-password",
};

export function formatApiError(code?: string, fallback?: string): string {
  if (!code) return fallback ?? tKey("web.api.error.fallback");
  const key = ERROR_KEYS[code];
  if (key) return tKey(key);
  return fallback ?? tKey("web.api.error.with-code", { code });
}

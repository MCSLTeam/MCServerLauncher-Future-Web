/** 返回 i18n key；调用方用 t() 转成文案 */
export function validateUsername(username: string): string | null {
  const value = username.trim();
  if (value.length < 2 || value.length > 16) {
    return "web.auth.username.format";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (
    password.length < 8 ||
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/.test(password)
  ) {
    return "web.auth.password.invalid";
  }
  return null;
}

export function formatDateTime(ms: number): string {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ms));
  } catch {
    return String(ms);
  }
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

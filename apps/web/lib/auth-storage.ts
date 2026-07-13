const TOKEN_KEY = "mcsl-web-token";

export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(TOKEN_KEY) ??
    window.sessionStorage.getItem(TOKEN_KEY)
  );
}

export function writeToken(token: string | null, remember: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  if (!token) return;
  if (remember) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken(): void {
  writeToken(null, true);
}

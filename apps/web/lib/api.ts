import { formatApiError } from "@/lib/api-errors";
import { clearToken, readToken } from "@/lib/auth-storage";

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  err?: string;
  message?: string;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  /** 为 true 时 invalid-token 不自动清会话（用于登出等） */
  silentAuthError?: boolean;
};

type Envelope<T> = {
  status?: string;
  data?: T;
  err?: string;
  message?: string;
};

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function requestApi<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const method =
    options.method ?? (options.body !== undefined ? "POST" : "GET");
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth !== false) {
    const token = readToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (options.auth === true) {
      return {
        ok: false,
        status: 401,
        err: "invalid-token",
        message: formatApiError("invalid-token"),
      };
    }
  }

  const url = path.startsWith("/") ? path : `/api/${path}`;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin",
    });

    const text = await response.text();
    let envelope: Envelope<T> | null = null;
    if (text) {
      try {
        envelope = JSON.parse(text) as Envelope<T>;
      } catch {
        envelope = null;
      }
    }

    const errCode =
      envelope?.err ??
      (!response.ok && response.status === 504 ? "network-error" : undefined);

    if (!response.ok || envelope?.status === "failed") {
      if (errCode === "invalid-token" && !options.silentAuthError) {
        clearToken();
        onUnauthorized?.();
      }
      return {
        ok: false,
        status: response.status,
        err: errCode,
        message: formatApiError(errCode, envelope?.message),
        data: envelope?.data,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: envelope?.data as T,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      err: "network-error",
      message:
        error instanceof Error
          ? formatApiError("network-error")
          : formatApiError("network-error"),
    };
  }
}

/** 无需登录 */
export function publicApi<T>(
  path: string,
  options?: Omit<RequestOptions, "auth">,
) {
  return requestApi<T>(path, { ...options, auth: false });
}

/** 需要登录 */
export function authApi<T>(
  path: string,
  options?: Omit<RequestOptions, "auth">,
) {
  return requestApi<T>(path, { ...options, auth: true });
}

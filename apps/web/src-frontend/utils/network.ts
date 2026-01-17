import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { useLocale } from "@repo/ui/src/utils/stores.ts";
import { useAccount } from "./store.ts";
import {
  MCSLNotif,
  type MCSLNotifSettings,
} from "@repo/ui/src/utils/notifications.ts";

export type Method =
  | "GET"
  | "DELETE"
  | "HEAD"
  | "POST"
  | "PUT"
  | "PATCH"
  | "PURGE";

export type ApiErrNotifProvider = (message: string) => MCSLNotifSettings;

function notifyErr(
  path: string,
  method: Method,
  err: any,
  notification?: string | ApiErrNotifProvider,
) {
  console.warn(`Failed to request /api${path} with method ${method}`, err);
  const message = err instanceof Error ? err.message : err;
  if (typeof notification == "function") {
    new MCSLNotif(notification(message)).open();
  } else if (notification) {
    new MCSLNotif({
      data: {
        title: useLocale().getI18n().t("ui.notification.title.error"),
        message: useLocale().getI18n().t(notification, { reason: message }),
        color: "danger",
      },
    }).open();
  }
}

export async function request(
  path: string,
  method: Method,
  data: any = {},
  headers: object = {},
  requestConfig: AxiosRequestConfig = {},
  errNotification?: string | ApiErrNotifProvider,
): Promise<AxiosResponse> {
  try {
    return await axios("/api" + path, {
      ...requestConfig,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      ...(method == "GET" || method == "HEAD"
        ? {
            params: data,
          }
        : {
            data: data,
          }),
    });
  } catch (e) {
    const ex = <AxiosError>e;
    const res = ex.response as any;
    const err = new ApiError(
      path,
      method,
      res?.data?.err ?? (ex.status == 504 ? "network-error" : ex.message),
      e,
    );
    notifyErr(path, method, err, errNotification);
    throw err;
  }
}

export async function requestApi<T>(
  path: string,
  method: Method,
  data?: any,
  headers?: object,
  requestConfig?: AxiosRequestConfig,
  errNotification?: string | ApiErrNotifProvider,
): Promise<T> {
  return (
    await request(path, method, data, headers, requestConfig, errNotification)
  ).data.data;
}

export async function requestWithToken<T>(
  path: string,
  method: Method,
  data?: any,
  headers?: object,
  requestConfig?: AxiosRequestConfig,
  errNotification?: string | ApiErrNotifProvider,
  autoRefreshToken: boolean = true,
): Promise<T> {
  try {
    if (!useAccount().accessToken) {
      throw new ApiError(path, method, "invalid-token");
    }
    return await requestApi(
      path,
      method,
      data,
      {
        ...headers,
        Authorization: "Bearer " + useAccount().accessToken,
      },
      requestConfig,
    );
  } catch (e) {
    if (
      e instanceof ApiError &&
      e.cause == "invalid-token" &&
      autoRefreshToken
    ) {
      if (await useAccount().refreshToken())
        return await requestWithToken(
          path,
          method,
          data,
          headers,
          requestConfig,
          errNotification,
        );
    }

    notifyErr(path, method, e, errNotification);
    throw e;
  }
}

export class ApiError extends Error {
  constructor(
    public readonly path: string,
    public readonly method: Method,
    public readonly err: string,
    public readonly cause?: any,
  ) {
    super(
      useLocale()
        .getI18n()
        .t("web.api.error." + err),
    );
  }
}

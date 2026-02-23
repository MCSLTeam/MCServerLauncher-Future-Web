import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { useLocale } from "@repo/ui/src/utils/stores.ts";
import { useAccount } from "./store.ts";
import { MCSLNotif } from "@repo/ui/src/utils/notifications.ts";

export type Method =
  | "GET"
  | "DELETE"
  | "HEAD"
  | "POST"
  | "PUT"
  | "PATCH"
  | "PURGE";

export function notifyErr(
  err: ApiError,
  notification: string,
  color: string = "danger",
) {
  console.warn(
    `Failed to request /api${err.path} with method ${err.method}`,
    err,
  );
  new MCSLNotif({
    data: {
      title: useLocale().getI18n().t("ui.notification.title.error"),
      message: useLocale().getI18n().t(notification, { reason: err.message }),
      color,
    },
  }).open();
}

export async function request(
  path: string,
  method: Method,
  errHandler?: (err: ApiError) => Promise<void> | void,
  data: any = {},
  headers: object = {},
  requestConfig: AxiosRequestConfig = {},
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
    await errHandler?.(err);
    throw err;
  }
}

export async function requestApi<T>(
  path: string,
  method: Method,
  errHandler?: (err: ApiError) => Promise<void> | void,
  data?: any,
  headers?: object,
  requestConfig?: AxiosRequestConfig,
): Promise<T> {
  return (await request(path, method, errHandler, data, headers, requestConfig))
    .data.data;
}

export async function requestWithToken<T>(
  path: string,
  method: Method,
  errHandler?: (err: ApiError) => Promise<void> | void,
  data?: any,
  headers?: object,
  requestConfig?: AxiosRequestConfig,
): Promise<T> {
  const token = useAccount().token;
  if (!token) {
    const err = new ApiError(path, method, "invalid-token");
    await errHandler?.(err);
    throw err;
  }
  return await requestApi(
    path,
    method,
    async (e) => {
      if (token) {
        if (e.err == "permission-denied") await useAccount().updateSelfInfo();
        if (e.err == "invalid-token") {
          await useAccount().logout(false);
          new MCSLNotif({
            data: {
              title: useLocale().getI18n().t("ui.notification.title.warning"),
              message: useLocale().getI18n().t("web.auth.login.expired"),
              color: "warning",
            },
          }).open();
          return;
        }
      }
      await errHandler?.(e);
    },
    data,
    {
      ...headers,
      Authorization: "Bearer " + token,
    },
    requestConfig,
  );
}

export class ApiError extends Error {
  constructor(
    public readonly path: string,
    public readonly method: Method,
    public readonly err: string,
    public readonly cause?: any,
  ) {
    const key = "web.api.error." + err;
    const localized = useLocale().getI18n().t(key);
    super(key != localized ? localized : err);
  }
}

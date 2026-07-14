"use client";

import { useSyncExternalStore } from "react";

type TauriWindow = Window & {
  __TAURI__?: {
    core?: {
      invoke?: <T>(
        command: string,
        args?: Record<string, unknown>,
      ) => Promise<T>;
    };
  };
  __TAURI_INTERNALS__?: unknown;
  isTauri?: boolean;
};

export function isTauriRuntime() {
  if (typeof window === "undefined") return false;
  const runtime = window as TauriWindow;
  return Boolean(
    runtime.__TAURI_INTERNALS__ ||
    runtime.__TAURI__ ||
    runtime.isTauri ||
    window.location.protocol === "tauri:" ||
    window.location.hostname === "tauri.localhost",
  );
}

export function invokeTauri<T>(
  command: string,
  args?: Record<string, unknown>,
) {
  const invoke = (window as TauriWindow).__TAURI__?.core?.invoke;
  if (!invoke) throw new Error("Tauri IPC unavailable");
  return invoke<T>(command, args);
}

const emptySubscribe = () => () => {};

export function useIsTauriRuntime() {
  return useSyncExternalStore(emptySubscribe, isTauriRuntime, () => false);
}

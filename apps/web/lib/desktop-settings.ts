"use client";

/**
 * 桌面端偏好（tauri / Web 通用交互）：
 * 对齐 WPF More_FollowStartupForLauncher、More_AutoCheckUpdateForLauncher、
 * Instance_ActionOnDoubleClick、ActionWhenDeleteConfirm。
 * 这些是客户端交互偏好，仅存 localStorage，不进入后端 /api/preferences。
 */
export type DoubleClickAction =
  | "none"
  | "console"
  | "settings"
  | "start"
  | "stop"
  | "restart"
  | "kill";

export type DeleteConfirmMethod = "confirm" | "type-name";

export type DesktopSettings = {
  /** 开机自启（tauri 原生能力；浏览器端无意义返回 false） */
  followStartup: boolean;
  /** 启动时自动检查更新（tauri 原生能力） */
  checkUpdatesOnLaunch: boolean;
  /** 实例卡片双击动作（对齐 WPF Instance_ActionOnDoubleClick） */
  actionOnDoubleClick: DoubleClickAction;
  /** 删除实例/节点的确认方式（对齐 WPF ActionWhenDeleteConfirm） */
  deleteConfirmMethod: DeleteConfirmMethod;
};

const STORAGE_KEY = "mcsl-web-desktop-settings";

const DEFAULTS: DesktopSettings = {
  followStartup: false,
  checkUpdatesOnLaunch: true,
  // WPF 默认 _None（双击无动作）；Web 保持保守，默认打开控制台。
  actionOnDoubleClick: "console",
  deleteConfirmMethod: "confirm",
};

export function loadDesktopSettings(): DesktopSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<DesktopSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveDesktopSettings(settings: DesktopSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/** tauri：读取当前开机自启状态；非 tauri 返 null（前端不显示）。 */
export async function readAutostartState(): Promise<boolean | null> {
  if (typeof window === "undefined") return null;
  const runtime = window as Window & { __TAURI__?: unknown };
  if (!runtime.__TAURI__) return null;
  try {
    const { invokeTauri } = await import("@/lib/tauri-runtime");
    return await invokeTauri<boolean>("autostart_enabled");
  } catch {
    return null;
  }
}

/** tauri：设置开机自启；非 tauri 返回 false。 */
export async function writeAutostartState(enabled: boolean): Promise<boolean> {
  try {
    const { invokeTauri, isTauriRuntime } = await import("@/lib/tauri-runtime");
    if (!isTauriRuntime()) return false;
    const current = await invokeTauri<boolean>("set_autostart", { enabled });
    return current;
  } catch {
    return false;
  }
}

/** tauri：检查最新版本；返回 null 表示不可用/无发布。 */
export type UpdateCheckResult = {
  latestVersion: string;
  releaseUrl: string;
};

export async function checkForUpdate(): Promise<UpdateCheckResult | null> {
  try {
    const { invokeTauri, isTauriRuntime } = await import("@/lib/tauri-runtime");
    if (!isTauriRuntime()) return null;
    return await invokeTauri<UpdateCheckResult | null>("check_update");
  } catch {
    return null;
  }
}

/** 用系统浏览器/新标签打开 URL（检查更新下载页）。 */
export async function openExternalUrl(url: string): Promise<boolean> {
  try {
    const { invokeTauri, isTauriRuntime } = await import("@/lib/tauri-runtime");
    if (isTauriRuntime()) {
      return await invokeTauri<boolean>("open_external", { url });
    }
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  } catch {
    return false;
  }
}

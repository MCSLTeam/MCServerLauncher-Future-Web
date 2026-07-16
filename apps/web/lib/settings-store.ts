import {
  THEME_COOKIE_KEY,
  THEME_STORAGE_KEY,
} from "@/features/theme/theme-keys";
import { requestApi } from "@/lib/api";

export type AppSettings = {
  /** 是否允许页面自定义右键菜单 */
  allowContextMenu: boolean;
  /** 终端是否使用内置输入框 */
  useTerminalInput: boolean;
  /** 浅色 / 深色 / 跟随系统 */
  theme: "system" | "light" | "dark";
  /** WPF Download.DownloadSource */
  downloadSource:
    | "FastMirror"
    | "PolarsMirror"
    | "RainYun"
    | "MSLAPI"
    | "MCSLSync";
  /** WPF Download.ThreadCnt */
  downloadThreads: number;
  /** WPF Download.ActionWhenDownloadError */
  downloadErrorAction: "stop" | "retry1" | "retry3";
};

const LEGACY_KEY = "mcsl-web-settings";
const CACHE_KEY = "mcsl-web-settings-cache";

const DEFAULTS: AppSettings = {
  allowContextMenu: true,
  useTerminalInput: true,
  theme: "system",
  downloadSource: "FastMirror",
  downloadThreads: 16,
  downloadErrorAction: "stop",
};

type ApiPreferences = {
  allow_context_menu?: boolean;
  use_terminal_input?: boolean;
  theme?: string;
  download_source?: string;
  download_threads?: number;
  download_error_action?: string;
  locale?: string | null;
  daemon_auto_refresh_enabled?: boolean;
  daemon_auto_refresh_seconds?: number;
};

let memory: AppSettings | null = null;
let autoRefresh = { enabled: false, seconds: 30 as number };
let localePref: string | null = null;

function isTheme(v: unknown): v is AppSettings["theme"] {
  return v === "system" || v === "light" || v === "dark";
}

function mapPrefs(p: ApiPreferences): AppSettings {
  const theme = isTheme(p.theme) ? p.theme : DEFAULTS.theme;
  return {
    allowContextMenu: p.allow_context_menu ?? DEFAULTS.allowContextMenu,
    useTerminalInput: p.use_terminal_input ?? DEFAULTS.useTerminalInput,
    theme,
    downloadSource:
      (p.download_source as AppSettings["downloadSource"]) ??
      DEFAULTS.downloadSource,
    downloadThreads: p.download_threads ?? DEFAULTS.downloadThreads,
    downloadErrorAction:
      (p.download_error_action as AppSettings["downloadErrorAction"]) ??
      DEFAULTS.downloadErrorAction,
  };
}

function toApiBody(settings: AppSettings): ApiPreferences {
  return {
    allow_context_menu: settings.allowContextMenu,
    use_terminal_input: settings.useTerminalInput,
    theme: settings.theme,
    download_source: settings.downloadSource,
    download_threads: settings.downloadThreads,
    download_error_action: settings.downloadErrorAction,
    locale: localePref,
    daemon_auto_refresh_enabled: autoRefresh.enabled,
    daemon_auto_refresh_seconds: autoRefresh.seconds,
  };
}

function writeLocalCache(settings: AppSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
    window.localStorage.setItem(THEME_STORAGE_KEY, settings.theme);
  } catch {
    // ignore
  }
  document.cookie = `${THEME_COOKIE_KEY}=${settings.theme}; path=/; max-age=31536000; samesite=lax`;
}

/** 同步读：内存 → 本地缓存 → 默认（首屏/无登录时） */
export function loadSettings(): AppSettings {
  if (memory) return { ...memory };
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw =
      window.localStorage.getItem(CACHE_KEY) ??
      window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return { ...DEFAULTS };
  }
}

/** 从后端拉取偏好并刷新缓存 */
export async function hydrateSettings(): Promise<AppSettings> {
  const res = await requestApi<ApiPreferences>("/api/preferences", {
    auth: true,
  });
  if (!res.ok || !res.data) {
    const local = loadSettings();
    memory = local;
    return local;
  }
  const settings = mapPrefs(res.data);
  autoRefresh = {
    enabled: Boolean(res.data.daemon_auto_refresh_enabled),
    seconds: Number(res.data.daemon_auto_refresh_seconds ?? 30) || 30,
  };
  localePref = res.data.locale ?? null;
  memory = settings;
  writeLocalCache(settings);
  applyTheme(settings.theme);
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
  return { ...settings };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  memory = { ...settings };
  writeLocalCache(settings);
  applyTheme(settings.theme);
  await requestApi("/api/preferences", {
    method: "PUT",
    auth: true,
    body: toApiBody(settings),
  });
}

export function loadAutoRefreshPreference(): {
  enabled: boolean;
  seconds: number;
} {
  return { ...autoRefresh };
}

export async function saveAutoRefreshPreference(input: {
  enabled: boolean;
  seconds: number;
}): Promise<void> {
  autoRefresh = {
    enabled: input.enabled,
    seconds: input.seconds,
  };
  const settings = loadSettings();
  await requestApi("/api/preferences", {
    method: "PUT",
    auth: true,
    body: toApiBody(settings),
  });
}

export function getStoredLocalePreference(): string | null {
  return localePref;
}

export async function saveLocalePreference(
  locale: string | null,
): Promise<void> {
  localePref = locale;
  const settings = loadSettings();
  await requestApi("/api/preferences", {
    method: "PUT",
    auth: true,
    body: toApiBody(settings),
  });
}

/** 同步 DOM 主题 class / colorScheme（与 ThemeProvider 行为一致） */
export function applyTheme(theme: AppSettings["theme"]): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = dark ? "dark" : "light";
}

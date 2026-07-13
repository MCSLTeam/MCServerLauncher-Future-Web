import {
  THEME_COOKIE_KEY,
  THEME_STORAGE_KEY,
} from "@/features/theme/theme-keys";

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

const KEY = "mcsl-web-settings";

const DEFAULTS: AppSettings = {
  allowContextMenu: true,
  useTerminalInput: true,
  theme: "system",
  downloadSource: "FastMirror",
  downloadThreads: 16,
  downloadErrorAction: "stop",
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(settings: AppSettings): void {
  window.localStorage.setItem(KEY, JSON.stringify(settings));
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, settings.theme);
  } catch {
    // ignore
  }
  document.cookie = `${THEME_COOKIE_KEY}=${settings.theme}; path=/; max-age=31536000; samesite=lax`;
  applyTheme(settings.theme);
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

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  THEME_COOKIE_KEY,
  THEME_STORAGE_KEY,
} from "@/features/theme/theme-keys";
import { loadSettings, type AppSettings } from "@/lib/settings-store";

export type ThemeMode = AppSettings["theme"];

export { THEME_COOKIE_KEY, THEME_STORAGE_KEY };

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function showThemeGradient() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  overlay.className = "theme-gradient-swap";
  document.body.appendChild(overlay);
  window.setTimeout(() => overlay.remove(), 520);
}

export function applyTheme(mode: ThemeMode, animate = false) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const useDark = mode === "dark" || (mode === "system" && getSystemDark());
  if (animate) showThemeGradient();
  root.classList.toggle("dark", useDark);
  root.classList.toggle("light", mode === "light");
  root.style.colorScheme = useDark ? "dark" : "light";
}

function writeCookie(value: ThemeMode) {
  document.cookie = `${THEME_COOKIE_KEY}=${value}; path=/; max-age=31536000; samesite=lax`;
}

function readCookie(): ThemeMode | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${THEME_COOKIE_KEY}=([^;]*)`),
  );
  const val = match?.[1];
  if (val === "light" || val === "dark" || val === "system") return val;
  return null;
}

function readLocalTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // ignore
  }
  return null;
}

function resolveStoredMode(fallback: ThemeMode): ThemeMode {
  return readLocalTheme() ?? readCookie() ?? loadSettings().theme ?? fallback;
}

function persistTheme(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
  writeCookie(mode);
  const current = loadSettings();
  if (current.theme !== mode) {
    window.localStorage.setItem(
      "mcsl-web-settings",
      JSON.stringify({ ...current, theme: mode }),
    );
  }
}

export function ThemeProvider({
  children,
  initialMode = "system",
}: {
  children: ReactNode;
  initialMode?: ThemeMode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return initialMode;
    return resolveStoredMode(initialMode);
  });

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    persistTheme(nextMode);
    applyTheme(nextMode, true);
  }, []);

  useEffect(() => {
    applyTheme(mode);
    if (mode !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

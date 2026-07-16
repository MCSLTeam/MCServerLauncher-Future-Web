import loader from "@monaco-editor/loader";
import type * as Monaco from "monaco-editor";

import type { LocaleCode } from "@/lib/i18n/types";

export const MONACO_VERSION = "0.55.1";
/** MCSL Web 内置 AMD 资源（scripts/sync-monaco.mjs → public/monaco/vs） */
export const MONACO_VS_BASE = "/monaco/vs";
/** @deprecated 使用 MONACO_VS_BASE；保留别名避免外部误用 CDN */
export const MONACO_VS_CDN = MONACO_VS_BASE;

export const MONACO_THEME_LIGHT = "mcsl-light";
export const MONACO_THEME_DARK = "mcsl-dark";

let configured = false;
let initPromise: Promise<typeof Monaco> | null = null;
let themesDefined = false;
let lastNls: string | null = null;
let nlsLoadPromise: Promise<void> | null = null;

/**
 * Map app locale → Monaco locale pack id (empty = English default).
 * Pack files live at `min/vs/nls.messages.<id>.js.js` in Monaco 0.55.
 */
export function monacoNlsFromLocale(locale: LocaleCode): string {
  if (locale.startsWith("zh-TW") || locale.startsWith("zh-HK")) return "zh-tw";
  if (locale.startsWith("zh")) return "zh-cn";
  if (locale.startsWith("ja")) return "ja";
  if (locale.startsWith("ru")) return "ru";
  return "";
}

/**
 * Monaco 0.55 AMD NLS is broken for CDN use:
 * - messages-loader requires `vs/nls.messages.zh-cn`
 * - pack file is named `nls.messages.zh-cn.js.js`
 * - define id is `vs/nls.messages.zh-cn.js`
 *
 * Workaround: fetch the pack and run it with a local `define` shim so it sets
 * `globalThis._VSCODE_NLS_MESSAGES` / `_VSCODE_NLS_LANGUAGE` before editor init.
 * Do NOT set `vs/nls.availableLanguages` (that path 404s).
 */
async function ensureNlsGlobals(nls: string): Promise<void> {
  if (typeof window === "undefined" || !nls || nls === "en") return;
  const g = globalThis as typeof globalThis & {
    _VSCODE_NLS_MESSAGES?: string[];
    _VSCODE_NLS_LANGUAGE?: string;
  };
  if (g._VSCODE_NLS_LANGUAGE === nls && Array.isArray(g._VSCODE_NLS_MESSAGES)) {
    return;
  }
  if (nlsLoadPromise) {
    await nlsLoadPromise;
    return;
  }
  nlsLoadPromise = (async () => {
    // Monaco 0.55 packaging uses a double `.js` suffix on locale packs.
    const url = `${MONACO_VS_BASE}/nls.messages.${nls}.js.js`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Monaco NLS pack ${nls} HTTP ${res.status}`);
    }
    const code = await res.text();
    // define(id, factory) | define(id, deps, factory) | define(factory)
    const defineShim = (
      idOrFactory: string | (() => unknown),
      maybeDepsOrFactory?: string[] | (() => unknown),
      maybeFactory?: (helpers: {
        getDefaultExportFromCjs: (value: unknown) => unknown;
      }) => unknown,
    ) => {
      let factory: ((...args: unknown[]) => unknown) | undefined;
      let withDeps = false;
      if (typeof idOrFactory === "function") {
        factory = idOrFactory;
      } else if (Array.isArray(maybeDepsOrFactory)) {
        factory = maybeFactory as ((...args: unknown[]) => unknown) | undefined;
        withDeps = true;
      } else if (typeof maybeDepsOrFactory === "function") {
        factory = maybeDepsOrFactory;
      }
      if (typeof factory !== "function") return;
      if (withDeps) {
        factory({
          getDefaultExportFromCjs: (value: unknown) =>
            value &&
            typeof value === "object" &&
            "default" in (value as object)
              ? (value as { default: unknown }).default
              : value,
        });
      } else {
        factory();
      }
    };
    // Pack is AMD: define("vs/nls.messages.xx.js", function(){ globalThis._VSCODE_... })
    // eslint-disable-next-line no-new-func -- evaluate vendor AMD pack once
    new Function("define", code)(defineShim);
  })()
    .catch((err) => {
      console.warn("[monaco] NLS pack load failed, using English UI", err);
    })
    .finally(() => {
      // Allow a later locale retry only if this attempt left no globals.
      const g2 = globalThis as typeof globalThis & {
        _VSCODE_NLS_LANGUAGE?: string;
      };
      if (g2._VSCODE_NLS_LANGUAGE !== nls) {
        nlsLoadPromise = null;
      }
    });
  await nlsLoadPromise;
}

export function configureMonacoLoader(locale?: LocaleCode) {
  if (typeof window === "undefined") return;
  const nls = locale ? monacoNlsFromLocale(locale) : lastNls ?? "";
  // Reconfigure when nls changes before first init; after init, nls is fixed for this page.
  if (configured && lastNls === nls && initPromise) return;
  if (initPromise && lastNls !== nls) {
    // Already loading/loaded — skip nls flip (Monaco AMD cannot re-localize mid-session).
    return;
  }
  lastNls = nls;
  // Intentionally omit vs/nls.availableLanguages — see ensureNlsGlobals().
  // 使用站点同源内置资源，不走 CDN。
  loader.config({
    paths: { vs: MONACO_VS_BASE },
  });
  configured = true;
}

function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/** Register shadcn-token-based Monaco themes (safe to call multiple times). */
export function defineMcslMonacoThemes(monaco: typeof Monaco) {
  const bg = cssVar("--background", "#f5fbfa");
  const fg = cssVar("--foreground", "#0f1c1a");
  const card = cssVar("--card", "#ffffff");
  const muted = cssVar("--muted", "#e8f4f1");
  const mutedFg = cssVar("--muted-foreground", "#5b736e");
  const border = cssVar("--border", "#cfe4df");
  const primary = cssVar("--primary", "#1dbf9a");
  const accent = cssVar("--accent", "#d7f3ec");
  const destructive = cssVar("--destructive", "#e11d48");

  const darkBg = cssVar("--background", "#081316");
  const darkFg = cssVar("--foreground", "#e7f7f3");
  const darkCard = cssVar("--card", "#0d1c20");
  const darkMuted = cssVar("--muted", "#13262b");
  const darkMutedFg = cssVar("--muted-foreground", "#8aa8a2");
  const darkBorder = cssVar("--border", "#1e363c");
  const darkPrimary = cssVar("--primary", "#3de8c4");
  const darkAccent = cssVar("--accent", "#14353a");
  const darkDestructive = cssVar("--destructive", "#fb7185");

  // When document is light, :root vars are light; for dark theme we need .dark values.
  // Prefer reading after class is applied; fall back to known MCSL tokens.
  const isDark = document.documentElement.classList.contains("dark");

  monaco.editor.defineTheme(MONACO_THEME_LIGHT, {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "5b736e", fontStyle: "italic" },
      { token: "string", foreground: "0f766e" },
      { token: "keyword", foreground: "0f766e", fontStyle: "bold" },
      { token: "number", foreground: "b45309" },
    ],
    colors: {
      "editor.background": isDark ? "#f5fbfa" : bg,
      "editor.foreground": isDark ? "#0f1c1a" : fg,
      "editor.lineHighlightBackground": isDark ? "#e8f4f1" : muted,
      "editor.selectionBackground": `${primary}33`,
      "editor.inactiveSelectionBackground": `${primary}22`,
      "editorCursor.foreground": primary,
      "editorLineNumber.foreground": mutedFg,
      "editorLineNumber.activeForeground": fg,
      "editorIndentGuide.background": `${border}99`,
      "editorIndentGuide.activeBackground": border,
      "editorWidget.background": isDark ? "#ffffff" : card,
      "editorWidget.border": border,
      "editorSuggestWidget.background": isDark ? "#ffffff" : card,
      "editorSuggestWidget.border": border,
      "editorSuggestWidget.selectedBackground": accent,
      "editorHoverWidget.background": isDark ? "#ffffff" : card,
      "editorHoverWidget.border": border,
      "scrollbarSlider.background": `${mutedFg}33`,
      "scrollbarSlider.hoverBackground": `${mutedFg}55`,
      "scrollbarSlider.activeBackground": `${mutedFg}77`,
      "minimap.background": isDark ? "#f5fbfa" : bg,
      "focusBorder": primary,
      "inputValidation.errorBorder": destructive,
    },
  });

  monaco.editor.defineTheme(MONACO_THEME_DARK, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8aa8a2", fontStyle: "italic" },
      { token: "string", foreground: "5eead4" },
      { token: "keyword", foreground: "3de8c4", fontStyle: "bold" },
      { token: "number", foreground: "fbbf24" },
    ],
    colors: {
      "editor.background": isDark ? darkBg : "#081316",
      "editor.foreground": isDark ? darkFg : "#e7f7f3",
      "editor.lineHighlightBackground": isDark ? darkMuted : "#13262b",
      "editor.selectionBackground": `${darkPrimary}40`,
      "editor.inactiveSelectionBackground": `${darkPrimary}28`,
      "editorCursor.foreground": darkPrimary,
      "editorLineNumber.foreground": darkMutedFg,
      "editorLineNumber.activeForeground": darkFg,
      "editorIndentGuide.background": `${darkBorder}99`,
      "editorIndentGuide.activeBackground": darkBorder,
      "editorWidget.background": isDark ? darkCard : "#0d1c20",
      "editorWidget.border": darkBorder,
      "editorSuggestWidget.background": isDark ? darkCard : "#0d1c20",
      "editorSuggestWidget.border": darkBorder,
      "editorSuggestWidget.selectedBackground": darkAccent,
      "editorHoverWidget.background": isDark ? darkCard : "#0d1c20",
      "editorHoverWidget.border": darkBorder,
      "scrollbarSlider.background": `${darkMutedFg}33`,
      "scrollbarSlider.hoverBackground": `${darkMutedFg}55`,
      "scrollbarSlider.activeBackground": `${darkMutedFg}77`,
      "minimap.background": isDark ? darkBg : "#081316",
      "focusBorder": darkPrimary,
      "inputValidation.errorBorder": darkDestructive,
    },
  });

  themesDefined = true;
}

/** Ensure themes exist; re-define when CSS vars may have changed (theme toggle). */
export function refreshMcslMonacoThemes(monaco: typeof Monaco) {
  defineMcslMonacoThemes(monaco);
}

/**
 * Warm Monaco (loader + editor main + workers). Safe to call early (files tab).
 * Pass locale before first init so NLS packs apply via globalThis.
 */
export function preloadMonaco(locale?: LocaleCode): Promise<typeof Monaco> {
  configureMonacoLoader(locale);
  if (!initPromise) {
    const nls = locale ? monacoNlsFromLocale(locale) : lastNls ?? "";
    initPromise = (async () => {
      await ensureNlsGlobals(nls);
      // Re-apply path config after NLS (in case nothing configured yet on first call).
      configureMonacoLoader(locale);
      const monaco = await loader.init();
      if (!themesDefined) defineMcslMonacoThemes(monaco);
      return monaco;
    })().catch(async (err) => {
      console.warn("[monaco] init failed, retrying plain CDN", err);
      initPromise = null;
      configured = false;
      lastNls = "";
      loader.config({ paths: { vs: MONACO_VS_CDN } });
      configured = true;
      const monaco = await loader.init();
      if (!themesDefined) defineMcslMonacoThemes(monaco);
      initPromise = Promise.resolve(monaco);
      return monaco;
    });
  }
  return initPromise;
}

export function ensureMonacoReady(locale?: LocaleCode) {
  return preloadMonaco(locale);
}

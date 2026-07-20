"use client";

import { useEffect, useRef } from "react";
import { Terminal, type ITheme } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { cn } from "@/lib/utils";

export type PtyTerminalHandle = {
  write: (data: string) => void;
  clear: () => void;
  focus: () => void;
  fit: () => void;
  cols: () => number;
  rows: () => number;
};

type Props = {
  active: boolean;
  /** Soft-gate network send only; terminal stays focusable */
  disabled?: boolean;
  /**
   * Local echo for hosts that do not echo stdin.
   * PTY (forkpty) already echoes — default off to avoid doubled input.
   * Enable only for rare non-echoing pipe-like sessions hosted in xterm.
   */
  localEcho?: boolean;
  className?: string;
  onData: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
  onReady?: (handle: PtyTerminalHandle) => void;
};

/** Resolve any CSS color string to #rrggbb for xterm canvas paints. */
function resolveToHex(input: string, fallback: string): string {
  const raw = (input || "").trim();
  if (!raw) return fallback;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) {
    if (raw.length === 4) {
      return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
    }
    return raw.slice(0, 7).toLowerCase();
  }
  if (typeof document === "undefined") return fallback;
  try {
    const el = document.createElement("div");
    el.style.color = raw;
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    const computed = getComputedStyle(el).color;
    document.body.removeChild(el);
    const m = computed.match(
      /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i,
    );
    if (!m) return fallback;
    const toHex = (n: string) =>
      Math.max(0, Math.min(255, Math.round(Number(n))))
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`;
  } catch {
    return fallback;
  }
}

function cssVarHex(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return resolveToHex(value, fallback);
}

/**
 * Hex-only theme. Invalid CSS in theme (color-mix/oklch) makes xterm paint black cells.
 * ANSI palette is explicit so SGR colors actually highlight.
 */
function buildShadcnXtermTheme(): ITheme {
  const isDark = document.documentElement.classList.contains("dark");
  const bg = cssVarHex("--muted", isDark ? "#15262c" : "#eef7f5");
  const fg = cssVarHex("--foreground", isDark ? "#e6f4f2" : "#0b2430");
  const mutedFg = cssVarHex(
    "--muted-foreground",
    isDark ? "#8fc9c2" : "#3f6b6a",
  );
  const primary = cssVarHex("--primary", "#1dbf9a");
  const primaryFg = cssVarHex("--primary-foreground", "#ffffff");
  const destructive = resolveToHex(
    cssVarHex("--destructive", isDark ? "#ff6b6b" : "#e11d48"),
    isDark ? "#ff6b6b" : "#e11d48",
  );
  const card = cssVarHex("--card", isDark ? "#0f1c20" : "#ffffff");
  const chart2 = cssVarHex("--chart-2", "#4aa0d8");
  const chart3 = cssVarHex("--chart-3", "#2fd4c0");

  return {
    background: bg,
    foreground: fg,
    cursor: primary,
    cursorAccent: primaryFg,
    // Solid hex only — 8-digit alpha confuses some canvas paths
    selectionBackground: isDark ? "#2a5f58" : "#b7e8dc",
    selectionForeground: fg,
    // Match terminal surface so SGR 40 / inverse "black" never paints a pure void bar
    // under typed text (common with jline / PTY local attributes).
    black: bg,
    red: destructive,
    green: isDark ? "#3dd68c" : "#0d9f6e",
    yellow: isDark ? "#e8c547" : "#b8860b",
    blue: chart2,
    magenta: isDark ? "#c792ea" : "#7c3aed",
    cyan: chart3,
    white: isDark ? "#e6f4f2" : fg,
    brightBlack: isDark ? "#5a7a78" : mutedFg,
    brightRed: isDark ? "#ff8a8a" : "#f43f5e",
    brightGreen: primary,
    brightYellow: isDark ? "#f0d78c" : "#ca8a04",
    brightBlue: isDark ? "#7ec8ff" : "#2563eb",
    brightMagenta: isDark ? "#d4a5f5" : "#8b5cf6",
    brightCyan: isDark ? "#5eead4" : "#0891b2",
    brightWhite: fg,
  };
}

/** Echo printable input locally (Minecraft/jline often do not echo). */
function echoLocally(term: Terminal, data: string) {
  if (data === "\r") {
    term.write("\r\n");
    return;
  }
  if (data === "\u007f" || data === "\b") {
    term.write("\b \b");
    return;
  }
  if (data.startsWith("\x1b")) return;
  if (data === "\t" || /^[\x20-\x7e\u00a0-\uffff]+$/u.test(data)) {
    term.write(data);
  }
}

/** xterm@6 FitAddon crashes if renderer is not ready (Strict Mode / 0-size host). */
function hasRenderer(term: Terminal | null | undefined): boolean {
  if (!term?.element) return false;
  try {
    const core = (term as unknown as { _core?: { _renderService?: { _renderer?: { value?: unknown } } } })
      ._core;
    return Boolean(core?._renderService?._renderer?.value);
  } catch {
    return false;
  }
}

function hostHasSize(host: HTMLElement | null | undefined): boolean {
  if (!host?.isConnected) return false;
  const rect = host.getBoundingClientRect();
  return rect.width >= 2 && rect.height >= 2;
}

function safeFit(
  term: Terminal | null | undefined,
  fit: FitAddon | null | undefined,
  host: HTMLElement | null | undefined,
): boolean {
  if (!term || !fit || !hostHasSize(host) || !hasRenderer(term)) return false;
  try {
    fit.fit();
    return true;
  } catch {
    return false;
  }
}

function safeRefresh(term: Terminal | null | undefined) {
  if (!term || !hasRenderer(term)) return;
  try {
    term.refresh(0, Math.max(0, term.rows - 1));
  } catch {
    // disposed / mid-open
  }
}

/**
 * Interactive xterm for Daemon ConsoleMode.Pty.
 */
export function PtyTerminal({
  active,
  disabled = false,
  localEcho = false,
  className,
  onData,
  onResize,
  onReady,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const onDataRef = useRef(onData);
  const onResizeRef = useRef(onResize);
  const onReadyRef = useRef(onReady);
  const disabledRef = useRef(disabled);
  const localEchoRef = useRef(localEcho);
  onDataRef.current = onData;
  onResizeRef.current = onResize;
  onReadyRef.current = onReady;
  disabledRef.current = disabled;
  localEchoRef.current = localEcho;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let ro: ResizeObserver | null = null;
    let raf1 = 0;
    let raf2 = 0;
    let retryTimer: number | undefined;

    const term = new Terminal({
      convertEol: true,
      cursorBlink: true,
      cursorStyle: "bar",
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 13,
      lineHeight: 1.35,
      letterSpacing: 0,
      scrollback: 8000,
      // FitAddon reserves ~14px for overview ruler by default; keep gutter thin.
      overviewRuler: { width: 0 },
      // Full ANSI / ECMA-48 SGR rendering (16 / 256 / truecolor via xterm).
      theme: buildShadcnXtermTheme(),
      allowProposedApi: true,
      allowTransparency: false,
      disableStdin: false,
      drawBoldTextInBrightColors: true,
      // Keep OSC 8 hyperlinks for WebLinksAddon; leave other sequences to parser.
      screenReaderMode: false,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(host);
    termRef.current = term;
    fitRef.current = fit;

    const dataDisp = term.onData((data) => {
      if (disabledRef.current) return;
      if (localEchoRef.current) {
        echoLocally(term, data);
      }
      onDataRef.current(data);
    });

    const resizeDisp = term.onResize(({ cols, rows }) => {
      if (disposed) return;
      onResizeRef.current?.(cols, rows);
    });

    const runFit = () => safeFit(term, fit, host);

    const handle: PtyTerminalHandle = {
      write: (data) => {
        if (disposed || !hasRenderer(term)) return;
        try {
          term.write(data);
        } catch {
          // ignore
        }
      },
      clear: () => {
        if (disposed || !hasRenderer(term)) return;
        try {
          term.clear();
          term.options.theme = buildShadcnXtermTheme();
        } catch {
          // ignore
        }
      },
      focus: () => {
        if (disposed) return;
        try {
          term.focus();
        } catch {
          // ignore
        }
      },
      fit: () => {
        if (disposed) return;
        runFit();
      },
      cols: () => term.cols,
      rows: () => term.rows,
    };

    const applyTheme = () => {
      if (disposed || !hasRenderer(term)) return;
      try {
        term.options.theme = buildShadcnXtermTheme();
        safeRefresh(term);
      } catch {
        // ignore
      }
    };

    const themeObserver = new MutationObserver(() => {
      if (disposed) return;
      applyTheme();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    const attachResizeObserver = () => {
      if (disposed || ro) return;
      ro = new ResizeObserver(() => {
        if (disposed) return;
        // Defer: RO often fires while layout is still 0 or mid-dispose.
        raf2 = window.requestAnimationFrame(() => {
          if (disposed) return;
          runFit();
        });
      });
      ro.observe(host);
    };

    const finishInit = () => {
      if (disposed) return;
      applyTheme();
      const ok = runFit();
      attachResizeObserver();
      onReadyRef.current?.(handle);
      if (active) {
        try {
          term.focus();
        } catch {
          // ignore
        }
      }
      // Host may still be 0×0 on first paint (flex tab); retry briefly.
      if (!ok) {
        let attempts = 0;
        const tick = () => {
          if (disposed) return;
          attempts += 1;
          if (runFit() || attempts >= 20) return;
          retryTimer = window.setTimeout(tick, 50);
        };
        retryTimer = window.setTimeout(tick, 50);
      }
    };

    // Double rAF: wait for xterm open + layout so _renderer.value exists.
    raf1 = window.requestAnimationFrame(() => {
      if (disposed) return;
      raf2 = window.requestAnimationFrame(finishInit);
    });

    return () => {
      disposed = true;
      themeObserver.disconnect();
      ro?.disconnect();
      ro = null;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      dataDisp.dispose();
      resizeDisp.dispose();
      try {
        term.dispose();
      } catch {
        // ignore
      }
      termRef.current = null;
      fitRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const term = termRef.current;
    if (!term || !hasRenderer(term)) return;
    if (!disabled && active) {
      try {
        term.focus();
      } catch {
        // ignore
      }
    }
  }, [disabled, active]);

  useEffect(() => {
    if (!active) return;
    const term = termRef.current;
    const fit = fitRef.current;
    const host = hostRef.current;
    const id = window.requestAnimationFrame(() => {
      safeFit(term, fit, host);
      if (hasRenderer(term)) {
        try {
          term?.focus();
        } catch {
          // ignore
        }
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [active]);

  return (
    <div
      ref={hostRef}
      className={cn(
        "mcsl-xterm min-h-[12rem] h-full w-full",
        className,
      )}
      data-slot="pty-terminal"
      onMouseDown={() => {
        const term = termRef.current;
        if (hasRenderer(term)) {
          try {
            term?.focus();
          } catch {
            // ignore
          }
        }
      }}
    />
  );
}

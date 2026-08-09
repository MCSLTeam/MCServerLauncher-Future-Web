import type { CSSProperties, ReactNode } from "react";
import { Fragment } from "react";

export const LOG_LINE_CAP = 5000;

export function appendLogLines(
  prev: string[],
  incoming: string | string[],
): string[] {
  const next = Array.isArray(incoming)
    ? [...prev, ...incoming]
    : [...prev, incoming];
  if (next.length <= LOG_LINE_CAP) return next;
  return next.slice(next.length - LOG_LINE_CAP);
}

/** Classic 16-color ANSI palette (dark-terminal friendly, hex only). */
const ANSI_FG: Record<number, string> = {
  30: "#6b7280",
  31: "#ef4444",
  32: "#22c55e",
  33: "#eab308",
  34: "#3b82f6",
  35: "#a855f7",
  36: "#06b6d4",
  37: "#e5e7eb",
  90: "#9ca3af",
  91: "#f87171",
  92: "#4ade80",
  93: "#facc15",
  94: "#60a5fa",
  95: "#c084fc",
  96: "#22d3ee",
  97: "#ffffff",
};

const ANSI_BG: Record<number, string> = {
  40: "#111827",
  41: "#7f1d1d",
  42: "#14532d",
  43: "#713f12",
  44: "#1e3a8a",
  45: "#581c87",
  46: "#155e75",
  47: "#d1d5db",
  100: "#374151",
  101: "#991b1b",
  102: "#166534",
  103: "#a16207",
  104: "#1d4ed8",
  105: "#7e22ce",
  106: "#0e7490",
  107: "#f3f4f6",
};

type AnsiStyle = {
  color?: string;
  backgroundColor?: string;
  fontWeight?: "bold";
  fontStyle?: "italic";
  textDecoration?: "underline";
  opacity?: number;
};

type AnsiSpan = { text: string; style: AnsiStyle };

/**
 * Parse ECMA-48 CSI SGR sequences into styled spans.
 * Supports: 0/1/3/4, 30–37/90–97, 40–47/100–107, 38/48 ;5;n, 38/48 ;2;r;g;b.
 * Other CSI / OSC are stripped so raw ESC junk does not show in pipe logs.
 */
export function parseAnsiToSpans(input: string): AnsiSpan[] {
  if (!input) return [];

  // Drop OSC (ESC ] ... BEL/ST) and non-SGR CSI so only text + SGR remain.
  let text = input
    .replace(/\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g, "")
    .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, (m) => (m.endsWith("m") ? m : ""));

  const spans: AnsiSpan[] = [];
  let style: AnsiStyle = {};
  let buf = "";

  const flush = () => {
    if (!buf) return;
    spans.push({ text: buf, style: { ...style } });
    buf = "";
  };

  const applySgr = (params: number[]) => {
    if (params.length === 0) {
      style = {};
      return;
    }
    let i = 0;
    while (i < params.length) {
      const p = params[i] ?? 0;
      if (p === 0) {
        style = {};
      } else if (p === 1) {
        style = { ...style, fontWeight: "bold" };
      } else if (p === 2) {
        style = { ...style, opacity: 0.75 };
      } else if (p === 3) {
        style = { ...style, fontStyle: "italic" };
      } else if (p === 4) {
        style = { ...style, textDecoration: "underline" };
      } else if (p === 22) {
        const next = { ...style };
        delete next.fontWeight;
        delete next.opacity;
        style = next;
      } else if (p === 23) {
        const next = { ...style };
        delete next.fontStyle;
        style = next;
      } else if (p === 24) {
        const next = { ...style };
        delete next.textDecoration;
        style = next;
      } else if (p === 39) {
        const next = { ...style };
        delete next.color;
        style = next;
      } else if (p === 49) {
        const next = { ...style };
        delete next.backgroundColor;
        style = next;
      } else if ((p >= 30 && p <= 37) || (p >= 90 && p <= 97)) {
        style = { ...style, color: ANSI_FG[p] };
      } else if ((p >= 40 && p <= 47) || (p >= 100 && p <= 107)) {
        style = { ...style, backgroundColor: ANSI_BG[p] };
      } else if (p === 38 || p === 48) {
        const isFg = p === 38;
        const mode = params[i + 1];
        if (mode === 5 && params[i + 2] != null) {
          const color = ansi256ToHex(params[i + 2]!);
          style = isFg
            ? { ...style, color }
            : { ...style, backgroundColor: color };
          i += 2;
        } else if (
          mode === 2 &&
          params[i + 2] != null &&
          params[i + 3] != null &&
          params[i + 4] != null
        ) {
          const color = rgbToHex(
            params[i + 2]!,
            params[i + 3]!,
            params[i + 4]!,
          );
          style = isFg
            ? { ...style, color }
            : { ...style, backgroundColor: color };
          i += 4;
        }
      }
      i += 1;
    }
  };

  const re = /\u001b\[([0-9;]*)m/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) != null) {
    if (match.index > last) {
      buf += text.slice(last, match.index);
      flush();
    }
    const params = match[1]
      ? match[1].split(";").map((n) => {
          const v = Number(n);
          return Number.isFinite(v) ? v : 0;
        })
      : [0];
    applySgr(params);
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    buf += text.slice(last);
    flush();
  }
  return spans.length > 0
    ? spans
    : [{ text: input.replace(/\u001b\[[0-9;]*m/g, ""), style: {} }];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
}

/** xterm 256-color cube + grayscale. */
function ansi256ToHex(n: number): string {
  const code = Math.max(0, Math.min(255, Math.floor(n)));
  if (code < 16) {
    const map = [
      "#000000",
      "#cd0000",
      "#00cd00",
      "#cdcd00",
      "#0000ee",
      "#cd00cd",
      "#00cdcd",
      "#e5e5e5",
      "#7f7f7f",
      "#ff0000",
      "#00ff00",
      "#ffff00",
      "#5c5cff",
      "#ff00ff",
      "#00ffff",
      "#ffffff",
    ];
    return map[code]!;
  }
  if (code >= 232) {
    const v = 8 + (code - 232) * 10;
    return rgbToHex(v, v, v);
  }
  const idx = code - 16;
  const r = Math.floor(idx / 36);
  const g = Math.floor((idx % 36) / 6);
  const b = idx % 6;
  const levels = [0, 95, 135, 175, 215, 255];
  return rgbToHex(levels[r]!, levels[g]!, levels[b]!);
}

function styleToCss(style: AnsiStyle): CSSProperties | undefined {
  if (
    !style.color &&
    !style.backgroundColor &&
    !style.fontWeight &&
    !style.fontStyle &&
    !style.textDecoration &&
    style.opacity == null
  ) {
    return undefined;
  }
  return {
    color: style.color,
    backgroundColor: style.backgroundColor,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textDecoration: style.textDecoration,
    opacity: style.opacity,
  };
}

/** Render a single string (may contain ANSI) as React nodes. */
export function renderAnsiText(text: string, keyPrefix = "a"): ReactNode {
  const spans = parseAnsiToSpans(text);
  return spans.map((span, i) => {
    const css = styleToCss(span.style);
    if (!css) {
      return <Fragment key={`${keyPrefix}-${i}`}>{span.text}</Fragment>;
    }
    return (
      <span key={`${keyPrefix}-${i}`} style={css}>
        {span.text}
      </span>
    );
  });
}

/**
 * Pipe console: render log lines with real ANSI/SGR highlighting.
 * Lines without escape codes stay default foreground.
 */
export function renderLogLines(logs: string[]): ReactNode {
  if (logs.length === 0) return null;
  return logs.map((line, index) => (
    <Fragment key={`${index}:${line.slice(0, 24)}`}>
      {renderAnsiText(line, `L${index}`)}
      {index < logs.length - 1 ? "\n" : null}
    </Fragment>
  ));
}

export function formatUnixSeconds(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "—";
  try {
    return new Date(seconds * 1000).toLocaleString();
  } catch {
    return "—";
  }
}

/**
 * Daemon file meta times are ISO-8601 DateTimeOffset strings.
 * WPF converts to Unix seconds client-side; web previously used Number(iso) → NaN.
 */
export function parseDaemonTimestamp(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    // Heuristic: ms since epoch vs seconds.
    return value > 1e12 ? Math.floor(value / 1000) : Math.floor(value);
  }
  const text = String(value).trim();
  if (!text) return undefined;
  if (/^\d+(\.\d+)?$/.test(text)) {
    const numeric = Number(text);
    if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
    return numeric > 1e12 ? Math.floor(numeric / 1000) : Math.floor(numeric);
  }
  const ms = Date.parse(text);
  if (!Number.isFinite(ms) || ms <= 0) return undefined;
  return Math.floor(ms / 1000);
}

export function playerDisplayName(player: unknown): string {
  if (player == null) return "—";
  if (typeof player === "string") return player;
  if (typeof player === "object") {
    const record = player as Record<string, unknown>;
    return String(
      record.name ??
        record.Name ??
        record.username ??
        record.Username ??
        record.uuid ??
        record.Uuid ??
        "—",
    );
  }
  return String(player);
}

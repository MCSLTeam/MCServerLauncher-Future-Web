import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

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

function toneForLine(line: string): string {
  const lower = line.toLowerCase();
  if (
    lower.includes("[error]") ||
    lower.includes("/error") ||
    lower.includes(" exception") ||
    lower.includes("severe") ||
    lower.includes("fatal")
  ) {
    return "text-destructive";
  }
  if (
    lower.includes("[warn]") ||
    lower.includes("/warn") ||
    lower.includes("warning")
  ) {
    return "text-amber-600 dark:text-amber-400";
  }
  if (
    lower.includes("[info]") ||
    lower.includes("/info") ||
    lower.includes("[done]")
  ) {
    return "text-sky-700 dark:text-sky-300";
  }
  if (lower.includes("[debug]") || lower.includes("/debug")) {
    return "text-muted-foreground";
  }
  return "text-foreground/90";
}

export function renderLogLines(logs: string[]): ReactNode {
  if (logs.length === 0) return null;
  return logs.map((line, index) => (
    <span key={`${index}:${line.slice(0, 24)}`} className={cn(toneForLine(line))}>
      {line}
      {index < logs.length - 1 ? "\n" : null}
    </span>
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

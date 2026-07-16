/** 对齐 WPF CreateInstanceValidation — 错误文案经 tKey 国际化 */

import { tKey } from "@/lib/i18n/translate";

const INVALID_NAME = /[<>:"/\\|?*\u0000-\u001f]/;

export function normalizeString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  return String(value ?? "").trim();
}

export function tryValidateInstanceName(
  name: string,
): { ok: true } | { ok: false; error: string } {
  const value = normalizeString(name);
  if (!value) return { ok: false, error: tKey("shared.create.validation.name.empty") };
  if (value === "." || value === "..") {
    return { ok: false, error: tKey("shared.create.validation.name.dot") };
  }
  if (INVALID_NAME.test(value)) {
    return { ok: false, error: tKey("shared.create.validation.name.invalid") };
  }
  return { ok: true };
}

export function tryValidateJavaPath(
  path: string,
): { ok: true } | { ok: false; error: string } {
  const value = normalizeString(path);
  if (!value) return { ok: false, error: tKey("shared.create.validation.java.empty") };
  // WPF 展示串: "(ver, arch) path"
  if (value.startsWith("(") && value.includes(") ")) {
    return { ok: false, error: tKey("shared.create.validation.java.display") };
  }
  return { ok: true };
}

export function tryValidateLocalJarFile(
  file: File | null,
): { ok: true } | { ok: false; error: string } {
  if (!file) return { ok: false, error: tKey("shared.create.validation.jar.empty") };
  if (!file.name.toLowerCase().endsWith(".jar")) {
    return { ok: false, error: tKey("shared.create.validation.jar.ext") };
  }
  return { ok: true };
}

export function tryValidateLoaderVersion(
  mcVersion: string,
  loaderVersion: string,
): { ok: true } | { ok: false; error: string } {
  if (!normalizeString(mcVersion) || !normalizeString(loaderVersion)) {
    return { ok: false, error: tKey("shared.create.validation.loader") };
  }
  return { ok: true };
}

export function parseJvmArgs(raw: string): string[] {
  const text = raw.trim();
  if (!text) return [];
  // 简单按空白拆分，支持引号内空格
  const result: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (current) {
        result.push(current);
        current = "";
      }
      continue;
    }
    current += ch;
  }
  if (current) result.push(current);
  return result;
}

import { translate } from "@/lib/i18n/translate";
import type { LocaleCode } from "@/lib/i18n/types";

function stripFrontmatter(markdown: string): string {
  const text = markdown.replace(/^\uFEFF/, "");
  if (!text.startsWith("---")) return text.trim();
  const end = text.indexOf("\n---", 3);
  if (end === -1) return text.trim();
  return text.slice(end + 4).trim();
}

async function fetchText(
  url: string,
  timeoutMs = 5000,
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    window.clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** GitHub → mirror → 内置 shared.eula.content */
export async function loadEulaContent(locale: LocaleCode): Promise<string> {
  const url = translate(locale, "shared.eula.url");
  const mirror = translate(locale, "shared.eula.mirror");
  const builtin = translate(locale, "shared.eula.content");

  if (url && !url.startsWith("shared.")) {
    const remote = await fetchText(url);
    if (remote) return stripFrontmatter(remote);
  }
  if (mirror && !mirror.startsWith("shared.")) {
    const remote = await fetchText(mirror);
    if (remote) return stripFrontmatter(remote);
  }
  if (builtin && !builtin.startsWith("shared.")) {
    return stripFrontmatter(builtin);
  }
  return "";
}

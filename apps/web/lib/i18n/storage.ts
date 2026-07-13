import type { LocalePreference } from "@/lib/i18n/types";

const KEY = "locale";

export function readLocalePreference(): LocalePreference {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(KEY);
  if (!value) return "system";
  return value as LocalePreference;
}

export function writeLocalePreference(locale: LocalePreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, locale);
}

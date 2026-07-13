export const LOCALES = [
  "en-US",
  "ja-JP",
  "ru-RU",
  "zh-CN",
  "zh-TW",
  "zh-HK",
  "zh-MEME",
] as const;

export type LocaleCode = (typeof LOCALES)[number];
export type LocalePreference = LocaleCode | "system";

export type Messages = Record<string, unknown>;

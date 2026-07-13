import type { LocaleCode, Messages } from "@/lib/i18n/types";
import { LOCALES } from "@/lib/i18n/types";

import enUS from "@repo/locales/locales/en-US.json";
import jaJP from "@repo/locales/locales/ja-JP.json";
import ruRU from "@repo/locales/locales/ru-RU.json";
import zhCN from "@repo/locales/locales/zh-CN.json";
import zhTW from "@repo/locales/locales/zh-TW.json";
import zhHK from "@repo/locales/locales/zh-HK.json";
import zhMEME from "@repo/locales/locales/zh-MEME.json";

import eulaEnUS from "@repo/locales/eula/en-US.json";
import eulaJaJP from "@repo/locales/eula/ja-JP.json";
import eulaRuRU from "@repo/locales/eula/ru-RU.json";
import eulaZhCN from "@repo/locales/eula/zh-CN.json";
import eulaZhTW from "@repo/locales/eula/zh-TW.json";
import eulaZhHK from "@repo/locales/eula/zh-HK.json";
import eulaZhMEME from "@repo/locales/eula/zh-MEME.json";

function mergeEula(base: Messages, eula: Messages): Messages {
  const shared = (base.shared as Messages | undefined) ?? {};
  const sharedEula = (shared.eula as Messages | undefined) ?? {};
  return {
    ...base,
    shared: {
      ...shared,
      eula: {
        ...sharedEula,
        ...eula,
      },
    },
  };
}

const raw: Record<LocaleCode, Messages> = {
  "en-US": enUS as Messages,
  "ja-JP": jaJP as Messages,
  "ru-RU": ruRU as Messages,
  "zh-CN": zhCN as Messages,
  "zh-TW": zhTW as Messages,
  "zh-HK": zhHK as Messages,
  "zh-MEME": zhMEME as Messages,
};

const eulas: Record<LocaleCode, Messages> = {
  "en-US": eulaEnUS as Messages,
  "ja-JP": eulaJaJP as Messages,
  "ru-RU": eulaRuRU as Messages,
  "zh-CN": eulaZhCN as Messages,
  "zh-TW": eulaZhTW as Messages,
  "zh-HK": eulaZhHK as Messages,
  "zh-MEME": eulaZhMEME as Messages,
};

export const MESSAGE_CATALOG: Record<LocaleCode, Messages> = Object.fromEntries(
  LOCALES.map((locale) => [locale, mergeEula(raw[locale], eulas[locale])]),
) as Record<LocaleCode, Messages>;

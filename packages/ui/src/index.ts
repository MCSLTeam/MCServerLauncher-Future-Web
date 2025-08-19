import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import { useLocale, useTheme } from "./utils/stores.ts";
import { setLocale } from "yup";
import { getYupLocale } from "./utils/yup.ts";
import type { Composer } from "vue-i18n";

dayjs.extend(RelativeTime);
dayjs.locale("zh-cn");

export function loadUi(i18n: Composer) {
  useLocale().injectI18n(i18n);
  setLocale(getYupLocale());
  useTheme().load();
}

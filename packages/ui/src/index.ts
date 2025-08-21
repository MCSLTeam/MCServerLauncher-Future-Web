import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import { useTheme } from "./utils/stores.ts";
import { setLocale } from "yup";
import { getYupLocale } from "./utils/yup.ts";
import "./assets/css/style.scss";

dayjs.extend(RelativeTime);
dayjs.locale("zh-cn");

export function loadUi() {
  setLocale(getYupLocale());
  useTheme().load();
}

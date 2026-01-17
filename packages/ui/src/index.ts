import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import { useMousePosition, useTheme } from "./utils/stores.ts";
import { setLocale } from "yup";
import { getYupLocale } from "./utils/yup.ts";
import "./assets/css/style.scss";
import { requestNotifPermission } from "./utils/notifications.ts";

dayjs.extend(RelativeTime);
dayjs.locale("zh-cn");

export async function loadUi() {
  setLocale(getYupLocale());
  useTheme().load();
  document.removeEventListener("mousemove", useMousePosition().onMouseMove);
  document.addEventListener("mousemove", useMousePosition().onMouseMove);

  await requestNotifPermission();
}

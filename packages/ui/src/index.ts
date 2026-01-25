import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import { useAppearance, useMousePosition } from "./utils/stores.ts";
import { setLocale } from "yup";
import { getYupLocale } from "./utils/yup.ts";
import "./assets/css/style.scss";
import { requestNotifPermission } from "./utils/notifications.ts";

dayjs.extend(RelativeTime);
dayjs.locale("zh-cn");

export async function loadUi() {
  setLocale(getYupLocale());
  useAppearance().load();
  document.removeEventListener("mousemove", useMousePosition().onMouseMove);
  document.addEventListener("mousemove", useMousePosition().onMouseMove);

  const onUserInteraction = () => {
    requestNotifPermission();
    document.removeEventListener("click", onUserInteraction);
  };

  document.addEventListener("click", onUserInteraction);
}

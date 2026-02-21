import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import { useAppearance, useMousePosition } from "./utils/stores.ts";
import { setLocale } from "yup";
import { getYupLocale } from "./utils/yup.ts";
import "./assets/css/style.scss";
import { requestNotifPermission } from "./utils/notifications.ts";
import { isDragging } from "./utils/upload.ts";

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

  let dragTimeout = -1;

  window.addEventListener("dragover", () => {
    clearTimeout(dragTimeout);
    isDragging.value = true;
  });

  window.addEventListener("dragleave", () => {
    clearTimeout(dragTimeout);
    dragTimeout = window.setTimeout(() => {
      isDragging.value = false;
    }, 100);
  });

  window.addEventListener("drop", () => {
    isDragging.value = false;
    clearTimeout(dragTimeout);
  });

  window.addEventListener("blur", () => {
    isDragging.value = false;
    clearTimeout(dragTimeout);
  });
}

import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import { useTheme } from "./utils/stores.ts";
import { setLocale } from "yup";
import { getYupLocale } from "./utils/yup.ts";
import "./assets/css/style.scss";
import { type Directive, inject, provide } from "vue";
import type { Size } from "./utils/types.ts";

dayjs.extend(RelativeTime);
dayjs.locale("zh-cn");

export function loadUi() {
  setLocale(getYupLocale());
  useTheme().load();
}

export const vSizeDirective: Directive<any, Size> = {
  mounted(el, binding) {
    let size = binding.value;
    const parentSize = inject("size", "middle") as Size;
    if (size == "smaller") {
      if (parentSize === "large") size = "middle";
      else if (parentSize === "middle") size = "small";
    } else if (size === "larger") {
      if (parentSize === "small") size = "middle";
      else if (parentSize === "middle") size = "large";
    }
    provide("size", size);
    el.classList.add(`mcsl-size-${size}`);
  },
};

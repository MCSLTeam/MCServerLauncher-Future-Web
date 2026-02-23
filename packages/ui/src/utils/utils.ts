import { type RouteLocationRaw, type Router } from "vue-router";
import type { Dayjs } from "dayjs";
import { useLocale } from "./stores.ts";
import { computed, type ComputedRef, ref, type Ref, watch } from "vue";

export type Size = "small" | "medium" | "large";

export type PosInfo = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PageNavigationInfo = {
  label: string;
  link?: RouteLocationRaw | string;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  icon?: string;
  isSubpage?: (path: string) => boolean;
};

export async function navigateTo(info: PageNavigationInfo, router: Router) {
  if (info.disabled) return;
  if (info.link) await router.push(info.link);
  if (info.onClick) await info.onClick();
}

export function throttle(callback: (...args: any[]) => void, interval: number) {
  let doThrottle = false;
  return function (...args: any[]) {
    if (doThrottle) return;
    doThrottle = true;
    setTimeout(() => {
      callback(...args);
      doThrottle = false;
    }, interval);
  };
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randNum(min?: number, max?: number) {
  if (min != undefined && max != undefined)
    return Math.floor(Math.random() * (max - min)) + min; // 含最小值，不含最大值
  else if (min != undefined) return randNum(0, min);
  else return Math.random();
}

export function animatedVisibilityExists(
  visible: Ref<boolean> | ComputedRef<boolean>,
  animationDuration:
    | number
    | {
        in: number;
        out: number;
      },
  hooks?: {
    beforeShow?: () => void;
    afterShow?: () => void;
    beforeHide?: () => void;
    afterHide?: () => void;
  },
): {
  exist: Ref<boolean>;
  status: ComputedRef<"in" | "out" | "show" | "hide">;
} {
  const exist = ref(visible.value);
  const status = ref<"in" | "out" | "show" | "hide">(visible ? "show" : "hide");

  const duration =
    typeof animationDuration === "number"
      ? {
          in: animationDuration,
          out: animationDuration,
        }
      : animationDuration;

  let timeout = -1;
  watch(visible, (value) => {
    clearTimeout(timeout);
    if (value) {
      // open
      exist.value = true;
      status.value = "in";
      hooks?.beforeShow?.();
      if (hooks?.afterShow) {
        timeout = window.setTimeout(() => {
          status.value = "show";
          hooks?.afterShow?.();
        }, duration.in);
      }
    } else {
      // close
      status.value = "out";
      hooks?.beforeHide?.();
      timeout = window.setTimeout(() => {
        exist.value = false;
        status.value = "hide";
        hooks?.afterHide?.();
      }, duration.out);
    }
  });
  return { exist, status: computed(() => status.value) };
}

export function formatDate(
  date: Dayjs,
  type: "datetime" | "date" | "time" = "datetime",
) {
  const t = useLocale().getI18n().t;
  return date.format(t(`dayjs.format.${type}`));
}

const sizeUnits = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"] as const;

export function humanReadableSize(bytes: number) {
  if (bytes == 0) return "0 " + sizeUnits[0];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizeUnits.length - 1,
  );
  const size = (bytes / Math.pow(1024, exponent)).toFixed(2);
  return `${size} ${sizeUnits[exponent]}`;
}

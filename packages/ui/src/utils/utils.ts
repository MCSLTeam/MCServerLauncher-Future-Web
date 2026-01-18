import { type RouteLocationRaw, useRouter } from "vue-router";

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
  onClick?: () => void;
  disabled?: boolean;
  icon?: string;
  isSubpage?: (path: string) => boolean;
};

export function navigateTo(info: PageNavigationInfo) {
  if (info.disabled) return;
  if (info.link) useRouter().push(info.link);
  if (info.onClick) info.onClick();
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

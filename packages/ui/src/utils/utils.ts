export type Size = "small" | "middle" | "large";

export type PosInfo = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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

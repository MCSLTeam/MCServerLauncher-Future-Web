import type { ColorType } from "./css.ts";

// Context menu
export let openContextmenu: (event: MouseEvent, props: any) => void = () => {};

export function setOpenContextmenu(
  fn: (event: MouseEvent, props: any) => void,
) {
  openContextmenu = fn;
}

// Meter group
export const colorMap = new Map<string, ColorType>();

import { loadUi } from "@repo/ui/src";

type Platform = "web" | "app";

let platform: Platform = "web";

export function getPlatform(): Platform {
  return platform;
}

export function load(p: Platform) {
  platform = p;
  loadUi();
}

const KEY = "first-load";

/** 与 Vue 版一致：本地 first-load 门闩，与后端 should-register 独立 */
export function isFirstLoad(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(KEY);
  // 缺省视为首次（与 useLocalStorage default true 一致）
  if (raw === null) return true;
  return raw === "true" || raw === "1";
}

export function setFirstLoad(value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, value ? "true" : "false");
}

export function markFirstLoadComplete(): void {
  setFirstLoad(false);
}

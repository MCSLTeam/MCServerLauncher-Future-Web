/**
 * 对齐 WPF FileManager 虚拟路径：
 * UI 虚拟路径以 `/` 开头（如 `/mods`），拼接后为 `/instances/{id}/mods`。
 *
 * Daemon 协议路径是相对 `daemon/` 根的，Unix 上前导 `/` 会被当成 OS 绝对路径
 * 并触发 `file.path.invalid`。因此发给 Daemon 前必须去掉前导 `/`。
 */

export function normalizeVirtualPath(path: string): string {
  const raw = path.trim() || "/";
  const parts = raw
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== ".");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return stack.length === 0 ? "/" : `/${stack.join("/")}`;
}

/** UI/WPF 风格真实路径（可带前导 `/`）。 */
export function getRealPath(rootPath: string, virtualPath: string): string {
  const root = normalizeVirtualPath(rootPath === "" ? "/" : rootPath);
  const virtual = normalizeVirtualPath(virtualPath);
  if (virtual === "/") return root;
  if (root === "/") return virtual;
  return `${root.replace(/\/+$/, "")}${virtual}`;
}

/**
 * 转为 Daemon `path` 参数：去掉前导 `/`，保留相对 `daemon/` 的片段。
 * 例：`/instances/{id}/mods` → `instances/{id}/mods`
 */
export function toDaemonPath(path: string): string {
  const normalized = path.replace(/\\/g, "/").trim();
  if (!normalized || normalized === "/") return "";
  const parts = normalized.split("/").filter((part) => part && part !== ".");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return stack.join("/");
}

export function parentVirtualPath(virtualPath: string): string {
  const virtual = normalizeVirtualPath(virtualPath);
  if (virtual === "/") return "/";
  const idx = virtual.lastIndexOf("/");
  if (idx <= 0) return "/";
  return virtual.slice(0, idx) || "/";
}

export function joinVirtualPath(base: string, name: string): string {
  const virtual = normalizeVirtualPath(base);
  if (virtual === "/") return normalizeVirtualPath(`/${name}`);
  return normalizeVirtualPath(`${virtual}/${name}`);
}

export function isMinecraftBoardType(type: string | undefined | null): boolean {
  const value = String(type ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (!value) return false;
  // 对齐 SupportsMinecraftBoardWidgets：Minecraft Java 服务端（非 proxy / utility）
  if (
    value === "universal" ||
    value === "steam_server" ||
    value.includes("bedrock") ||
    value.includes("terraria") ||
    value.includes("tshock") ||
    value.includes("bungee") ||
    value.includes("velocity") ||
    value.includes("waterfall") ||
    value.includes("travertine") ||
    value.includes("via_version") ||
    value.includes("viaversion") ||
    value.includes("geyser") ||
    value.includes("reforged") ||
    value.includes("nukkit") ||
    value.includes("pocketmine") ||
    value.includes("cloudburst") ||
    value.includes("frp")
  ) {
    return false;
  }
  return (
    value.startsWith("mc_") ||
    value.startsWith("mc") ||
    value.includes("minecraft") ||
    value.includes("forge") ||
    value.includes("fabric") ||
    value.includes("neoforge") ||
    value.includes("quilt") ||
    value.includes("paper") ||
    value.includes("spigot") ||
    value.includes("purpur") ||
    value.includes("bukkit") ||
    value.includes("vanilla")
  );
}

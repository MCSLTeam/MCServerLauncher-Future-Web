/** 对齐 WPF FileManager 虚拟路径：UI 为 `/mods`，真实为 `/instances/{id}/mods` */

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

export function getRealPath(rootPath: string, virtualPath: string): string {
  const virtual = normalizeVirtualPath(virtualPath);
  if (virtual === "/") return rootPath;
  return `${rootPath.replace(/\/+$/, "")}${virtual}`;
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

/* ========== [ Minecraft ]========== */
export const MCJE_MOD_CORES = [
  "fabric",
  "forge",
  "quilt",
  "neoforge",
  "legacy_fabric",
  "cleanroom",
] as const;
export type MCJEModCore = (typeof MCJE_MOD_CORES)[number];

export const MCJE_PLUGIN_CORES = [
  "sponge_vanilla",
  "craftbukkit",
  "spigot",
  "paper",
  "leaves",
  "leaf",
  "folia",
  "pufferfish",
  "purpur",
] as const;
export type MCJEPluginCore = (typeof MCJE_PLUGIN_CORES)[number];

export const MCJE_HYBRID_CORES = [
  "sponge_forge",
  "sponge_neo",
  "mohist", // TODO: 判断tenet
  "youer",
  "crucible",
  "taiyitist",
  "cat_server",
  "arclight",
] as const;
export type MCJEHybridCore = (typeof MCJE_HYBRID_CORES)[number];

export const MCJE_PROXY_CORES = [
  "bungeecord",
  "velocity",
  "waterfall",
  "viaproxy",
  "geyser",
] as const;
export type MCJEProxyCore = (typeof MCJE_PROXY_CORES)[number];

export const MCJE_CORES = [
  "vanilla",
  ...MCJE_MOD_CORES,
  ...MCJE_PLUGIN_CORES,
  ...MCJE_HYBRID_CORES,
  ...MCJE_PROXY_CORES,
] as const;
export type MCJECore = (typeof MCJE_CORES)[number];

export const MCBE_CORES = [
  "bedrock",
  "cloudburst",
  "nukkit",
  "pocketmine",
] as const;
export type MCBECore = (typeof MCBE_CORES)[number];

export const MC_CORES = [...MCJE_CORES, ...MCBE_CORES] as const;
export type MCCore = (typeof MC_CORES)[number];

/* ========== [ Terraria ]========== */
export const TERRARIA_CORES = ["terraria", "tshock"] as const;
export type TerrariaCore = (typeof TERRARIA_CORES)[number];

/* ========== [ 所有核心 ]========== */
export const CORES = [
  ...MC_CORES,
  ...TERRARIA_CORES,
  "frpc",
  "jar",
  "universal",
] as const;
export type Core = (typeof CORES)[number];

/* ========== [ 一些函数 ]========== */
export type MCLoaderType =
  | "mcje_vanilla"
  | "mcje_mod"
  | "mcje_plugin"
  | "mcje_hybrid"
  | "mcje_proxy"
  | "mcbe_vanilla"
  | "mcbe_plugin";

export function getMCLoaderType(core: MCCore): MCLoaderType {
  if (core == "vanilla") return "mcje_vanilla";
  if (core == "bedrock") return "mcbe_vanilla";
  if (MCJE_MOD_CORES.includes(core as any)) return "mcje_mod";
  if (MCJE_PLUGIN_CORES.includes(core as any)) return "mcje_plugin";
  if (MCJE_HYBRID_CORES.includes(core as any)) return "mcje_hybrid";
  if (MCJE_PROXY_CORES.includes(core as any)) return "mcje_proxy";
  if (MCBE_CORES.includes(core as any)) return "mcbe_plugin";
  throw new Error("Unknown mc instance type");
}

export type GameType = "mc" | "terraria" | "frpc" | "unknown";

export function getGame(core: Core): GameType {
  if (core == "frpc") return core;
  if (core == "universal" || core == "jar") return "unknown";

  if (MC_CORES.includes(core as any)) return "mc";
  if (TERRARIA_CORES.includes(core as any)) return "terraria";
  throw new Error("Unknown instance type");
}

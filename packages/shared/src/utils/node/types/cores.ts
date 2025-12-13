/* ========== [ Minecraft ]========== */
export type MCJEModCore =
  | "fabric"
  | "forge"
  | "quilt"
  | "neoforge"
  | "legacy_fabric"
  | "babric";
export const MCJE_MOD_CORES: MCJEModCore[] = [
  "fabric",
  "forge",
  "quilt",
  "neoforge",
  "legacy_fabric",
  "babric",
];

export type MCJEPluginCore =
  | "sponge_vanilla"
  | "craft_bukkit"
  | "spigot"
  | "paper"
  | "leaves"
  | "leaf"
  | "folia"
  | "pufferfish"
  | "pufferfish+"
  | "pufferfish_purpur"
  | "purpur";
export const MCJE_PLUGIN_CORES: MCJEPluginCore[] = [
  "sponge_vanilla",
  "craft_bukkit",
  "spigot",
  "paper",
  "leaves",
  "leaf",
  "folia",
  "pufferfish",
  "pufferfish+",
  "pufferfish_purpur",
  "purpur",
];

export type MCJEHybridCore =
  | "sponge_forge"
  | "sponge_neoforge"
  | "mohist"
  | "youer"
  | "thermos"
  | "crucible"
  | "taiyitist"
  | "cat_server"
  | "arclight"
  | "banner";
export const MCJE_HYBRID_CORES: MCJEHybridCore[] = [
  "sponge_forge",
  "sponge_neoforge",
  "mohist",
  "youer",
  "thermos",
  "crucible",
  "taiyitist",
  "cat_server",
  "arclight",
  "banner",
];

export type MCJEProxyCore =
  | "bungeecord"
  | "velocity"
  | "waterfall"
  | "viaversion"
  | "geyser";
export const MCJE_PROXY_CORES: MCJEProxyCore[] = [
  "bungeecord",
  "velocity",
  "waterfall",
  "viaversion",
  "geyser",
];

export type MCJECore =
  | "vanilla"
  | MCJEModCore
  | MCJEPluginCore
  | MCJEHybridCore
  | MCJEProxyCore;
export const MCJE_CORES: MCJECore[] = [
  "vanilla",
  ...MCJE_MOD_CORES,
  ...MCJE_PLUGIN_CORES,
  ...MCJE_HYBRID_CORES,
  ...MCJE_PROXY_CORES,
];

export type MCBECore = "bedrock" | "cloudburst" | "nukkit" | "pocketmine";
export const MCBE_CORES: MCBECore[] = [
  "bedrock",
  "cloudburst",
  "nukkit",
  "pocketmine",
];

export type MCCore = MCJECore | MCBECore;
export const MC_CORES: MCCore[] = [...MCJE_CORES, ...MCBE_CORES];

/* ========== [ Terraria ]========== */
export type TerrariaCore = "terraria" | "tshock" | "tdsm";
export const TERRARIA_CORES: TerrariaCore[] = ["terraria", "tshock", "tdsm"];

/* ========== [ Frp ]========== */
export type FrpCore = "mefrp" | "openfrp" | "locyanfrp" | "mossfrp" | "frpc";
export const FRP_CORES: FrpCore[] = [
  "mefrp",
  "openfrp",
  "locyanfrp",
  "mossfrp",
  "frpc",
];

/* ========== [ 所有核心 ]========== */
export type Core = MCCore | TerrariaCore | "cs2" | "palworld" | "unknown";
export const CORES: Core[] = [
  ...MC_CORES,
  ...TERRARIA_CORES,
  "cs2",
  "palworld",
  "unknown",
];

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

export type GameType = "mc" | "terraria" | "cs2" | "palworld" | "unknown";

export function getGame(core: Core): GameType {
  if (core == "cs2" || core == "palworld" || core == "unknown") return core;

  if (MC_CORES.includes(core as any)) return "mc";
  if (TERRARIA_CORES.includes(core as any)) return "terraria";
  throw new Error("Unknown instance type");
}

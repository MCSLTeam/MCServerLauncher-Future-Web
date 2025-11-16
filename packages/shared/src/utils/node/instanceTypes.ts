/* ========== [ Minecraft ]========== */
export type MCJEModInstanceType =
  | "fabric"
  | "forge"
  | "quilt"
  | "neoforge"
  | "legacy_fabric"
  | "babric";
export const MCJE_MOD_INST_TYPES: MCJEModInstanceType[] = [
  "fabric",
  "forge",
  "quilt",
  "neoforge",
  "legacy_fabric",
  "babric",
];

export type MCJEPluginInstanceType =
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
export const MCJE_PLUGIN_INST_TYPES: MCJEPluginInstanceType[] = [
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

export type MCJEHybridInstanceType =
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
export const MCJE_HYBRID_INST_TYPES: MCJEHybridInstanceType[] = [
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

export type MCJEProxyInstanceType =
  | "bungeecord"
  | "velocity"
  | "waterfall"
  | "viaversion"
  | "geyser";
export const MCJE_PROXY_INST_TYPES: MCJEProxyInstanceType[] = [
  "bungeecord",
  "velocity",
  "waterfall",
  "viaversion",
  "geyser",
];

export type MCJEInstanceType =
  | "vanilla"
  | MCJEModInstanceType
  | MCJEPluginInstanceType
  | MCJEHybridInstanceType
  | MCJEProxyInstanceType;
export const MCJE_INST_TYPES: MCJEInstanceType[] = [
  "vanilla",
  ...MCJE_MOD_INST_TYPES,
  ...MCJE_PLUGIN_INST_TYPES,
  ...MCJE_HYBRID_INST_TYPES,
  ...MCJE_PROXY_INST_TYPES,
];

export type MCBEInstanceType =
  | "bedrock"
  | "cloudburst"
  | "nukkit"
  | "pocketmine";
export const MCBE_INST_TYPES: MCBEInstanceType[] = [
  "bedrock",
  "cloudburst",
  "nukkit",
  "pocketmine",
];

export type MCInstanceType = MCJEInstanceType | MCBEInstanceType;
export const MC_INST_TYPES: MCInstanceType[] = [
  ...MCJE_INST_TYPES,
  ...MCBE_INST_TYPES,
];

/* ========== [ Terraria ]========== */
export type TerrariaInstanceType = "terraria" | "tshock" | "tdsm";
export const TERRARIA_INST_TYPES: TerrariaInstanceType[] = [
  "terraria",
  "tshock",
  "tdsm",
];

/* ========== [ Frp ]========== */
export type FrpInstanceType =
  | "mefrp"
  | "openfrp"
  | "locyanfrp"
  | "mossfrp"
  | "frpc";
export const FRP_INST_TYPES: FrpInstanceType[] = [
  "mefrp",
  "openfrp",
  "locyanfrp",
  "mossfrp",
  "frpc",
];

/* ========== [ Instance Type ]========== */
export type InstanceType =
  | MCInstanceType
  | TerrariaInstanceType
  | "cs2"
  | "palworld"
  | "unknown";
export const INSTANCE_TYPES: InstanceType[] = [
  ...MC_INST_TYPES,
  ...TERRARIA_INST_TYPES,
  "cs2",
  "palworld",
  "unknown",
];

/* ========== [ Functions ]========== */
export type MCLoaderType =
  | "mcje_vanilla"
  | "mcje_mod"
  | "mcje_plugin"
  | "mcje_hybrid"
  | "mcje_proxy"
  | "mcbe_vanilla"
  | "mcbe_plugin";

export function getMCLoaderType(instanceType: MCInstanceType): MCLoaderType {
  if (instanceType == "vanilla") return "mcje_vanilla";
  if (instanceType == "bedrock") return "mcbe_vanilla";
  if (MCJE_MOD_INST_TYPES.includes(instanceType as any)) return "mcje_mod";
  if (MCJE_PLUGIN_INST_TYPES.includes(instanceType as any))
    return "mcje_plugin";
  if (MCJE_HYBRID_INST_TYPES.includes(instanceType as any))
    return "mcje_hybrid";
  if (MCJE_PROXY_INST_TYPES.includes(instanceType as any)) return "mcje_proxy";
  if (MCBE_INST_TYPES.includes(instanceType as any)) return "mcbe_plugin";
  throw new Error("Unknown mc instance type");
}

export type GameType = "mc" | "terraria" | "cs2" | "palworld" | "unknown";

export function getGameType(instanceType: InstanceType): GameType {
  if (
    instanceType == "cs2" ||
    instanceType == "palworld" ||
    instanceType == "unknown"
  )
    return instanceType;

  if (MC_INST_TYPES.includes(instanceType as any)) return "mc";
  if (TERRARIA_INST_TYPES.includes(instanceType as any)) return "terraria";
  throw new Error("Unknown instance type");
}

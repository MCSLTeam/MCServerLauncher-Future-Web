/** 对齐 WPF PreCreateInstance + PreCreateMinecraftInstance 全量选项 */

/** 一级分类（含 WPF 中禁用的 FRP / 导入） */
export type CreateCategory =
  | "minecraft"
  | "frp"
  | "terraria"
  | "other"
  | "import";

/** 可出现在 UI 的具体类型键 */
export type CreateCoreType =
  // Minecraft
  | "mcje"
  | "forge"
  | "neoforge"
  | "fabric"
  | "quilt"
  | "mcbe"
  | "geyser"
  | "bungeecord"
  | "waterfall"
  | "velocity"
  | "travertine"
  // FRP（WPF 全部 FeatureNotReady）
  | "frpc"
  | "mefrp"
  | "locyanfrp"
  | "openfrp"
  | "mossfrp"
  // 其它
  | "terraria"
  | "universal"
  | "import";

/** Daemon 线协议 InstanceType（snake_case） */
export type InstanceTypeWire =
  | "mc_java"
  | "mc_forge"
  | "mc_neo_forge"
  | "mc_fabric"
  | "mc_quilt"
  | "mc_bedrock"
  | "mc_geyser"
  | "mc_bungee_cord"
  | "mc_waterfall"
  | "mc_velocity"
  | "mc_travertine"
  | "terraria"
  | "universal";

export type TargetTypeWire = "jar" | "script" | "executable";
export type SourceTypeWire = "none" | "archive" | "core" | "script";
export type MirrorWire = "none" | "bmcl_api";

export type CreateTypeMeta = {
  id: CreateCoreType;
  category: CreateCategory;
  /** 是否可进入设置步骤（对齐 WPF IsEnabled） */
  enabled: boolean;
  /**
   * 是否可向 Daemon 提交（对齐 WPF FinishSetup 已实现）。
   * enabled 且非 submittable = 可填表但实验性/未完成。
   */
  submittable: boolean;
  labelKey: string;
  descKey?: string;
};

export type CreateCategoryMeta = {
  id: CreateCategory;
  /** 分类本身是否可进入（import 在 WPF 禁用） */
  enabled: boolean;
  labelKey: string;
  descKey: string;
};

export const CREATE_CATEGORIES: CreateCategoryMeta[] = [
  {
    id: "minecraft",
    enabled: true,
    labelKey: "shared.create.category.minecraft.title",
    descKey: "shared.create.category.minecraft.desc",
  },
  {
    id: "frp",
    enabled: true,
    labelKey: "shared.create.category.frp.title",
    descKey: "shared.create.category.frp.desc",
  },
  {
    id: "terraria",
    enabled: true,
    labelKey: "shared.create.category.terraria.title",
    descKey: "shared.create.category.terraria.desc",
  },
  {
    id: "other",
    enabled: true,
    labelKey: "shared.create.category.other.title",
    descKey: "shared.create.category.other.desc",
  },
  {
    id: "import",
    enabled: false,
    labelKey: "shared.create.category.import.title",
    descKey: "shared.create.category.import.desc",
  },
];

/** 对齐 WPF 可见选项顺序 */
export const CREATE_TYPES: CreateTypeMeta[] = [
  // Minecraft 二级
  {
    id: "mcje",
    category: "minecraft",
    enabled: true,
    submittable: true,
    labelKey: "shared.create.type.mcje",
  },
  {
    id: "forge",
    category: "minecraft",
    enabled: true,
    submittable: true,
    labelKey: "shared.create.type.forge",
  },
  {
    id: "neoforge",
    category: "minecraft",
    enabled: true,
    submittable: true,
    labelKey: "shared.create.type.neoforge",
  },
  {
    id: "fabric",
    category: "minecraft",
    enabled: true,
    submittable: true,
    labelKey: "shared.create.type.fabric",
  },
  {
    id: "quilt",
    category: "minecraft",
    enabled: true,
    submittable: false,
    labelKey: "shared.create.type.quilt",
  },
  {
    id: "mcbe",
    category: "minecraft",
    enabled: true,
    submittable: false,
    labelKey: "shared.create.type.mcbe",
  },
  {
    id: "geyser",
    category: "minecraft",
    enabled: false,
    submittable: false,
    labelKey: "shared.create.type.geyser",
  },
  {
    id: "bungeecord",
    category: "minecraft",
    enabled: false,
    submittable: false,
    labelKey: "shared.create.type.bungeecord",
  },
  {
    id: "waterfall",
    category: "minecraft",
    enabled: false,
    submittable: false,
    labelKey: "shared.create.type.waterfall",
  },
  {
    id: "velocity",
    category: "minecraft",
    enabled: false,
    submittable: false,
    labelKey: "shared.create.type.velocity",
  },
  {
    id: "travertine",
    category: "minecraft",
    enabled: false,
    submittable: false,
    labelKey: "shared.create.type.travertine",
  },
  // FRP
  {
    id: "frpc",
    category: "frp",
    enabled: false,
    submittable: false,
    labelKey: "shared.create.type.frpc",
  },
  {
    id: "mefrp",
    category: "frp",
    enabled: false,
    submittable: false,
    labelKey: "shared.create.type.mefrp",
  },
  {
    id: "locyanfrp",
    category: "frp",
    enabled: false,
    submittable: false,
    labelKey: "shared.create.type.locyanfrp",
  },
  {
    id: "openfrp",
    category: "frp",
    enabled: false,
    submittable: false,
    labelKey: "shared.create.type.openfrp",
  },
  {
    id: "mossfrp",
    category: "frp",
    enabled: false,
    submittable: false,
    labelKey: "shared.create.type.mossfrp",
  },
  // Terraria / Other / Import
  {
    id: "terraria",
    category: "terraria",
    enabled: true,
    submittable: false,
    labelKey: "shared.create.type.terraria",
  },
  {
    id: "universal",
    category: "other",
    enabled: true,
    submittable: false,
    labelKey: "shared.create.type.universal",
  },
  {
    id: "import",
    category: "import",
    enabled: false,
    submittable: false,
    labelKey: "shared.create.type.import",
  },
];

export type MinecraftLoaderVersion = {
  mcVersion: string;
  loaderVersion: string;
};

/**
 * Flat create-wizard payload. DaemonClient.addInstance maps this into the nested
 * V2 CreateInstanceRequest (`setting.configuration.*` + factory fields).
 * `mc_version` becomes configuration.version on the wire.
 */
export type InstanceFactorySettingPayload = {
  name: string;
  target: string;
  instance_type: InstanceTypeWire;
  target_type: TargetTypeWire;
  /** Maps to configuration.version on Protocol V2. */
  mc_version?: string;
  java_path?: string;
  arguments?: string[];
  source: string;
  source_type: SourceTypeWire;
  mirror?: MirrorWire;
  use_post_process?: boolean;
  input_encoding?: string;
  output_encoding?: string;
};

export type JavaInfo = {
  path: string;
  version: string;
  architecture: string;
};

export function getTypesForCategory(
  category: CreateCategory,
): CreateTypeMeta[] {
  return CREATE_TYPES.filter((item) => item.category === category);
}

export function getTypeMeta(id: CreateCoreType): CreateTypeMeta | undefined {
  return CREATE_TYPES.find((item) => item.id === id);
}

export function coreTypeToInstanceType(type: CreateCoreType): InstanceTypeWire {
  switch (type) {
    case "mcje":
      return "mc_java";
    case "forge":
      return "mc_forge";
    case "neoforge":
      return "mc_neo_forge";
    case "fabric":
      return "mc_fabric";
    case "quilt":
      return "mc_quilt";
    case "mcbe":
      return "mc_bedrock";
    case "geyser":
      return "mc_geyser";
    case "bungeecord":
      return "mc_bungee_cord";
    case "waterfall":
      return "mc_waterfall";
    case "velocity":
      return "mc_velocity";
    case "travertine":
      return "mc_travertine";
    case "terraria":
      return "terraria";
    case "universal":
    case "import":
    case "frpc":
    case "mefrp":
    case "locyanfrp":
    case "openfrp":
    case "mossfrp":
    default:
      return "universal";
  }
}

/** Daemon 是否已有稳定创建路径（与 WPF FinishSetup 对齐） */
export function isCreateTypeSubmittable(type: CreateCoreType): boolean {
  return getTypeMeta(type)?.submittable === true;
}

export function isCreateTypeEnabled(type: CreateCoreType): boolean {
  return getTypeMeta(type)?.enabled === true;
}

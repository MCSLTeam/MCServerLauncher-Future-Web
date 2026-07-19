/** Align with MCServerLauncher.Common.ProtoType.EventTrigger.EventRule */

export type EventRule = {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  triggerCondition: "Any" | "All";
  actionExecutionMode: "Sequential" | "Parallel";
  triggers: EventTrigger[];
  rulesets: EventRuleset[];
  actions: EventAction[];
};

export type EventTrigger =
  | { id: string; type: "ConsoleOutput"; pattern: string; isRegex: boolean }
  | { id: string; type: "Schedule"; cronExpression: string }
  | { id: string; type: "InstanceStatus"; targetStatus: string };

export type EventRuleset =
  | { id: string; type: "AlwaysTrue" }
  | { id: string; type: "AlwaysFalse" }
  | { id: string; type: "InstanceStatus"; targetStatus: string };

export type EventAction =
  | { id: string; type: "SendCommand"; command: string }
  | { id: string; type: "ChangeInstanceStatus"; action: string }
  | {
      id: string;
      type: "SendNotification";
      title: string;
      message: string;
      severity: string;
    };

function newId() {
  return crypto.randomUUID();
}

export function createEmptyRule(name: string, description: string): EventRule {
  return {
    id: newId(),
    name,
    description,
    isEnabled: true,
    triggerCondition: "Any",
    actionExecutionMode: "Sequential",
    triggers: [],
    rulesets: [{ id: newId(), type: "AlwaysTrue" }],
    actions: [],
  };
}

export function normalizeEventRules(raw: unknown): EventRule[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { rules?: unknown[] })?.rules)
      ? ((raw as { rules: unknown[] }).rules ?? [])
      : [];
  return list.map((item) => normalizeRule(item));
}

function normalizeRule(item: unknown): EventRule {
  const r = (item ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? r.Id ?? newId()),
    name: String(r.name ?? r.Name ?? ""),
    description: String(r.description ?? r.Description ?? ""),
    isEnabled: Boolean(r.is_enabled ?? r.isEnabled ?? r.IsEnabled ?? true),
    triggerCondition:
      String(
        r.trigger_condition ?? r.triggerCondition ?? r.TriggerCondition ?? "Any",
      ) === "All"
        ? "All"
        : "Any",
    actionExecutionMode:
      String(
        r.action_execution_mode ??
          r.actionExecutionMode ??
          r.ActionExecutionMode ??
          "Sequential",
      ) === "Parallel"
        ? "Parallel"
        : "Sequential",
    triggers: normalizeTriggers(r.triggers ?? r.Triggers),
    rulesets: normalizeRulesets(r.rulesets ?? r.Rulesets),
    actions: normalizeActions(r.actions ?? r.Actions),
  };
}

function normalizeTriggers(raw: unknown): EventTrigger[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const t = (item ?? {}) as Record<string, unknown>;
    const type = String(t.type ?? t.Type ?? "ConsoleOutput");
    const id = String(t.id ?? t.Id ?? newId());
    if (type === "Schedule") {
      return {
        id,
        type: "Schedule" as const,
        cronExpression: String(
          t.cron_expression ?? t.cronExpression ?? t.CronExpression ?? "",
        ),
      };
    }
    if (type === "InstanceStatus") {
      return {
        id,
        type: "InstanceStatus" as const,
        targetStatus: String(
          t.target_status ?? t.targetStatus ?? t.TargetStatus ?? "Running",
        ),
      };
    }
    return {
      id,
      type: "ConsoleOutput" as const,
      pattern: String(t.pattern ?? t.Pattern ?? ""),
      isRegex: Boolean(t.is_regex ?? t.isRegex ?? t.IsRegex ?? false),
    };
  });
}

function normalizeRulesets(raw: unknown): EventRuleset[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ id: newId(), type: "AlwaysTrue" }];
  }
  return raw.map((item) => {
    const t = (item ?? {}) as Record<string, unknown>;
    const type = String(t.type ?? t.Type ?? "AlwaysTrue");
    const id = String(t.id ?? t.Id ?? newId());
    if (type === "AlwaysFalse") return { id, type: "AlwaysFalse" as const };
    if (type === "InstanceStatus") {
      return {
        id,
        type: "InstanceStatus" as const,
        targetStatus: String(
          t.target_status ?? t.targetStatus ?? t.TargetStatus ?? "Running",
        ),
      };
    }
    return { id, type: "AlwaysTrue" as const };
  });
}

function normalizeActions(raw: unknown): EventAction[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const t = (item ?? {}) as Record<string, unknown>;
    const type = String(t.type ?? t.Type ?? "SendCommand");
    const id = String(t.id ?? t.Id ?? newId());
    if (type === "ChangeInstanceStatus") {
      return {
        id,
        type: "ChangeInstanceStatus" as const,
        action: String(t.action ?? t.Action ?? "Start"),
      };
    }
    if (type === "SendNotification") {
      return {
        id,
        type: "SendNotification" as const,
        title: String(t.title ?? t.Title ?? ""),
        message: String(t.message ?? t.Message ?? ""),
        severity: String(t.severity ?? t.Severity ?? "Info"),
      };
    }
    return {
      id,
      type: "SendCommand" as const,
      command: String(t.command ?? t.Command ?? ""),
    };
  });
}

/**
 * Wire shape for Protocol V2 STJ (SnakeCaseLower property names).
 * Discriminator `type` values stay PascalCase strings as in Contracts.
 */
export function toWireRules(rules: EventRule[]): unknown[] {
  return rules.map((rule) => ({
    id: rule.id,
    name: rule.name,
    description: rule.description,
    is_enabled: rule.isEnabled,
    trigger_condition: rule.triggerCondition,
    action_execution_mode: rule.actionExecutionMode,
    triggers: rule.triggers.map((trigger) => {
      if (trigger.type === "ConsoleOutput") {
        return {
          id: trigger.id,
          type: "ConsoleOutput",
          pattern: trigger.pattern,
          is_regex: trigger.isRegex,
        };
      }
      if (trigger.type === "Schedule") {
        return {
          id: trigger.id,
          type: "Schedule",
          cron_expression: trigger.cronExpression,
        };
      }
      return {
        id: trigger.id,
        type: "InstanceStatus",
        target_status: trigger.targetStatus,
      };
    }),
    rulesets: rule.rulesets.map((rs) => {
      if (rs.type === "InstanceStatus") {
        return {
          id: rs.id,
          type: "InstanceStatus",
          target_status: rs.targetStatus,
        };
      }
      return { id: rs.id, type: rs.type };
    }),
    actions: rule.actions.map((action) => {
      if (action.type === "ChangeInstanceStatus") {
        return {
          id: action.id,
          type: "ChangeInstanceStatus",
          action: action.action,
        };
      }
      if (action.type === "SendNotification") {
        return {
          id: action.id,
          type: "SendNotification",
          title: action.title,
          message: action.message,
          severity: action.severity,
        };
      }
      return {
        id: action.id,
        type: "SendCommand",
        command: action.command,
      };
    }),
  }));
}

export function cloneRule(rule: EventRule, nameSuffix: string): EventRule {
  const json = JSON.stringify(rule);
  const copy = normalizeRule(JSON.parse(json) as unknown);
  copy.id = newId();
  copy.name = `${rule.name}${nameSuffix}`;
  copy.triggers = copy.triggers.map((t) => ({ ...t, id: newId() }));
  copy.rulesets = copy.rulesets.map((t) => ({ ...t, id: newId() }));
  copy.actions = copy.actions.map((t) => ({ ...t, id: newId() }));
  return copy;
}

/**
 * Daemon wire InstanceType（JsonStringEnumConverter SnakeCaseLower）。
 * 对齐 IsMinecraftJavaRuntimeType：MinecraftJava 且非 Proxy/Utility。
 */
export const JAVA_INSTANCE_TYPES = [
  "mc_java",
  "mc_fabric",
  "mc_forge",
  "mc_neo_forge",
  "mc_quilt",
  "mc_cleanroom",
  "mc_sponge_vanilla",
  "mc_sponge_forge",
  "mc_sponge_neo",
  "mc_vanilla",
  "mc_craft_bukkit",
  "mc_spigot",
  "mc_paper",
  "mc_leaf",
  "mc_leaves",
  "mc_folia",
  "mc_canvas",
  "mc_pufferfish",
  "mc_purpur",
  "mc_mohist",
  "mc_banner",
  "mc_youer",
  "mc_thermos",
  "mc_crucible",
  "mc_taiyitist",
  "mc_cat_server",
  "mc_arclight",
] as const;

const INSTALLER_BASED_TYPES = new Set([
  "mc_forge",
  "mc_neo_forge",
  "mc_cleanroom",
]);

/** Proxy / Utility：有 mc_ 前缀但不是 Java runtime 设置族 */
const NON_RUNTIME_MC_TYPES = new Set([
  "mc_bungee_cord",
  "mc_velocity",
  "mc_waterfall",
  "mc_travertine",
  "mc_via_version",
  "mc_geyser",
  "mcd_reforged",
]);

/**
 * 将 UI/历史 PascalCase 与 wire snake_case 统一为 Daemon 线协议值。
 * 例：MCJava / mc-java / mc_java → mc_java；Universal → universal
 */
export function normalizeInstanceType(type: string | null | undefined): string {
  const raw = String(type ?? "").trim();
  if (!raw) return "universal";
  const spaced = raw.replace(/[\s-]+/g, "_");
  if (spaced.includes("_") || spaced === spaced.toLowerCase()) {
    return spaced.toLowerCase();
  }
  // PascalCase enum name → snake_case（对齐 STJ SnakeCaseLower）
  return spaced
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

/**
 * 展示标签（产品名，非 wire 编码）。
 * 例：mc_paper → Paper；mc_java → Minecraft Java
 */
const INSTANCE_TYPE_LABELS: Record<string, string> = {
  universal: "Universal",
  other: "Other",
  terraria: "Terraria",
  bedrock: "Bedrock",
  mc_java: "Minecraft Java",
  mc_vanilla: "Vanilla",
  mc_fabric: "Fabric",
  mc_forge: "Forge",
  mc_neo_forge: "NeoForge",
  mc_quilt: "Quilt",
  mc_cleanroom: "Cleanroom",
  mc_sponge_vanilla: "SpongeVanilla",
  mc_sponge_forge: "SpongeForge",
  mc_sponge_neo: "SpongeNeo",
  mc_craft_bukkit: "CraftBukkit",
  mc_spigot: "Spigot",
  mc_paper: "Paper",
  mc_leaf: "Leaf",
  mc_leaves: "Leaves",
  mc_folia: "Folia",
  mc_canvas: "Canvas",
  mc_pufferfish: "Pufferfish",
  mc_purpur: "Purpur",
  mc_mohist: "Mohist",
  mc_banner: "Banner",
  mc_youer: "Youer",
  mc_thermos: "Thermos",
  mc_crucible: "Crucible",
  mc_taiyitist: "Taiyitist",
  mc_cat_server: "CatServer",
  mc_arclight: "Arclight",
  mc_bungee_cord: "BungeeCord",
  mc_velocity: "Velocity",
  mc_waterfall: "Waterfall",
  mc_travertine: "Travertine",
  mc_via_version: "ViaVersion",
  mc_geyser: "Geyser",
  mcd_reforged: "MCDReforged",
};

export function formatInstanceTypeLabel(type: string): string {
  const wire = normalizeInstanceType(type);
  if (!wire) return type || "—";
  if (INSTANCE_TYPE_LABELS[wire]) return INSTANCE_TYPE_LABELS[wire];
  // 未知类型：去掉 mc_ 前缀后做轻量 Title Case，避免露出 snake_case
  const bare = wire.startsWith("mc_") ? wire.slice(3) : wire;
  return bare
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isJavaRuntimeType(type: string) {
  const t = normalizeInstanceType(type);
  if (!t) return false;
  if (JAVA_INSTANCE_TYPES.includes(t as (typeof JAVA_INSTANCE_TYPES)[number])) {
    return true;
  }
  if (NON_RUNTIME_MC_TYPES.has(t)) return false;
  // legacy aliases
  return /^(minecraft|paper|spigot|fabric|forge|neoforge|quilt|purpur|folia|vanilla)/i.test(
    t,
  );
}

export function isInstallerBasedType(type: string) {
  return INSTALLER_BASED_TYPES.has(normalizeInstanceType(type));
}

import type {
  CreateCoreType,
  InstanceFactorySettingPayload,
  MirrorWire,
} from "@/lib/create/types";
import { coreTypeToInstanceType } from "@/lib/create/types";

export type BuildCommonFields = {
  name: string;
  javaPath: string;
  arguments: string[];
  useMirror?: boolean;
};

export function mirrorOf(useMirror: boolean): MirrorWire {
  return useMirror ? "bmcl_api" : "none";
}

/** MCJava：Source 为 Daemon 上相对路径或 URL */
export function buildMcJavaSetting(
  fields: BuildCommonFields & {
    source: string;
    targetFileName: string;
    /** WPF 硬编码 1.21.1；Daemon 可 Reconcile */
    mcVersion?: string;
  },
): InstanceFactorySettingPayload {
  return {
    name: fields.name,
    source: fields.source,
    source_type: "core",
    target: fields.targetFileName,
    target_type: "jar",
    instance_type: "mc_java",
    java_path: fields.javaPath,
    arguments: fields.arguments,
    mc_version: fields.mcVersion ?? "1.21.1",
    mirror: "none",
    use_post_process: false,
  };
}

export function buildForgeSetting(
  fields: BuildCommonFields & {
    mcVersion: string;
    forgeVersion: string;
  },
): InstanceFactorySettingPayload {
  const useMirror = fields.useMirror ?? true;
  const { mcVersion, forgeVersion } = fields;
  const installerFileName = `forge-${mcVersion}-${forgeVersion}-installer.jar`;
  const source = useMirror
    ? `https://bmclapi2.bangbang93.com/maven/net/minecraftforge/forge/${mcVersion}-${forgeVersion}/${installerFileName}`
    : `https://maven.minecraftforge.net/net/minecraftforge/forge/${mcVersion}-${forgeVersion}/${installerFileName}`;
  return {
    name: fields.name,
    source,
    source_type: "core",
    target: installerFileName,
    target_type: "jar",
    instance_type: "mc_forge",
    java_path: fields.javaPath,
    arguments: fields.arguments,
    mc_version: mcVersion,
    mirror: mirrorOf(useMirror),
    use_post_process: false,
  };
}

export function buildFabricSetting(
  fields: BuildCommonFields & {
    mcVersion: string;
    fabricVersion: string;
  },
): InstanceFactorySettingPayload {
  const useMirror = fields.useMirror ?? true;
  const { mcVersion, fabricVersion } = fields;
  const source = useMirror
    ? `https://bmclapi2.bangbang93.com/fabric-meta/v2/versions/loader/${mcVersion}/${fabricVersion}/1.0.1/server/jar`
    : `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${fabricVersion}/1.0.1/server/jar`;
  const target = `fabric-server-mc.${mcVersion}-loader.${fabricVersion}-launcher.${mcVersion}.jar`;
  return {
    name: fields.name,
    source,
    source_type: "core",
    target,
    target_type: "jar",
    instance_type: "mc_fabric",
    java_path: fields.javaPath,
    arguments: fields.arguments,
    mc_version: mcVersion,
    mirror: mirrorOf(useMirror),
    use_post_process: false,
  };
}

export function buildNeoForgeSetting(
  fields: BuildCommonFields & {
    mcVersion: string;
    neoForgeVersion: string;
  },
): InstanceFactorySettingPayload {
  const useMirror = fields.useMirror ?? true;
  const { mcVersion, neoForgeVersion } = fields;
  const isLegacy = mcVersion === "1.20.1";
  let installerFileName: string;
  let source: string;
  if (isLegacy) {
    installerFileName = `forge-1.20.1-${neoForgeVersion}-installer.jar`;
    source = useMirror
      ? `https://bmclapi2.bangbang93.com/maven/net/neoforged/forge/1.20.1-${neoForgeVersion}/${installerFileName}`
      : `https://maven.neoforged.net/releases/net/neoforged/forge/1.20.1-${neoForgeVersion}/${installerFileName}`;
  } else {
    installerFileName = `neoforge-${neoForgeVersion}-installer.jar`;
    source = useMirror
      ? `https://bmclapi2.bangbang93.com/maven/net/neoforged/neoforge/${neoForgeVersion}/${installerFileName}`
      : `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoForgeVersion}/${installerFileName}`;
  }
  return {
    name: fields.name,
    source,
    source_type: "core",
    target: installerFileName,
    target_type: "jar",
    instance_type: "mc_neo_forge",
    java_path: fields.javaPath,
    arguments: fields.arguments,
    mc_version: mcVersion,
    mirror: mirrorOf(useMirror),
    use_post_process: false,
  };
}

/** Quilt：WPF Finish 未接线；按 Fabric 风格构造（Daemon 可能无工厂） */
export function buildQuiltSetting(
  fields: BuildCommonFields & {
    mcVersion: string;
    quiltVersion: string;
  },
): InstanceFactorySettingPayload {
  const useMirror = fields.useMirror ?? true;
  const { mcVersion, quiltVersion } = fields;
  const source = useMirror
    ? `https://bmclapi2.bangbang93.com/quilt-meta/v3/versions/loader/${mcVersion}/${quiltVersion}/server/jar`
    : `https://meta.quiltmc.org/v3/versions/loader/${mcVersion}/${quiltVersion}/server/jar`;
  const target = `quilt-server-mc.${mcVersion}-loader.${quiltVersion}.jar`;
  return {
    name: fields.name,
    source,
    source_type: "core",
    target,
    target_type: "jar",
    instance_type: "mc_quilt",
    java_path: fields.javaPath,
    arguments: fields.arguments,
    mc_version: mcVersion,
    mirror: mirrorOf(useMirror),
    use_post_process: false,
  };
}

export function buildArchiveLikeSetting(
  fields: BuildCommonFields & {
    type: CreateCoreType;
    source: string;
    targetFileName: string;
    targetType: "archive" | "script" | "executable" | "core";
  },
): InstanceFactorySettingPayload {
  const instanceType = coreTypeToInstanceType(fields.type);
  const targetType =
    fields.type === "terraria"
      ? "script"
      : fields.type === "mcbe"
        ? "executable"
        : fields.type === "universal"
          ? "executable"
          : "jar";
  const sourceType =
    fields.targetType === "archive"
      ? "archive"
      : fields.targetType === "script"
        ? "script"
        : "core";
  return {
    name: fields.name,
    source: fields.source,
    source_type: sourceType,
    target: fields.targetFileName,
    target_type: targetType,
    instance_type: instanceType,
    java_path: fields.javaPath || "",
    arguments: fields.arguments,
    mc_version: "",
    mirror: "none",
    use_post_process: false,
  };
}

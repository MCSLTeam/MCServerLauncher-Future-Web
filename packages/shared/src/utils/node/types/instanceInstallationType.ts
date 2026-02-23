import type { Core } from "./cores.ts";
import JSZip from "jszip";

export const EXECUTABLE_TYPES = [
  "forge_installer",
  "fabric_installer",
  "spigot_buildtools",
  "executable",
] as const;
export type ExecutableType = (typeof EXECUTABLE_TYPES)[number];

export const INSTALLATION_TYPES = [
  "core",
  "script",
  "archive",
  "mcslpack",
] as const;
export type InstallationType = (typeof INSTALLATION_TYPES)[number];

export type ExecutableInfo = {
  installationType: ExecutableType;
  coreType: Core | "jar";
};

/* ===== [ 核心检测 ] ===== */
const implementationTitle: Record<string, ExecutableInfo | Core> = {
  LegacyFabricInstaller: {
    installationType: "fabric_installer",
    coreType: "legacy_fabric",
  },
  "Quilt-Installer": {
    installationType: "fabric_installer",
    coreType: "quilt",
  },
  Velocity: "velocity",
  SpongeVanilla: "sponge_vanilla",
  SpongeForge: "sponge_forge",
  SpongeNeo: "sponge_neo",
  Crucible: "crucible",
  Taiyitist: "taiyitist",
  CatServer: "cat_server",
  Arclight: "arclight",
  BuildTools: {
    installationType: "spigot_buildtools",
    coreType: "spigot",
  },
};

const mainClass: Record<string, ExecutableInfo | Core> = {
  "net.minecraft.bundler.Main": "vanilla",
  "org.cloudburstmc.server.Nukkit": "cloudburst",
  "cn.nukkit.Nukkit": "nukkit",
  "net.fabricmc.installer.Main": {
    installationType: "fabric_installer",
    coreType: "fabric",
  },
  "net.fabricmc.installer.ServerLauncher": "fabric",
  "net.raphimc.viaproxy.ViaProxy": "viaproxy",
  "org.geysermc.geyser.platform.standalone.GeyserStandaloneBootstrap": "geyser",
  "org.leavesmc.leavesclip.Main": "leaves",
  "cn.dreeam.leaper.Main": "leaf",
  "com.mohistmc.MohistMCStart": "mohist",
  "com.mohistmc.launcher.youer.Main": "youer",
};

const implementationVersion: Record<string, ExecutableInfo | Core> = {
  "git:BungeeCord-Bootstrap:": "bungeecord",
  "git:Waterfall-Bootstrap:": "waterfall",
};

const versionList: Core[] = [
  "craftbukkit",
  "spigot",
  "paper",
  "folia",
  "pufferfish",
  "purpur",
];

export async function getExecutableType(
  type: string,
  content: ArrayBuffer,
): Promise<ExecutableInfo> {
  // 注：pocketmine使用script模式安装，故不判断

  const textContent = new TextDecoder().decode(content);
  if (type != "application/java-archive") {
    // 非jar文件
    // 注：terraria / tshock 不是单文件故不判断

    // frpc
    if (
      textContent.includes(
        "frpc is the client of frp (https://github.com/fatedier/frp)",
      )
    )
      return {
        installationType: "executable",
        coreType: "frpc",
      };

    // mcbe vanilla
    if (textContent.includes("Minecraft.Bedrock.Server"))
      return {
        installationType: "executable",
        coreType: "bedrock",
      };

    // unknown
    return {
      installationType: "executable",
      coreType: "universal",
    };
  }

  // jar文件
  // forge / neoforge / cleanroom 服务器非单文件，故仅判断安装器
  const zip = new JSZip();
  let jarContent;
  try {
    jarContent = await zip.loadAsync(content);
  } catch {
    return {
      installationType: "executable",
      coreType: "jar",
    };
  }

  // forge-like installer
  const installProfileEntry = jarContent.files["install_profile.json"];
  if (installProfileEntry && !installProfileEntry.dir) {
    try {
      const installProfile = await installProfileEntry.async("text");
      // forge installer
      if (installProfile.includes('"profile": "forge"'))
        return {
          installationType: "forge_installer",
          coreType: "forge",
        };
      // neoforge installer
      if (installProfile.includes('"profile": "neoforge"'))
        return {
          installationType: "forge_installer",
          coreType: "neoforge",
        };
      // cleanroom installer
      if (installProfile.includes('"profile": "cleanroom"'))
        return {
          installationType: "forge_installer",
          coreType: "cleanroom",
        };
    } catch {
      /* ignore */
    }
  }

  // bukkit-like
  const versionListEntry = jarContent.files["META-INF/version.list"];
  if (versionListEntry && !versionListEntry.dir) {
    try {
      const versionListContent = await versionListEntry.async("text");
      for (const core of versionList) {
        if (versionListContent.includes(core))
          return {
            installationType: "executable",
            coreType: core,
          };
      }
    } catch {
      /* ignore */
    }
  }

  // other jars
  const manifestEntry = jarContent.files["META-INF/MANIFEST.MF"];
  if (manifestEntry && !manifestEntry.dir) {
    try {
      const manifest = await manifestEntry.async("text");
      for (const [key, value] of Object.entries(implementationTitle)) {
        if (manifest.includes("Implementation-Title: " + key))
          if (typeof value === "object") return value;
          else
            return {
              installationType: "executable",
              coreType: value,
            };
      }
      for (const [key, value] of Object.entries(mainClass)) {
        if (manifest.includes("Main-Class: " + key))
          if (typeof value === "object") return value;
          else
            return {
              installationType: "executable",
              coreType: value,
            };
      }
      for (const [key, value] of Object.entries(implementationVersion)) {
        if (manifest.includes("Implementation-Version: " + key))
          if (typeof value === "object") return value;
          else
            return {
              installationType: "executable",
              coreType: value,
            };
      }
    } catch {
      /* ignore */
    }
  }

  return {
    installationType: "executable",
    coreType: "jar",
  };
}

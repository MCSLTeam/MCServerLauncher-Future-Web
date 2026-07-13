import { publicApi } from "@/lib/api";
import { sortMinecraftVersions } from "@/lib/minecraft-version";
import { loadSettings } from "@/lib/settings-store";

export type ResourceProviderId =
  | "FastMirror"
  | "PolarsMirror"
  | "RainYun"
  | "MSLAPI"
  | "MCSLSync";

export type ResourceCore = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  homepage?: string;
  tag?: string;
  recommended?: boolean;
  versions?: string[];
};

export type ResourceFile = {
  id: string;
  name: string;
  minecraftVersion?: string;
  buildVersion?: string;
  size?: number;
  downloadUrl?: string;
};

export type ResourceProvider = {
  id: ResourceProviderId;
  displayName: string;
  sidebarWidth: "narrow" | "wide";
  listCores: () => Promise<ResourceCore[]>;
  listVersions?: (core: ResourceCore) => Promise<string[]>;
  listFiles: (core: ResourceCore, version?: string) => Promise<ResourceFile[]>;
  resolveDownload: (
    core: ResourceCore,
    file: ResourceFile,
  ) => Promise<{ url: string; fileName: string }>;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown) {
  return value == null ? "" : String(value);
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getJson(url: string): Promise<unknown> {
  const parsed = new URL(url);
  const mappings: Array<{
    host: string;
    prefix: string;
    provider: ResourceProviderId;
  }> = [
    {
      host: "download.fastmirror.net",
      prefix: "/api/v3",
      provider: "FastMirror",
    },
    {
      host: "mirror.polars.cc",
      prefix: "/api/query/minecraft",
      provider: "PolarsMirror",
    },
    { host: "mirrors.rainyun.com", prefix: "/api/fs", provider: "RainYun" },
    { host: "api.mslmc.cn", prefix: "/v3", provider: "MSLAPI" },
    { host: "sync.mcsl.com.cn", prefix: "/api", provider: "MCSLSync" },
  ];
  const mapping = mappings.find(
    (candidate) =>
      candidate.host === parsed.hostname &&
      parsed.pathname.startsWith(candidate.prefix),
  );
  if (!mapping) throw new Error("Unsupported resource provider");
  const result = await publicApi<unknown>("resource/provider", {
    method: "POST",
    body: {
      provider: mapping.provider,
      path: parsed.pathname.slice(mapping.prefix.length),
      query: [...parsed.searchParams.entries()],
    },
  });
  if (!result.ok) throw new Error(result.message ?? "Provider unavailable");
  return result.data;
}

function safeDownloadUrl(value: unknown) {
  const url = new URL(text(value));
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Invalid download URL");
  }
  return url.toString();
}

function prettyMslName(raw: string) {
  const names: Record<string, string> = {
    paper: "Paper",
    purpur: "Purpur",
    leaves: "Leaves",
    spigot: "Spigot",
    arclight: "Arclight",
    forge: "Forge",
    neoforge: "NeoForge",
    fabric: "Fabric",
    bukkit: "Bukkit",
    vanilla: "Vanilla",
    folia: "Folia",
    bungeecord: "BungeeCord",
    velocity: "Velocity",
    nukkitx: "NukkitX",
    quilt: "Quilt",
  };
  return names[raw.toLowerCase()] ?? raw;
}

const fastMirror: ResourceProvider = {
  id: "FastMirror",
  displayName: "无极镜像",
  sidebarWidth: "wide",
  async listCores() {
    const root = record(
      await getJson("https://download.fastmirror.net/api/v3"),
    );
    return array(root.data).map((item) => {
      const value = record(item);
      return {
        id: text(value.name),
        name: text(value.name),
        tag: text(value.tag),
        homepage: text(value.homepage),
        recommended: Boolean(value.recommend),
        versions: array(value.mc_versions).map(text),
      };
    });
  },
  async listVersions(core) {
    return sortMinecraftVersions(core.versions ?? []);
  },
  async listFiles(core, version) {
    if (!version) return [];
    const root = record(
      await getJson(
        `https://download.fastmirror.net/api/v3/${encodeURIComponent(core.id)}/${encodeURIComponent(version)}?offset=0&limit=25`,
      ),
    );
    const data = record(root.data);
    return array(data.builds).map((item) => {
      const value = record(item);
      const build = text(value.core_version || value.name);
      return {
        id: build,
        name: `${core.name}-${version}-${build}.jar`,
        minecraftVersion: text(value.mc_version || version),
        buildVersion: build,
        downloadUrl: `https://download.fastmirror.net/download/${encodeURIComponent(core.id)}/${encodeURIComponent(version)}/${encodeURIComponent(build)}`,
      };
    });
  },
  async resolveDownload(_core, file) {
    return { url: safeDownloadUrl(file.downloadUrl), fileName: file.name };
  },
};

const polarsMirror: ResourceProvider = {
  id: "PolarsMirror",
  displayName: "极星云镜像",
  sidebarWidth: "narrow",
  async listCores() {
    const root = await getJson(
      "https://mirror.polars.cc/api/query/minecraft/core",
    );
    return array(root).map((item) => {
      const value = record(item);
      return {
        id: text(value.id),
        name: text(value.name),
        description: text(value.description),
        icon: text(value.icon),
      };
    });
  },
  async listFiles(core) {
    const root = await getJson(
      `https://mirror.polars.cc/api/query/minecraft/core/${encodeURIComponent(core.id)}`,
    );
    return array(root).map((item) => {
      const value = record(item);
      return {
        id: text(value.name),
        name: text(value.name),
        downloadUrl: text(value.downloadUrl),
      };
    });
  },
  async resolveDownload(_core, file) {
    return { url: safeDownloadUrl(file.downloadUrl), fileName: file.name };
  },
};

async function rainList(path: string) {
  const url = new URL("https://mirrors.rainyun.com/api/fs/list");
  url.searchParams.set("path", path);
  const root = record(await getJson(url.toString()));
  return array(record(root.data).content);
}

const rainYun: ResourceProvider = {
  id: "RainYun",
  displayName: "雨云镜像站",
  sidebarWidth: "narrow",
  async listCores() {
    return (await rainList("服务端合集"))
      .filter((item) => Boolean(record(item).is_dir))
      .map((item) => {
        const value = record(item);
        const name = text(value.name);
        return { id: name, name };
      });
  },
  async listFiles(core) {
    const files = await rainList(`服务端合集/${core.id}`);
    return files
      .filter((item) => !Boolean(record(item).is_dir))
      .reverse()
      .map((item) => {
        const value = record(item);
        const name = text(value.name);
        return { id: name, name, size: number(value.size) };
      });
  },
  async resolveDownload(core, file) {
    const url = new URL("https://mirrors.rainyun.com/api/fs/get");
    url.searchParams.set("path", `服务端合集/${core.id}/${file.name}`);
    const root = record(await getJson(url.toString()));
    return {
      url: safeDownloadUrl(record(root.data).raw_url),
      fileName: file.name,
    };
  },
};

const mslApi: ResourceProvider = {
  id: "MSLAPI",
  displayName: "MSL",
  sidebarWidth: "narrow",
  async listCores() {
    const root = record(
      await getJson("https://api.mslmc.cn/v3/query/available_server_types"),
    );
    return array(record(root.data).types).map((item) => {
      const id = text(item);
      return { id, name: prettyMslName(id) };
    });
  },
  async listVersions(core) {
    const root = record(
      await getJson(
        `https://api.mslmc.cn/v3/query/available_versions/${encodeURIComponent(core.id)}`,
      ),
    );
    return array(record(root.data).versionList).map(text);
  },
  async listFiles(core) {
    const descriptionRoot = record(
      await getJson(
        `https://api.mslmc.cn/v3/query/servers_description/${encodeURIComponent(core.id)}`,
      ),
    );
    core.description = text(record(descriptionRoot.data).description);
    const versions = await this.listVersions!(core);
    return versions.map((version) => ({
      id: version,
      name: `${core.id}-${version}.jar`,
      minecraftVersion: version,
    }));
  },
  async resolveDownload(core, file) {
    const version = file.minecraftVersion ?? file.id;
    const root = record(
      await getJson(
        `https://api.mslmc.cn/v3/download/server/${encodeURIComponent(core.id)}/${encodeURIComponent(version)}`,
      ),
    );
    return {
      url: safeDownloadUrl(record(root.data).url),
      fileName: `${core.id}-${version}.jar`,
    };
  },
};

const mcslSync: ResourceProvider = {
  id: "MCSLSync",
  displayName: "MCSL-Sync 同步镜像",
  sidebarWidth: "narrow",
  async listCores() {
    const root = record(await getJson("https://sync.mcsl.com.cn/api/core"));
    return array(root.data).map((item) => {
      const id = text(item);
      return { id, name: id };
    });
  },
  async listVersions(core) {
    const root = record(
      await getJson(
        `https://sync.mcsl.com.cn/api/core/${encodeURIComponent(core.id)}`,
      ),
    );
    return sortMinecraftVersions(array(record(root.data).versions).map(text));
  },
  async listFiles(core, version) {
    if (!version) return [];
    const root = record(
      await getJson(
        `https://sync.mcsl.com.cn/api/core/${encodeURIComponent(core.id)}/${encodeURIComponent(version)}`,
      ),
    );
    return array(record(root.data).builds).map((build) => ({
      id: text(build),
      name: `${core.id}-${version}-${text(build)}.jar`,
      minecraftVersion: version,
      buildVersion: text(build),
    }));
  },
  async resolveDownload(core, file) {
    const version = file.minecraftVersion ?? "";
    const build = file.buildVersion ?? file.id;
    const root = record(
      await getJson(
        `https://sync.mcsl.com.cn/api/core/${encodeURIComponent(core.id)}/${encodeURIComponent(version)}/${encodeURIComponent(build)}`,
      ),
    );
    const data = record(root.data);
    const item = record(data.build);
    return {
      url: safeDownloadUrl(item.download_url),
      fileName: `${core.id}-${version}-${build}.jar`,
    };
  },
};

export const RESOURCE_PROVIDERS: ResourceProvider[] = [
  fastMirror,
  polarsMirror,
  rainYun,
  mslApi,
  mcslSync,
];

export function loadResourceProviderId(): ResourceProviderId {
  if (typeof window === "undefined") return "FastMirror";
  const value = loadSettings().downloadSource;
  return RESOURCE_PROVIDERS.some((provider) => provider.id === value)
    ? (value as ResourceProviderId)
    : "FastMirror";
}

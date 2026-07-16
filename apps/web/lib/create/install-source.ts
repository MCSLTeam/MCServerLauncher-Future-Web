import { tKey } from "@/lib/i18n/translate";
/** 对齐 Common.Minecraft.InstallSource（浏览器 fetch） */

export type VersionOption = {
  version: string;
  stable?: boolean;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
  });
  if (!res.ok) {
    throw new Error(tKey("shared.create.status.request-failed", { status: res.status, url }));
  }
  return (await res.json()) as T;
}

export async function listForgeMinecraftVersions(
  useMirror: boolean,
): Promise<string[]> {
  if (useMirror) {
    const list = await fetchJson<string[]>(
      "https://bmclapi2.bangbang93.com/forge/minecraft",
    );
    return Array.isArray(list) ? list : [];
  }
  // 官方 HTML 列表跨域不稳，回落镜像
  return listForgeMinecraftVersions(true);
}

export async function listForgeBuilds(
  mcVersion: string,
  useMirror: boolean,
): Promise<string[]> {
  if (useMirror) {
    type Item = { version?: string; build?: number };
    const data = await fetchJson<Item[] | { data?: Item[] }>(
      `https://bmclapi2.bangbang93.com/forge/minecraft/${encodeURIComponent(mcVersion)}`,
    );
    const list = Array.isArray(data)
      ? data
      : Array.isArray((data as { data?: Item[] }).data)
        ? (data as { data: Item[] }).data
        : [];
    return list
      .map((item) => item.version)
      .filter((v): v is string => Boolean(v));
  }
  return listForgeBuilds(mcVersion, true);
}

export async function listFabricMinecraftVersions(
  useMirror: boolean,
  onlyStable = true,
): Promise<VersionOption[]> {
  const base = useMirror
    ? "https://bmclapi2.bangbang93.com/fabric-meta/v2/versions"
    : "https://meta.fabricmc.net/v2/versions";
  type Item = { version: string; stable: boolean };
  const list = await fetchJson<Item[]>(`${base}/game`);
  return (list ?? [])
    .filter((item) => (onlyStable ? item.stable : true))
    .map((item) => ({ version: item.version, stable: item.stable }));
}

export async function listFabricLoaderVersions(
  useMirror: boolean,
  onlyStable = true,
): Promise<VersionOption[]> {
  const base = useMirror
    ? "https://bmclapi2.bangbang93.com/fabric-meta/v2/versions"
    : "https://meta.fabricmc.net/v2/versions";
  type Item = { version: string; stable: boolean };
  const list = await fetchJson<Item[]>(`${base}/loader`);
  return (list ?? [])
    .filter((item) => item.version !== "0.12.0")
    .filter((item) => (onlyStable ? item.stable : true))
    .map((item) => ({ version: item.version, stable: item.stable }));
}

export async function listNeoForgeData(useMirror: boolean): Promise<{
  minecraftVersions: string[];
  neoForgeVersions: string[];
}> {
  if (useMirror) {
    type FileEntry = { name: string };
    type Detail = { files?: FileEntry[] };
    const legacy = await fetchJson<Detail>(
      "https://bmclapi2.bangbang93.com/neoforge/meta/api/maven/details/releases/net/neoforged/forge",
    );
    const modern = await fetchJson<Detail>(
      "https://bmclapi2.bangbang93.com/neoforge/meta/api/maven/details/releases/net/neoforged/neoforge",
    );
    const neoForgeVersions: string[] = [];
    for (const file of legacy.files ?? []) {
      const name = file.name.replace("1.20.1-", "");
      if (!name.includes("maven-metadata")) neoForgeVersions.push(name);
    }
    const mavenData: string[] = [];
    for (const file of modern.files ?? []) {
      if (!file.name.includes("maven-metadata")) mavenData.push(file.name);
    }
    neoForgeVersions.push(...mavenData);
    const minecraftVersions = [
      ...new Set(mavenData.map((v) => `1.${v.slice(0, 4)}`)),
      "1.20.1",
    ];
    return { minecraftVersions, neoForgeVersions };
  }
  return listNeoForgeData(true);
}

export function filterNeoForgeVersionsForMc(
  mcVersion: string,
  all: string[],
): string[] {
  if (mcVersion === "1.20.1") {
    return all.filter((v) => v.startsWith("47"));
  }
  // WPF: Substring(2) 前缀
  const prefix = mcVersion.startsWith("1.") ? mcVersion.slice(2) : mcVersion;
  return all.filter((v) => v.startsWith(prefix));
}

export async function listQuiltMinecraftVersions(
  useMirror: boolean,
  onlyStable = true,
): Promise<VersionOption[]> {
  const base = useMirror
    ? "https://bmclapi2.bangbang93.com/quilt-meta"
    : "https://meta.quiltmc.org";
  type Item = { version: string; stable: boolean };
  const list = await fetchJson<Item[]>(`${base}/v3/versions/game`);
  return (list ?? [])
    .filter((item) => (onlyStable ? item.stable : true))
    .map((item) => ({ version: item.version, stable: item.stable }));
}

export async function listQuiltLoaderVersions(
  useMirror: boolean,
): Promise<string[]> {
  const base = useMirror
    ? "https://bmclapi2.bangbang93.com/quilt-meta"
    : "https://meta.quiltmc.org";
  type Item = { version?: string } | string;
  const list = await fetchJson<Item[]>(`${base}/v3/versions/loader`);
  return (list ?? [])
    .map((item) => (typeof item === "string" ? item : item.version))
    .filter((v): v is string => Boolean(v));
}

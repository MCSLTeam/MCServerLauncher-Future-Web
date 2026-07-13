const SPECIAL_VERSIONS: Readonly<
  Record<string, readonly [number, number, number, number]>
> = {
  horn: [1, 19, 2, 0],
  GreatHorn: [1, 19, 3, 0],
  Executions: [1, 19, 4, 0],
  Trials: [1, 20, 1, 0],
  Net: [1, 20, 2, 0],
  Whisper: [1, 20, 4, 0],
  general: [0, 0, 0, 0],
  snapshot: [0, 0, 0, 0],
  release: [0, 0, 0, 0],
};

type VersionTuple = readonly [number, number, number, number];

export function minecraftVersionTuple(version: string): VersionTuple {
  if (!version.includes(".") && !version.includes("-")) {
    return SPECIAL_VERSIONS[version] ?? [0, 0, 0, 0];
  }

  const snapshot = /^(\d+)w(\d+)([a-z])$/.exec(version);
  if (snapshot) {
    return [
      Number(snapshot[1]),
      Number(snapshot[2]),
      snapshot[3].charCodeAt(0) - "a".charCodeAt(0) + 1,
      0,
    ];
  }

  const normalized = version
    .toLowerCase()
    .replace(/[-_]/g, ".")
    .replaceAll("rc", "")
    .replaceAll(" Pre-Release ", ".pre")
    .replaceAll("pre", "")
    .replaceAll("snapshot", "0")
    .replaceAll(".beta", "beta")
    .replaceAll("beta", "0");
  const parts = normalized
    .split(".")
    .map((part) => part.replace(/\D/g, ""))
    .filter(Boolean)
    .slice(0, 4)
    .map(Number);

  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 0];
}

export function compareMinecraftVersions(left: string, right: string): number {
  const leftKey = minecraftVersionTuple(left);
  const rightKey = minecraftVersionTuple(right);
  const leftComparator = leftKey
    .slice(0, 3)
    .map((part) => String(part).padStart(3, "0"))
    .join(".");
  const rightComparator = rightKey
    .slice(0, 3)
    .map((part) => String(part).padStart(3, "0"))
    .join(".");
  if (leftComparator === rightComparator) return 0;
  return leftComparator > rightComparator ? -1 : 1;
}

export function sortMinecraftVersions(versions: readonly string[]): string[] {
  return versions
    .map((version, index) => ({ version, index }))
    .sort(
      (left, right) =>
        compareMinecraftVersions(left.version, right.version) ||
        left.index - right.index,
    )
    .map(({ version }) => version);
}

export function formatMinecraftVersion(
  version: string,
  style: "plain" | "minecraft-prefixed" = "plain",
): string {
  return style === "minecraft-prefixed" ? `Minecraft ${version}` : version;
}

export function normalizeNumericMinecraftVersion(version: string): string {
  const parts = version.split(".").filter(Boolean);
  if (
    parts.length < 1 ||
    parts.length > 3 ||
    parts.some((part) => !/^\d+$/.test(part) || Number(part) > 65_535)
  ) {
    throw new Error(
      `Invalid Minecraft version '${version}': expected 1-3 numeric components`,
    );
  }
  return [...parts.map(Number), 0, 0].slice(0, 3).join(".");
}

import type { DaemonSystemInfo } from "@/lib/daemon/types";
import {
  loadAutoRefreshPreference as loadAutoRefreshFromPrefs,
  saveAutoRefreshPreference as saveAutoRefreshToPrefs,
} from "@/lib/settings-store";

/** 与 WPF DaemonCardModel 资源展示对齐的派生视图 */
export type DaemonResourceView = {
  systemType: "Windows" | "Darwin" | "Linux" | null;
  systemVersion: string;
  daemonVersion: string;
  cpuUsage: number;
  memoryUsage: number;
  driveUsage: number;
  cpuUsageText: string;
  memoryUsageText: string;
  driveUsageText: string;
  driveUsageTooltip: string;
  resourceSummary: string;
  lastErrorMessage: string;
};

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function calculateUsagePercentage(total: number, free: number) {
  if (!total || total <= 0) return 0;
  const used = total > free ? total - free : 0;
  return clampPercentage((used * 100) / total);
}

function formatSize(bytes: number) {
  const suffixes = ["B", "KB", "MB", "GB", "TB"] as const;
  let value = Math.max(0, bytes);
  let index = 0;
  while (value >= 1024 && index < suffixes.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 2)} ${suffixes[index]}`;
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function pickOs(info: DaemonSystemInfo) {
  const os = info.os ?? {};
  return {
    name: String(os.name ?? ""),
    arch: String(os.architecture ?? os.arch ?? ""),
  };
}

function pickCpu(info: DaemonSystemInfo) {
  const cpu = info.cpu ?? {};
  const count = asNumber(cpu.count ?? cpu.cores, 1);
  return {
    vendor: String(cpu.vendor ?? ""),
    name: String(cpu.name ?? ""),
    count,
    usage: asNumber(cpu.usage),
    coreCount: asNumber(cpu.core_count ?? cpu.coreCount ?? cpu.cores, count),
    threadCount: asNumber(
      cpu.thread_count ?? cpu.threadCount ?? cpu.count ?? cpu.cores,
      count,
    ),
  };
}

function pickMem(info: DaemonSystemInfo) {
  const mem = info.mem ?? {};
  // V2：total_kilobytes / free_kilobytes；兼容旧 total/free
  return {
    total: asNumber(mem.total_kilobytes ?? mem.totalKilobytes ?? mem.total),
    free: asNumber(mem.free_kilobytes ?? mem.freeKilobytes ?? mem.free),
  };
}

type DriveView = {
  name: string;
  driveFormat: string;
  total: number;
  free: number;
};

function mapDrive(
  drive:
    | {
        name?: string;
        drive_format?: string;
        driveFormat?: string;
        total?: number;
        free?: number;
        total_bytes?: number;
        free_bytes?: number;
      }
    | null
    | undefined,
): DriveView {
  return {
    name: String(drive?.name ?? ""),
    driveFormat: String(drive?.drive_format ?? drive?.driveFormat ?? ""),
    total: asNumber(drive?.total_bytes ?? drive?.total),
    free: asNumber(drive?.free_bytes ?? drive?.free),
  };
}

/** 列表盘符：按 total+name 去重，避免 macOS 多挂载点把同一物理盘加多次 */
function pickDrives(info: DaemonSystemInfo): DriveView[] {
  const raw = Array.isArray(info.drives)
    ? info.drives
    : info.drive
      ? [info.drive]
      : [];
  const mapped = raw.map((d) => mapDrive(d)).filter((d) => d.total > 0);
  const seen = new Set<string>();
  const unique: DriveView[] = [];
  for (const drive of mapped) {
    const key = `${drive.total}:${drive.free}:${drive.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(drive);
  }
  return unique;
}

/**
 * 主磁盘条：优先 Daemon 根卷 `drive`（GetDiskInfo），
 * 不再把 drives[] 全部相加（macOS 多卷会虚高）。
 */
function pickPrimaryDrive(info: DaemonSystemInfo): DriveView | null {
  if (info.drive) {
    const mapped = mapDrive(info.drive);
    if (mapped.total > 0) return mapped;
  }
  const drives = pickDrives(info);
  if (drives.length === 0) return null;
  const prefer = drives.find(
    (d) =>
      d.name === "/" ||
      /^[a-z]:\\?$/i.test(d.name.trim()) ||
      d.name.toLowerCase().includes("system"),
  );
  return prefer ?? drives[0] ?? null;
}

function friendlyOsName(
  raw: string,
  systemType: DaemonResourceView["systemType"],
) {
  const name = raw.trim();
  if (!name) {
    if (systemType === "Darwin") return "macOS";
    if (systemType === "Windows") return "Windows";
    if (systemType === "Linux") return "Linux";
    return "";
  }
  if (/^unix\b/i.test(name) && systemType === "Darwin") {
    return name.replace(/^unix/i, "macOS");
  }
  if (/^unix\b/i.test(name) && systemType === "Linux") {
    return name.replace(/^unix/i, "Linux");
  }
  return name;
}

export function inferSystemType(
  info: DaemonSystemInfo | null | undefined,
): DaemonResourceView["systemType"] {
  if (!info) return null;
  const os = pickOs(info);
  const cpu = pickCpu(info);
  const osName = os.name.toLowerCase();
  const arch = os.arch.toLowerCase();
  const cpuVendor = cpu.vendor.toLowerCase();
  const cpuName = cpu.name.toLowerCase();
  const primary = info.drive
    ? mapDrive(info.drive)
    : (pickDrives(info)[0] ?? null);
  const format = (primary?.driveFormat ?? "").toLowerCase();

  if (
    osName.includes("windows nt") ||
    osName.includes("windows") ||
    osName.includes("win32") ||
    osName.includes("microsoft")
  ) {
    return "Windows";
  }

  // 明确 macOS / Darwin
  if (
    osName.includes("darwin") ||
    osName.includes("mac os") ||
    osName.includes("macos") ||
    osName.includes("os x") ||
    osName.includes("osx") ||
    cpuVendor.includes("apple") ||
    cpuName.includes("apple") ||
    /\bm[1-4](\s|pro|max|ultra|$)/i.test(cpu.name) ||
    format === "apfs" ||
    format.includes("hfs")
  ) {
    return "Darwin";
  }

  // 明确 Linux
  if (
    osName.includes("linux") ||
    osName.includes("ubuntu") ||
    osName.includes("debian") ||
    osName.includes("fedora") ||
    osName.includes("centos") ||
    osName.includes("arch") ||
    format.includes("ext") ||
    format.includes("xfs") ||
    format.includes("btrfs")
  ) {
    return "Linux";
  }

  // .NET 在 Unix 上常返回 "Unix …"：无 Apple/APFS 线索时按 Linux 处理
  if (osName.includes("unix")) {
    // arm64 + 无 Linux 文件系统线索时，多数桌面场景是 Apple Silicon macOS
    if (arch.includes("arm64") || arch.includes("aarch64")) {
      return "Darwin";
    }
    return "Linux";
  }

  return null;
}

export function buildResourceView(
  info: DaemonSystemInfo | null | undefined,
  labels: {
    notLoaded: string;
    loadFailed: string;
    cpu: string;
    memory: string;
    drive: string;
  },
  errorMessage = "",
): DaemonResourceView {
  if (!info) {
    return {
      systemType: null,
      systemVersion: errorMessage ? labels.loadFailed : labels.notLoaded,
      daemonVersion: errorMessage ? labels.loadFailed : labels.notLoaded,
      cpuUsage: 0,
      memoryUsage: 0,
      driveUsage: 0,
      cpuUsageText: errorMessage ? labels.loadFailed : labels.notLoaded,
      memoryUsageText: errorMessage ? labels.loadFailed : labels.notLoaded,
      driveUsageText: errorMessage ? labels.loadFailed : labels.notLoaded,
      driveUsageTooltip: errorMessage ? labels.loadFailed : labels.notLoaded,
      resourceSummary: errorMessage ? labels.loadFailed : labels.notLoaded,
      lastErrorMessage: errorMessage,
    };
  }

  const os = pickOs(info);
  const cpu = pickCpu(info);
  const mem = pickMem(info);
  const drives = pickDrives(info);
  const primaryDrive = pickPrimaryDrive(info);
  const systemType = inferSystemType(info);
  const cpuUsage = clampPercentage(cpu.usage);
  const memoryUsage = calculateUsagePercentage(mem.total, mem.free);
  const usedMemoryKb = mem.total > mem.free ? mem.total - mem.free : 0;
  const totalDrive = primaryDrive?.total ?? 0;
  const freeDrive = primaryDrive?.free ?? 0;
  const usedDrive = totalDrive > freeDrive ? totalDrive - freeDrive : 0;
  const driveUsage = calculateUsagePercentage(totalDrive, freeDrive);
  const daemonVersion =
    String(info.daemon_version ?? info.daemonVersion ?? "").trim() ||
    labels.loadFailed;
  const osLabel = friendlyOsName(os.name, systemType);

  return {
    systemType,
    systemVersion: `${osLabel}${os.arch ? ` (${os.arch})` : ""}`.trim(),
    daemonVersion,
    cpuUsage,
    memoryUsage,
    driveUsage,
    cpuUsageText: `${cpuUsage.toFixed(2)}% (${cpu.coreCount}C / ${cpu.threadCount}T)`,
    memoryUsageText: `${memoryUsage.toFixed(2)}% (${formatSize(usedMemoryKb * 1024)} / ${formatSize(mem.total * 1024)})`,
    driveUsageText: `${driveUsage.toFixed(2)}% (${formatSize(usedDrive)} / ${formatSize(totalDrive)})`,
    driveUsageTooltip: (drives.length > 0
      ? drives
      : primaryDrive
        ? [primaryDrive]
        : []
    )
      .map((d) => {
        const used = d.total > d.free ? d.total - d.free : 0;
        const pct = calculateUsagePercentage(d.total, d.free).toFixed(2);
        const name = d.name || d.driveFormat || "drive";
        return `${name}: ${pct}% (${formatSize(used)} / ${formatSize(d.total)})`;
      })
      .join("\n"),
    resourceSummary: `${labels.cpu} ${cpuUsage.toFixed(2)}% | ${labels.memory} ${memoryUsage.toFixed(2)}% | ${labels.drive} ${driveUsage.toFixed(2)}%`,
    lastErrorMessage: "",
  };
}

export const REFRESH_INTERVAL_OPTIONS = [5, 20, 30, 45, 60] as const;
export type RefreshIntervalSeconds = (typeof REFRESH_INTERVAL_OPTIONS)[number];

export function normalizeRefreshInterval(
  seconds: number,
): RefreshIntervalSeconds {
  if ((REFRESH_INTERVAL_OPTIONS as readonly number[]).includes(seconds)) {
    return seconds as RefreshIntervalSeconds;
  }
  for (const option of REFRESH_INTERVAL_OPTIONS) {
    if (seconds <= option) return option;
  }
  return REFRESH_INTERVAL_OPTIONS[REFRESH_INTERVAL_OPTIONS.length - 1];
}

/** 自动刷新偏好存后端 preferences；签名保持兼容 */
export function loadAutoRefreshPreference(): {
  enabled: boolean;
  seconds: RefreshIntervalSeconds;
} {
  const pref = loadAutoRefreshFromPrefs();
  return {
    enabled: Boolean(pref.enabled),
    seconds: normalizeRefreshInterval(Number(pref.seconds ?? 30)),
  };
}

export function saveAutoRefreshPreference(
  enabled: boolean,
  seconds: RefreshIntervalSeconds,
) {
  void saveAutoRefreshToPrefs({
    enabled,
    seconds: normalizeRefreshInterval(seconds),
  });
}

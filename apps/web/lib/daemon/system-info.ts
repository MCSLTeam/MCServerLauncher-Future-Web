import type { DaemonSystemInfo } from "@/lib/daemon/types";

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
    arch: String(os.arch ?? ""),
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
  // 协议：MemInfo Total/Free 单位为 KB
  return {
    total: asNumber(mem.total),
    free: asNumber(mem.free),
  };
}

function pickDrives(info: DaemonSystemInfo) {
  const drivesRaw = Array.isArray(info.drives)
    ? info.drives
    : info.drive
      ? [info.drive]
      : [];
  return drivesRaw.map((drive) => ({
    name: String(drive?.name ?? ""),
    driveFormat: String(drive?.drive_format ?? drive?.driveFormat ?? ""),
    total: asNumber(drive?.total),
    free: asNumber(drive?.free),
  }));
}

export function inferSystemType(
  info: DaemonSystemInfo | null | undefined,
): DaemonResourceView["systemType"] {
  if (!info) return null;
  const osName = pickOs(info).name;
  const cpuVendor = pickCpu(info).vendor;
  if (osName.includes("Windows NT") || /windows/i.test(osName))
    return "Windows";
  if (osName.includes("Unix") || /darwin|mac|linux/i.test(osName)) {
    if (cpuVendor.includes("Apple") || /darwin|mac/i.test(osName)) {
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
  const cpuUsage = clampPercentage(cpu.usage);
  const memoryUsage = calculateUsagePercentage(mem.total, mem.free);
  const usedMemoryKb = mem.total > mem.free ? mem.total - mem.free : 0;
  const totalDrive = drives.reduce((sum, d) => sum + d.total, 0);
  const freeDrive = drives.reduce((sum, d) => sum + d.free, 0);
  const usedDrive = totalDrive > freeDrive ? totalDrive - freeDrive : 0;
  const driveUsage = calculateUsagePercentage(totalDrive, freeDrive);
  const daemonVersion =
    String(info.daemon_version ?? info.daemonVersion ?? "").trim() ||
    labels.loadFailed;

  return {
    systemType: inferSystemType(info),
    systemVersion: `${os.name} (${os.arch})`.trim(),
    daemonVersion,
    cpuUsage,
    memoryUsage,
    driveUsage,
    cpuUsageText: `${cpuUsage.toFixed(2)}% (${cpu.coreCount}C / ${cpu.threadCount}T)`,
    memoryUsageText: `${memoryUsage.toFixed(2)}% (${formatSize(usedMemoryKb * 1024)} / ${formatSize(mem.total * 1024)})`,
    driveUsageText: `${driveUsage.toFixed(2)}% (${formatSize(usedDrive)} / ${formatSize(totalDrive)})`,
    driveUsageTooltip: drives
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

const AUTO_REFRESH_KEY = "mcsl-web-daemon-auto-refresh";

export function loadAutoRefreshPreference(): {
  enabled: boolean;
  seconds: RefreshIntervalSeconds;
} {
  if (typeof window === "undefined") {
    return { enabled: false, seconds: 30 };
  }
  try {
    const raw = window.localStorage.getItem(AUTO_REFRESH_KEY);
    if (!raw) return { enabled: false, seconds: 30 };
    const parsed = JSON.parse(raw) as { enabled?: boolean; seconds?: number };
    const seconds = normalizeRefreshInterval(Number(parsed.seconds ?? 30));
    return {
      enabled: Boolean(parsed.enabled) && seconds > 0,
      seconds,
    };
  } catch {
    return { enabled: false, seconds: 30 };
  }
}

export function saveAutoRefreshPreference(
  enabled: boolean,
  seconds: RefreshIntervalSeconds,
) {
  window.localStorage.setItem(
    AUTO_REFRESH_KEY,
    JSON.stringify({ enabled, seconds: normalizeRefreshInterval(seconds) }),
  );
}

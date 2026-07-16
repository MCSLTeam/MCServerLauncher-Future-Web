import type { InstanceStatus, NodeStatus } from "@/lib/types";
import type {
  InstanceFactorySettingPayload,
  JavaInfo,
} from "@/lib/create/types";

export type DaemonActionResponse<T = unknown> = {
  status: "ok" | "error" | string;
  retcode: number;
  data: T | null;
  message: string;
  id: string;
};

export type { InstanceFactorySettingPayload, JavaInfo };

export type DaemonJavaListResult = {
  java_list?: JavaInfo[];
  javaList?: JavaInfo[];
  JavaList?: JavaInfo[];
  list?: JavaInfo[];
};

export type DaemonFileUploadRequestResult = {
  file_id?: string;
  fileId?: string;
};

export type DaemonAddInstanceResult = {
  config?: DaemonInstanceConfig;
};

export type DaemonBinaryUploadResponse = {
  file_id?: string;
  fileId?: string;
  done?: boolean;
  received?: number;
  error?: string;
};

/** 对齐 Common.ProtoType.Status.SystemInfo（snake_case 线协议） */
export type DaemonSystemInfo = {
  name?: string;
  version?: string;
  api_version?: string;
  daemon_version?: string;
  daemonVersion?: string;
  os?: { name?: string; arch?: string; version?: string };
  cpu?: {
    vendor?: string;
    name?: string;
    count?: number;
    cores?: number;
    usage?: number;
    core_count?: number;
    coreCount?: number;
    thread_count?: number;
    threadCount?: number;
  };
  mem?: { total?: number; free?: number };
  drive?: {
    name?: string;
    drive_format?: string;
    driveFormat?: string;
    total?: number;
    free?: number;
  };
  drives?: Array<{
    name?: string;
    drive_format?: string;
    driveFormat?: string;
    total?: number;
    free?: number;
  }>;
  [key: string]: unknown;
};

export type DaemonInstanceConfig = {
  name?: string;
  target?: string;
  instance_type?: string;
  target_type?: string;
  uuid?: string;
  mc_version?: string;
  java_path?: string;
  arguments?: string[];
  [key: string]: unknown;
};

export type DaemonInstanceReport = {
  status?: string;
  config?: DaemonInstanceConfig;
  properties?: Record<string, string>;
  players?: unknown[];
  performance_counter?: { cpu?: number; memory?: number };
  [key: string]: unknown;
};

export type DaemonConnectionState = {
  nodeId: string;
  status: NodeStatus;
  error?: string | null;
  lastPongAt?: number | null;
  systemInfo?: DaemonSystemInfo | null;
};

export type DaemonLiveInstance = {
  id: string;
  nodeId: string;
  nodeName: string;
  name: string;
  status: InstanceStatus;
  type: string;
  gameVersion?: string;
  cpu?: number;
  memory?: number;
  raw: DaemonInstanceReport;
};

export function mapDaemonStatus(status: unknown): InstanceStatus {
  const value = String(status ?? "stopped").toLowerCase();
  if (value === "running") return "running";
  if (value === "crashed") return "crashed";
  if (value === "starting") return "starting";
  if (value === "stopping") return "stopping";
  if (value === "installing") return "installing";
  return "stopped";
}

export function wsUrl(
  host: string,
  port: string,
  secure: boolean,
  token: string,
) {
  const scheme = secure ? "wss" : "ws";
  return `${scheme}://${host}:${port}/api/v1?token=${encodeURIComponent(token)}`;
}

export function httpInfoUrl(host: string, port: string, secure: boolean) {
  const scheme = secure ? "https" : "http";
  return `${scheme}://${host}:${port}/info`;
}

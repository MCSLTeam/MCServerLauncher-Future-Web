import type { InstanceStatus, NodeStatus } from "@/lib/types";
import type {
  InstanceFactorySettingPayload,
  JavaInfo,
} from "@/lib/create/types";

/** JSON-RPC 2.0 success/error envelopes used by Protocol V2. */
export type JsonRpcSuccessResponse<T = unknown> = {
  jsonrpc: "2.0";
  id: string | number;
  result: T;
};

export type JsonRpcErrorObject = {
  code: number;
  message: string;
  data?: {
    kind?: string;
    code?: string;
    message?: string;
    /** V2 wire: e.g. instance.not_running */
    daemon_error_code?: string;
    /** V2 wire: validation | not_found | conflict | … */
    daemon_error_kind?: string;
    correlation_id?: string;
    details?: unknown;
    [key: string]: unknown;
  };
};

export type JsonRpcErrorResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  error: JsonRpcErrorObject;
};

export type JsonRpcResponse<T = unknown> =
  | JsonRpcSuccessResponse<T>
  | JsonRpcErrorResponse;

/** @deprecated V1 name retained as alias while call sites migrate. */
export type DaemonActionResponse<T = unknown> = {
  status: "ok" | "error" | string;
  retcode: number;
  data: T | null;
  message: string;
  id: string;
};

export type { InstanceFactorySettingPayload, JavaInfo };

export const V2_METHODS = {
  ping: "mcsl.daemon.ping",
  systemInfo: "mcsl.system.info.get",
  javaList: "mcsl.java.list",
  listReports: "mcsl.instance.report.list",
  getReport: "mcsl.instance.report.get",
  getLog: "mcsl.instance.log.get",
  start: "mcsl.instance.start",
  stop: "mcsl.instance.stop",
  halt: "mcsl.instance.halt",
  remove: "mcsl.instance.remove",
  sendCommand: "mcsl.instance.command.send",
  consoleOpen: "mcsl.instance.console.open",
  consoleResize: "mcsl.instance.console.resize",
  consoleClose: "mcsl.instance.console.close",
  create: "mcsl.instance.create",
  getSettings: "mcsl.instance.settings.get",
  updateSettings: "mcsl.instance.settings.update",
  getEventRules: "mcsl.instance.event-rules.get",
  updateEventRules: "mcsl.instance.event-rules.update",
  directoryInfo: "mcsl.directory.info.get",
  createDirectory: "mcsl.directory.create",
  deleteDirectory: "mcsl.directory.delete",
  renameDirectory: "mcsl.directory.rename",
  deleteFile: "mcsl.file.delete",
  renameFile: "mcsl.file.rename",
  uploadOpen: "mcsl.file.upload.open",
  uploadClose: "mcsl.file.upload.close",
  uploadCancel: "mcsl.file.upload.cancel",
  downloadOpen: "mcsl.file.download.open",
  downloadRead: "mcsl.file.download.read",
  downloadClose: "mcsl.file.download.close",
  subscribe: "mcsl.event.subscribe",
  unsubscribe: "mcsl.event.unsubscribe",
  discover: "rpc.discover",
} as const;

export const V2_EVENTS = {
  instanceLog: "mcsl.event.instance.log",
  notification: "mcsl.event.notification",
  daemonReport: "mcsl.event.daemon.report",
  catalogChanged: "mcsl.event.instance.catalog.changed",
} as const;

export const V2_UPLOAD_ACK_METHOD = "mcsl.file.upload.ack";

export type DaemonJavaListResult = {
  items?: JavaInfo[];
  java_list?: JavaInfo[];
  javaList?: JavaInfo[];
  JavaList?: JavaInfo[];
  list?: JavaInfo[];
};

export type DaemonConsoleSession = {
  session_id?: string;
  sessionId?: string;
  instance_id?: string;
  instanceId?: string;
  expires_at?: string;
  expiresAt?: string;
  max_chunk_size?: number;
  maxChunkSize?: number;
  columns?: number;
  rows?: number;
};

export type DaemonUploadSession = {
  session_id?: string;
  sessionId?: string;
  max_chunk_size?: number;
  maxChunkSize?: number;
  expires_at?: string;
};

export type DaemonDownloadSession = {
  session_id?: string;
  sessionId?: string;
  length?: number;
  sha256?: string;
  max_chunk_size?: number;
  maxChunkSize?: number;
  expires_at?: string;
};

export type DaemonDownloadReadResult = {
  session_id?: string;
  sessionId?: string;
  offset?: number;
  length?: number;
  is_final?: boolean;
  isFinal?: boolean;
};

export type DaemonAddInstanceResult = {
  config?: DaemonInstanceConfig;
};

/** 对齐 Contracts.System.SystemInfo（snake_case） */
export type DaemonSystemInfo = {
  name?: string;
  version?: string;
  api_version?: string;
  daemon_version?: string;
  daemonVersion?: string;
  os?: { name?: string; architecture?: string; arch?: string; version?: string };
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
  mem?: {
    total?: number;
    free?: number;
    total_kilobytes?: number;
    free_kilobytes?: number;
    totalKilobytes?: number;
    freeKilobytes?: number;
  };
  drive?: {
    name?: string;
    drive_format?: string;
    driveFormat?: string;
    total?: number;
    free?: number;
    total_bytes?: number;
    free_bytes?: number;
  };
  drives?: Array<{
    name?: string;
    drive_format?: string;
    driveFormat?: string;
    total?: number;
    free?: number;
    total_bytes?: number;
    free_bytes?: number;
  }>;
  [key: string]: unknown;
};

export type DaemonInstanceConfig = {
  name?: string;
  target?: string;
  instance_type?: string;
  target_type?: string;
  instance_id?: string;
  uuid?: string;
  version?: string;
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
  performance_counter?: {
    cpu?: number;
    memory?: number;
    memory_bytes?: number;
    memoryBytes?: number;
  };
  process_id?: number | null;
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

/**
 * Daemon wire status is only running|stopped|crashed.
 * MC servers stay `stopped` until the Done log line; while the process is up
 * (process_id > 0) we surface `starting` so the console can attach and stop/kill
 * work before Ready. After stop the daemon clears process_id.
 */
export function mapDaemonStatus(
  status: unknown,
  options?: { processId?: number | null },
): InstanceStatus {
  const value = String(status ?? "stopped").toLowerCase();
  if (value === "running") return "running";
  if (value === "crashed") return "crashed";
  if (value === "starting") return "starting";
  if (value === "stopping") return "stopping";
  if (value === "installing") return "installing";
  if (value === "stopped" || value === "") {
    const pid = options?.processId;
    if (typeof pid === "number" && Number.isFinite(pid) && pid > 0) {
      return "starting";
    }
  }
  return "stopped";
}

/** Console attach / command / stop while process is up (running or MC boot). */
export function isInstanceProcessUp(status: InstanceStatus): boolean {
  return status === "running" || status === "starting";
}

export function wsUrl(
  host: string,
  port: string,
  secure: boolean,
  token: string,
) {
  const scheme = secure ? "wss" : "ws";
  return `${scheme}://${host}:${port}/api/v2?token=${encodeURIComponent(token)}`;
}

export function httpInfoUrl(host: string, port: string, secure: boolean) {
  const scheme = secure ? "https" : "http";
  return `${scheme}://${host}:${port}/info`;
}

import {
  buildBinaryUploadFrame,
  sha1Bytes,
  sha1Hex,
} from "@/lib/daemon/binary";
import { tKey } from "@/lib/i18n/translate";
import {
  type DaemonActionResponse,
  type DaemonAddInstanceResult,
  type DaemonBinaryUploadResponse,
  type DaemonFileUploadRequestResult,
  type DaemonInstanceConfig,
  type DaemonInstanceReport,
  type DaemonJavaListResult,
  type DaemonSystemInfo,
  type InstanceFactorySettingPayload,
  type JavaInfo,
  wsUrl,
} from "@/lib/daemon/types";

type Pending = {
  resolve: (value: DaemonActionResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

type PendingBinary = {
  resolve: (value: { done: boolean; received: number }) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

/** Daemon 主动推送事件（见 protocol topics/event.md） */
export type DaemonEventPacket = {
  event: string;
  meta?: Record<string, unknown> | null;
  data?: Record<string, unknown> | null;
  time?: number;
};

export type DaemonEventListener = (packet: DaemonEventPacket) => void;

export type DaemonClientOptions = {
  host: string;
  port: string;
  secure: boolean;
  token: string;
  requestTimeoutMs?: number;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (data: unknown) => void;
  onEvent?: DaemonEventListener;
};

export type UploadProgress = {
  loaded: number;
  total: number;
  done: boolean;
};

/**
 * MCSL Future Daemon WebSocket action 客户端。
 * 协议：ws(s)://host:port/api/v1?token=...
 * 请求：{ action, params, id }  响应：{ status, retcode, data, message, id }
 */

/** Reverse Encoding.BigEndianUnicode.GetString used by file_download_range. */
function bigEndianUnicodeToBytes(content: string, byteLength: number): Uint8Array {
  const out = new Uint8Array(byteLength);
  let o = 0;
  for (let i = 0; i < content.length && o < byteLength; i++) {
    const c = content.charCodeAt(i);
    if (o < byteLength) out[o++] = (c >> 8) & 0xff;
    if (o < byteLength) out[o++] = c & 0xff;
  }
  return out;
}

export class DaemonClient {
  private socket: WebSocket | null = null;
  private pending = new Map<string, Pending>();
  private pendingBinary = new Map<string, PendingBinary>();
  private eventListeners = new Set<DaemonEventListener>();
  private closedByUser = false;
  private readonly timeoutMs: number;

  constructor(private readonly options: DaemonClientOptions) {
    this.timeoutMs = options.requestTimeoutMs ?? 12_000;
    if (options.onEvent) {
      this.eventListeners.add(options.onEvent);
    }
  }

  /** 注册事件监听；返回取消订阅函数 */
  onEvent(listener: DaemonEventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  get ready() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    this.closedByUser = false;
    const url = wsUrl(
      this.options.host,
      this.options.port,
      this.options.secure,
      this.options.token,
    );

    return new Promise((resolve, reject) => {
      let settled = false;
      const socket = new WebSocket(url);
      this.socket = socket;

      socket.onopen = () => {
        settled = true;
        this.options.onOpen?.();
        resolve();
      };

      socket.onerror = (event) => {
        this.options.onError?.(event);
        if (!settled) {
          settled = true;
          reject(new Error(tKey("shared.daemon.error.ws-failed")));
        }
      };

      socket.onclose = (event) => {
        this.rejectAll(new Error(event.reason || tKey("shared.daemon.error.disconnected")));
        this.options.onClose?.(event);
        if (!settled) {
          settled = true;
          reject(new Error(event.reason || tKey("shared.daemon.error.ws-closed")));
        }
      };

      socket.onmessage = (event) => {
        void this.handleMessage(event.data);
      };
    });
  }

  close() {
    this.closedByUser = true;
    this.rejectAll(new Error(tKey("shared.daemon.error.disconnected")));
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // ignore
      }
      this.socket = null;
    }
  }

  get intentionallyClosed() {
    return this.closedByUser;
  }

  async request<T = unknown>(
    action: string,
    params: Record<string, unknown> | null = {},
    timeoutMs?: number,
  ): Promise<T> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error(tKey("shared.daemon.error.not-connected"));
    }
    const id = crypto.randomUUID();
    const payload = {
      action,
      params: params ?? {},
      id,
    };
    const timeout = timeoutMs ?? this.timeoutMs;

    const response = await new Promise<DaemonActionResponse>(
      (resolve, reject) => {
        const timer = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error(tKey("shared.daemon.error.request-timeout", { action })));
        }, timeout);
        this.pending.set(id, { resolve, reject, timer });
        try {
          this.socket!.send(JSON.stringify(payload));
        } catch (error) {
          clearTimeout(timer);
          this.pending.delete(id);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      },
    );

    if (response.status !== "ok" || response.retcode !== 0) {
      throw new Error(response.message || tKey("shared.daemon.error.action-failed", { action }));
    }
    return response.data as T;
  }

  ping() {
    return this.request<{ time?: number }>("ping", {});
  }

  getSystemInfo() {
    return this.request<{ info?: DaemonSystemInfo } | DaemonSystemInfo>(
      "get_system_info",
      {},
    );
  }

  getAllReports() {
    return this.request<{ reports?: Record<string, DaemonInstanceReport> }>(
      "get_all_reports",
      {},
    );
  }

  /**
   * 订阅 Daemon 事件。instance_log 需 meta: { instance_id }。
   * type 使用 snake_case（与协议文档一致）。
   */
  subscribeEvent(type: string, meta: Record<string, unknown> | null = null) {
    return this.request("subscribe_event", { type, meta });
  }

  unsubscribeEvent(type: string, meta: Record<string, unknown> | null = null) {
    return this.request("unsubscribe_event", { type, meta });
  }

  /** 订阅某实例实时日志推送；返回清理函数（取消订阅 + 移除监听） */
  async subscribeInstanceLog(
    instanceId: string,
    onLog: (line: string) => void,
  ): Promise<() => void> {
    const meta = { instance_id: instanceId };
    const off = this.onEvent((packet) => {
      if (packet.event !== "instance_log") return;
      const packetMeta = packet.meta ?? {};
      const mid = String(
        packetMeta.instance_id ?? packetMeta.InstanceId ?? "",
      );
      if (mid && mid !== instanceId) return;
      const data = packet.data ?? {};
      const line = data.log ?? data.Log;
      if (line == null) return;
      onLog(String(line));
    });
    try {
      await this.subscribeEvent("instance_log", meta);
    } catch (error) {
      off();
      throw error;
    }
    return () => {
      off();
      void this.unsubscribeEvent("instance_log", meta).catch(() => {
        // 连接已断时忽略
      });
    };
  }

  getInstanceReport(id: string) {
    return this.request<
      { report?: DaemonInstanceReport } | DaemonInstanceReport
    >("get_instance_report", { id });
  }

  getInstanceLogHistory(id: string) {
    return this.request<{ logs?: string[] }>("get_instance_log_history", {
      id,
    });
  }

  getDirectoryInfo(path: string) {
    return this.request<{
      parent?: string | null;
      Parent?: string | null;
      files?: Array<{ name?: string; Name?: string; meta?: { size?: number; Size?: number } }>;
      Files?: Array<{ name?: string; Name?: string; meta?: { size?: number; Size?: number } }>;
      directories?: Array<{ name?: string; Name?: string }>;
      Directories?: Array<{ name?: string; Name?: string }>;
    }>("get_directory_info", { path });
  }

  getInstanceSettings(id: string) {
    return this.request<{
      config?: Record<string, unknown>;
      Config?: Record<string, unknown>;
      working_directory?: string;
      WorkingDirectory?: string;
      current_target_exists?: boolean;
      CurrentTargetExists?: boolean;
      can_edit?: boolean;
      CanEdit?: boolean;
      edit_blocked_reason?: string | null;
      EditBlockedReason?: string | null;
    }>("get_instance_settings", { id });
  }

  getEventRules(instanceId: string) {
    return this.request<{ rules?: unknown[] } | unknown[]>("get_event_rules", {
      instance_id: instanceId,
    });
  }

  saveEventRules(instanceId: string, rules: unknown[]) {
    return this.request("save_event_rules", {
      instance_id: instanceId,
      rules,
    });
  }

  createDirectory(path: string) {
    return this.request("create_directory", { path });
  }

  deleteFile(path: string) {
    return this.request("delete_file", { path });
  }

  deleteDirectory(path: string, recursive = true) {
    return this.request("delete_directory", { path, recursive });
  }

  renameFile(path: string, newName: string) {
    return this.request("rename_file", { path, new_name: newName });
  }

  renameDirectory(path: string, newName: string) {
    return this.request("rename_directory", { path, new_name: newName });
  }

  updateInstanceSettings(params: {
    id: string;
    name: string;
    instance_type: string;
    java_path?: string | null;
    arguments?: string[];
    version?: string | null;
    force_rerun_installer?: boolean;
    replacement_core?: {
      uploaded_source_path: string;
      preferred_target_name?: string | null;
    } | null;
  }) {
    return this.request("update_instance_settings", {
      id: params.id,
      name: params.name,
      instance_type: params.instance_type,
      java_path: params.java_path ?? null,
      arguments: params.arguments ?? [],
      version: params.version ?? null,
      force_rerun_installer: params.force_rerun_installer ?? false,
      replacement_core: params.replacement_core ?? null,
    });
  }

  startInstance(id: string) {
    return this.request("start_instance", { id });
  }

  stopInstance(id: string) {
    return this.request("stop_instance", { id });
  }

  killInstance(id: string) {
    return this.request("kill_instance", { id });
  }

  removeInstance(id: string) {
    return this.request("remove_instance", { id });
  }

  sendToInstance(id: string, message: string) {
    return this.request("send_to_instance", { id, message });
  }

  async getJavaList(timeoutMs = 60_000): Promise<JavaInfo[]> {
    // 首次扫描可能较慢；兼容 snake_case / camelCase / PascalCase
    const data = await this.request<DaemonJavaListResult | JavaInfo[] | Record<string, unknown>>(
      "get_java_list",
      {},
      timeoutMs,
    );
    const root = (data ?? {}) as Record<string, unknown>;
    const rawList = Array.isArray(data)
      ? data
      : (root.java_list ??
          root.javaList ??
          root.JavaList ??
          root.list ??
          []);
    if (!Array.isArray(rawList)) return [];
    return rawList
      .map((item) => {
        const row = (item ?? {}) as Record<string, unknown>;
        const path = String(row.path ?? row.Path ?? "").trim();
        if (!path) return null;
        return {
          path,
          version: String(row.version ?? row.Version ?? "").trim() || "?",
          architecture:
            String(row.architecture ?? row.Architecture ?? "").trim() || "?",
        } satisfies JavaInfo;
      })
      .filter((item): item is JavaInfo => item != null);
  }

  async addInstance(
    setting: InstanceFactorySettingPayload,
    timeoutMs = 600_000,
  ): Promise<DaemonInstanceConfig> {
    const data = await this.request<DaemonAddInstanceResult>(
      "add_instance",
      { setting },
      timeoutMs,
    );
    const config = data?.config ?? (data as unknown as DaemonInstanceConfig);
    if (!config || typeof config !== "object") {
      throw new Error(tKey("shared.daemon.error.create-no-config"));
    }
    return config;
  }

  /**
   * 对齐 DaemonClient.UploadFileAsync：file_upload_request + 二进制分片。
   * @returns Daemon 上的相对路径 `dst`
   */
  async uploadFile(
    file: File | Blob,
    dst: string,
    options?: {
      chunkSize?: number;
      onProgress?: (progress: UploadProgress) => void;
      signal?: AbortSignal;
    },
  ): Promise<string> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error(tKey("shared.daemon.error.not-connected"));
    }
    const chunkSize = options?.chunkSize ?? 1024 * 1024;
    const total = file.size;
    const buffer = new Uint8Array(await file.arrayBuffer());
    const sha1 = await sha1Hex(buffer);

    const req = await this.request<DaemonFileUploadRequestResult>(
      "file_upload_request",
      {
        path: dst,
        sha1,
        size: total,
        timeout: null,
      },
      60_000,
    );
    const fileId = String(req.file_id ?? req.fileId ?? "");
    if (!fileId) throw new Error(tKey("shared.daemon.error.upload-session"));

    let offset = 0;
    try {
      while (offset < total) {
        if (options?.signal?.aborted) {
          throw new Error(tKey("shared.daemon.error.upload-cancelled"));
        }
        const end = Math.min(offset + chunkSize, total);
        const chunk = buffer.subarray(offset, end);
        const checksum = await sha1Bytes(chunk);
        const frame = buildBinaryUploadFrame(fileId, offset, chunk, checksum);
        const { done, received } = await this.sendBinaryChunk(
          fileId,
          frame,
          60_000,
        );
        offset = end;
        options?.onProgress?.({
          loaded: received || offset,
          total,
          done: Boolean(done) || offset >= total,
        });
        if (done) break;
      }
      options?.onProgress?.({ loaded: total, total, done: true });
      return dst;
    } catch (error) {
      try {
        await this.request("file_upload_cancel", { file_id: fileId }, 10_000);
      } catch {
        // ignore
      }
      throw error;
    }
  }

  /**
   * 从 daemon 拉取文件到浏览器 Blob（file_download_* + BigEndianUnicode 解码）。
   * path 为 daemon 虚拟路径，如 /instances/{id}/server.properties
   */
  async downloadFile(
    path: string,
    options?: {
      chunkSize?: number;
      onProgress?: (progress: { loaded: number; total: number }) => void;
    },
  ): Promise<Blob> {
    const chunkSize = options?.chunkSize ?? 256 * 1024;
    const req = await this.request<{
      file_id?: string;
      FileId?: string;
      size?: number;
      Size?: number;
      sha1?: string;
      Sha1?: string;
    }>("file_download_request", { path });
    const fileId = String(req.file_id ?? req.FileId ?? "");
    const total = Number(req.size ?? req.Size ?? 0);
    if (!fileId) throw new Error(tKey("shared.instance.files.download-failed"));

    const chunks: Uint8Array[] = [];
    let loaded = 0;
    try {
      while (loaded < total) {
        const count = Math.min(chunkSize, total - loaded);
        const range = `${loaded}..${loaded + count}`;
        const part = await this.request<{
          content?: string;
          Content?: string;
        }>("file_download_range", {
          file_id: fileId,
          range,
        });
        const content = String(part.content ?? part.Content ?? "");
        const bytes = bigEndianUnicodeToBytes(content, count);
        chunks.push(bytes);
        loaded += count;
        options?.onProgress?.({ loaded, total });
      }
    } finally {
      try {
        await this.request("file_download_close", { file_id: fileId });
      } catch {
        // ignore close errors
      }
    }
    return new Blob(chunks as BlobPart[]);
  }

  private sendBinaryChunk(
    fileId: string,
    frame: ArrayBuffer | ArrayBufferView,
    timeoutMs: number,
  ): Promise<{ done: boolean; received: number }> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error(tKey("shared.daemon.error.not-connected")));
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingBinary.delete(fileId);
        reject(new Error(tKey("shared.daemon.error.request-timeout", { action: "file_upload" })));
      }, timeoutMs);
      this.pendingBinary.set(fileId, { resolve, reject, timer });
      try {
        this.socket!.send(frame);
      } catch (error) {
        clearTimeout(timer);
        this.pendingBinary.delete(fileId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private async handleMessage(raw: unknown) {
    let text: string;
    if (typeof raw === "string") {
      text = raw;
    } else if (raw instanceof ArrayBuffer) {
      text = new TextDecoder().decode(raw);
    } else if (raw instanceof Blob) {
      text = await raw.text();
    } else {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return;
    }

    this.options.onMessage?.(parsed);

    // 批量事件：EventPacket[]
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        this.dispatchIfEvent(item);
      }
      return;
    }

    if (!parsed || typeof parsed !== "object") return;

    // 单条事件推送（无 action id）
    if (this.dispatchIfEvent(parsed)) {
      return;
    }

    const message = parsed as Partial<DaemonActionResponse> &
      DaemonBinaryUploadResponse & {
        event?: string;
        type?: string;
      };

    const binaryFileId = message.file_id ?? message.fileId;
    if (
      typeof binaryFileId === "string" &&
      this.pendingBinary.has(binaryFileId) &&
      typeof message.id !== "string"
    ) {
      const pending = this.pendingBinary.get(binaryFileId)!;
      clearTimeout(pending.timer);
      this.pendingBinary.delete(binaryFileId);
      if (message.error) {
        pending.reject(new Error(String(message.error)));
      } else {
        pending.resolve({
          done: Boolean(message.done),
          received: Number(message.received ?? 0),
        });
      }
      return;
    }

    if (typeof message.id === "string" && this.pending.has(message.id)) {
      const pending = this.pending.get(message.id)!;
      clearTimeout(pending.timer);
      this.pending.delete(message.id);
      pending.resolve({
        status: String(message.status ?? "error"),
        retcode: Number(message.retcode ?? -1),
        data: (message.data ?? null) as unknown,
        message: String(message.message ?? ""),
        id: message.id,
      });
    }
  }

  private dispatchIfEvent(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;
    const packet = value as Record<string, unknown>;
    const eventName = packet.event;
    if (typeof eventName !== "string" || !eventName) return false;
    // action 响应也可能有 data 字段；有 id + status 时不当作 event
    if (typeof packet.id === "string" && packet.status != null) return false;
    const eventPacket: DaemonEventPacket = {
      event: eventName,
      meta:
        packet.meta && typeof packet.meta === "object"
          ? (packet.meta as Record<string, unknown>)
          : null,
      data:
        packet.data && typeof packet.data === "object"
          ? (packet.data as Record<string, unknown>)
          : null,
      time: typeof packet.time === "number" ? packet.time : undefined,
    };
    for (const listener of this.eventListeners) {
      try {
        listener(eventPacket);
      } catch {
        // 单个监听器异常不阻断其它监听
      }
    }
    return true;
  }

  private rejectAll(error: Error) {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
      this.pending.delete(id);
    }
    for (const [id, pending] of this.pendingBinary) {
      clearTimeout(pending.timer);
      pending.reject(error);
      this.pendingBinary.delete(id);
    }
  }
}

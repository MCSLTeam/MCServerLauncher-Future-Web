import {
  BINARY_FRAME_KIND_CONSOLE_INPUT,
  BINARY_FRAME_KIND_CONSOLE_OUTPUT,
  BINARY_FRAME_KIND_DOWNLOAD,
  BINARY_FRAME_KIND_UPLOAD,
  DEFAULT_MAX_CHUNK_SIZE,
  buildBinaryFrame,
  sha256Hex,
  tryReadBinaryFrame,
} from "@/lib/daemon/binary";
import { toDaemonPath } from "@/features/console/virtual-path";
import { tKey } from "@/lib/i18n/translate";
import {
  type DaemonAddInstanceResult,
  type DaemonConsoleSession,
  type DaemonDownloadReadResult,
  type DaemonDownloadSession,
  type DaemonInstanceConfig,
  type DaemonInstanceReport,
  type DaemonJavaListResult,
  type DaemonSystemInfo,
  type DaemonUploadSession,
  type InstanceFactorySettingPayload,
  type JavaInfo,
  type JsonRpcErrorObject,
  V2_EVENTS,
  V2_METHODS,
  V2_UPLOAD_ACK_METHOD,
  wsUrl,
} from "@/lib/daemon/types";

type PendingRpc = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

type PendingUploadAck = {
  resolve: () => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  offset: number;
  length: number;
};

type PendingDownloadChunk = {
  resolve: (payload: Uint8Array) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  offset: number;
  length: number;
};

export type ConsoleOutputListener = (
  sessionId: string,
  payload: Uint8Array,
  offset: number,
) => void;

/** Daemon 主动推送事件（V2 JSON-RPC notification method = event name） */
export type DaemonEventPacket = {
  event: string;
  meta?: Record<string, unknown> | null;
  data?: Record<string, unknown> | null;
  time?: number;
  sequence?: number;
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
 * MCSL Future Daemon WebSocket 客户端（Protocol V2）。
 * 协议：ws(s)://host:port/api/v2?token=...
 * 请求：{ jsonrpc:"2.0", id, method, params }
 * 响应：{ jsonrpc:"2.0", id, result } | { jsonrpc:"2.0", id, error }
 * 事件：{ jsonrpc:"2.0", method:"mcsl.event.*", params:{ sequence, timestamp, data?, meta? } }
 * 上传确认：{ jsonrpc:"2.0", method:"mcsl.file.upload.ack", params:{...} }
 * 二进制：32-byte V2 frame header + payload
 */
export class DaemonClient {
  private socket: WebSocket | null = null;
  private pending = new Map<string, PendingRpc>();
  private pendingUploadAcks = new Map<string, PendingUploadAck>();
  private pendingDownloadChunks = new Map<string, PendingDownloadChunk>();
  private eventListeners = new Set<DaemonEventListener>();
  private consoleOutputListeners = new Map<string, Set<ConsoleOutputListener>>();
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
      socket.binaryType = "arraybuffer";
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
    method: string,
    params: Record<string, unknown> | null = {},
    timeoutMs?: number,
  ): Promise<T> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error(tKey("shared.daemon.error.not-connected"));
    }
    const id = crypto.randomUUID();
    const payload = {
      jsonrpc: "2.0",
      id,
      method,
      params: params ?? {},
    };
    const timeout = timeoutMs ?? this.timeoutMs;

    const result = await new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          new Error(
            tKey("shared.daemon.error.request-timeout", { action: method }),
          ),
        );
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.socket!.send(JSON.stringify(payload));
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });

    return result as T;
  }

  ping() {
    return this.request<{ time?: number }>(V2_METHODS.ping, {});
  }

  getSystemInfo() {
    return this.request<DaemonSystemInfo>(V2_METHODS.systemInfo, {});
  }

  getAllReports() {
    return this.request<{ reports?: Record<string, DaemonInstanceReport> }>(
      V2_METHODS.listReports,
      {},
    );
  }

  /**
   * 订阅 Daemon 事件。instance log 需 meta: { instance_id }。
   * event 使用 catalog 全名（如 mcsl.event.instance.log）。
   */
  subscribeEvent(type: string, meta: Record<string, unknown> | null = null) {
    const params: Record<string, unknown> = { event: type };
    if (meta != null) params.meta = meta;
    return this.request(V2_METHODS.subscribe, params);
  }

  unsubscribeEvent(type: string, meta: Record<string, unknown> | null = null) {
    const params: Record<string, unknown> = { event: type };
    if (meta != null) params.meta = meta;
    return this.request(V2_METHODS.unsubscribe, params);
  }

  /** 订阅某实例实时日志推送；返回清理函数（取消订阅 + 移除监听） */
  async subscribeInstanceLog(
    instanceId: string,
    onLog: (line: string) => void,
  ): Promise<() => void> {
    const meta = { instance_id: instanceId };
    const off = this.onEvent((packet) => {
      if (packet.event !== V2_EVENTS.instanceLog && packet.event !== "instance_log") {
        return;
      }
      const packetMeta = packet.meta ?? {};
      const mid = String(
        packetMeta.instance_id ?? packetMeta.InstanceId ?? "",
      );
      if (mid && mid !== instanceId) return;
      const data = packet.data ?? {};
      const line = data.log ?? data.Log ?? data.line ?? data.Line;
      if (line == null) return;
      onLog(String(line));
    });
    try {
      await this.subscribeEvent(V2_EVENTS.instanceLog, meta);
    } catch (error) {
      off();
      throw error;
    }
    return () => {
      off();
      void this.unsubscribeEvent(V2_EVENTS.instanceLog, meta).catch(() => {
        // 连接已断时忽略
      });
    };
  }

  getInstanceReport(id: string) {
    return this.request<DaemonInstanceReport>(V2_METHODS.getReport, {
      instance_id: id,
    });
  }

  getInstanceLogHistory(id: string) {
    return this.request<{ logs?: string[] }>(V2_METHODS.getLog, {
      instance_id: id,
    });
  }

  getDirectoryInfo(path: string) {
    return this.request<{
      parent?: string | null;
      Parent?: string | null;
      files?: Array<{
        name?: string;
        Name?: string;
        meta?: {
          size?: number;
          Size?: number;
          last_write_time?: string | number;
          LastWriteTime?: string | number;
        };
      }>;
      Files?: Array<{
        name?: string;
        Name?: string;
        meta?: {
          size?: number;
          Size?: number;
          last_write_time?: string | number;
          LastWriteTime?: string | number;
        };
      }>;
      directories?: Array<{ name?: string; Name?: string }>;
      Directories?: Array<{ name?: string; Name?: string }>;
    }>(V2_METHODS.directoryInfo, { path: toDaemonPath(path) });
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
    }>(V2_METHODS.getSettings, { instance_id: id });
  }

  getEventRules(instanceId: string) {
    return this.request<{ rules?: unknown; instance_id?: string }>(
      V2_METHODS.getEventRules,
      { instance_id: instanceId },
    );
  }

  saveEventRules(instanceId: string, rules: unknown[]) {
    return this.request(V2_METHODS.updateEventRules, {
      instance_id: instanceId,
      rules,
    });
  }

  createDirectory(path: string) {
    return this.request(V2_METHODS.createDirectory, {
      path: toDaemonPath(path),
    });
  }

  deleteFile(path: string) {
    return this.request(V2_METHODS.deleteFile, { path: toDaemonPath(path) });
  }

  deleteDirectory(path: string, recursive = true) {
    return this.request(V2_METHODS.deleteDirectory, {
      path: toDaemonPath(path),
      recursive,
    });
  }

  renameFile(path: string, newName: string) {
    return this.request(V2_METHODS.renameFile, {
      path: toDaemonPath(path),
      new_name: newName,
    });
  }

  renameDirectory(path: string, newName: string) {
    return this.request(V2_METHODS.renameDirectory, {
      path: toDaemonPath(path),
      new_name: newName,
    });
  }

  updateInstanceSettings(params: {
    id: string;
    name: string;
    instance_type: string;
    java_path?: string | null;
    arguments?: string[];
    version?: string | null;
    force_rerun_installer?: boolean;
    console_mode?: "pipe" | "pty";
    replacement_core?: {
      uploaded_source_path: string;
      preferred_target_name?: string | null;
    } | null;
  }) {
    return this.request(V2_METHODS.updateSettings, {
      instance_id: params.id,
      name: params.name,
      instance_type: params.instance_type,
      java_path: params.java_path ?? null,
      arguments: params.arguments ?? [],
      version: params.version ?? null,
      force_rerun_installer: params.force_rerun_installer ?? false,
      console_mode: params.console_mode ?? "pipe",
      replacement_core: params.replacement_core
        ? {
            uploaded_source_path: toDaemonPath(
              params.replacement_core.uploaded_source_path,
            ),
            preferred_target_name:
              params.replacement_core.preferred_target_name ?? null,
          }
        : null,
    });
  }

  startInstance(id: string) {
    return this.request(V2_METHODS.start, { instance_id: id });
  }

  stopInstance(id: string) {
    // Graceful stop can take a while for MC; keep default unless hung.
    return this.request(V2_METHODS.stop, { instance_id: id }, 30_000);
  }

  killInstance(id: string) {
    // Halt must return quickly after daemon fix; still allow >12s for slow kill trees.
    return this.request(V2_METHODS.halt, { instance_id: id }, 30_000);
  }

  removeInstance(id: string) {
    return this.request(V2_METHODS.remove, { instance_id: id });
  }

  sendToInstance(id: string, message: string) {
    return this.request(V2_METHODS.sendCommand, {
      instance_id: id,
      command: message,
    });
  }

  openConsole(instanceId: string, columns = 120, rows = 40) {
    return this.request<DaemonConsoleSession>(V2_METHODS.consoleOpen, {
      instance_id: instanceId,
      columns,
      rows,
    });
  }

  resizeConsole(sessionId: string, columns: number, rows: number) {
    return this.request(V2_METHODS.consoleResize, {
      session_id: sessionId,
      columns,
      rows,
    });
  }

  closeConsole(sessionId: string) {
    return this.request(V2_METHODS.consoleClose, {
      session_id: sessionId,
    });
  }

  /** 订阅某 console session 的 ConsoleOutput 二进制帧。 */
  onConsoleOutput(
    sessionId: string,
    listener: ConsoleOutputListener,
  ): () => void {
    // Normalize GUID case so binary big-endian decode matches JSON open result.
    const key = sessionId.toLowerCase();
    let set = this.consoleOutputListeners.get(key);
    if (!set) {
      set = new Set();
      this.consoleOutputListeners.set(key, set);
    }
    set.add(listener);
    return () => {
      const current = this.consoleOutputListeners.get(key);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) {
        this.consoleOutputListeners.delete(key);
      }
    };
  }

  /**
   * 发送 ConsoleInput 二进制帧（无 ack）。
   * PTY 模式下应发送原始按键/字节；pipe 模式仍可用 sendToInstance。
   */
  sendConsoleInput(
    sessionId: string,
    payload: Uint8Array,
    offset = 0,
    maximumChunkSize = DEFAULT_MAX_CHUNK_SIZE,
  ): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error(tKey("shared.daemon.error.not-connected"));
    }
    const frame = buildBinaryFrame(
      BINARY_FRAME_KIND_CONSOLE_INPUT,
      sessionId,
      offset,
      payload,
      maximumChunkSize,
    );
    this.socket.send(frame);
  }

  async getJavaList(timeoutMs = 60_000): Promise<JavaInfo[]> {
    const data = await this.request<
      DaemonJavaListResult | JavaInfo[] | Record<string, unknown>
    >(V2_METHODS.javaList, {}, timeoutMs);
    const root = (data ?? {}) as Record<string, unknown>;
    const rawList = Array.isArray(data)
      ? data
      : (root.items ??
          root.java_list ??
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
    const request = toCreateInstanceRequest(setting);
    const data = await this.request<DaemonAddInstanceResult>(
      V2_METHODS.create,
      request,
      timeoutMs,
    );
    const config = data?.config ?? (data as unknown as DaemonInstanceConfig);
    if (!config || typeof config !== "object") {
      throw new Error(tKey("shared.daemon.error.create-no-config"));
    }
    return config;
  }

  /**
   * Protocol V2 文件上传：open → binary UploadChunk + ack → close。
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
    const path = toDaemonPath(dst);
    const total = file.size;
    const buffer = new Uint8Array(await file.arrayBuffer());
    const sha256 = await sha256Hex(buffer);

    const session = await this.request<DaemonUploadSession>(
      V2_METHODS.uploadOpen,
      {
        path,
        length: total,
        sha256,
      },
      60_000,
    );
    const sessionId = String(session.session_id ?? session.sessionId ?? "");
    if (!sessionId) throw new Error(tKey("shared.daemon.error.upload-session"));

    const maxChunk = Number(
      session.max_chunk_size ?? session.maxChunkSize ?? 1024 * 1024,
    );
    const chunkSize = Math.min(options?.chunkSize ?? maxChunk, maxChunk);
    let offset = 0;
    let closed = false;

    try {
      while (offset < total) {
        if (options?.signal?.aborted) {
          throw new Error(tKey("shared.daemon.error.upload-cancelled"));
        }
        const end = Math.min(offset + chunkSize, total);
        const chunk = buffer.subarray(offset, end);
        const frame = buildBinaryFrame(
          BINARY_FRAME_KIND_UPLOAD,
          sessionId,
          offset,
          chunk,
          maxChunk,
        );
        await this.sendUploadChunk(sessionId, offset, chunk.byteLength, frame, 60_000);
        offset = end;
        options?.onProgress?.({
          loaded: offset,
          total,
          done: offset >= total,
        });
      }

      await this.request(
        V2_METHODS.uploadClose,
        { session_id: sessionId },
        60_000,
      );
      closed = true;
      options?.onProgress?.({ loaded: total, total, done: true });
      return path;
    } catch (error) {
      if (!closed) {
        try {
          await this.request(
            V2_METHODS.uploadCancel,
            { session_id: sessionId },
            10_000,
          );
        } catch {
          // ignore
        }
      }
      throw error;
    }
  }

  /**
   * Protocol V2 文件下载：open → read (JSON result + binary frame) → close。
   */
  async downloadFile(
    path: string,
    options?: {
      chunkSize?: number;
      onProgress?: (progress: { loaded: number; total: number }) => void;
    },
  ): Promise<Blob> {
    const session = await this.request<DaemonDownloadSession>(
      V2_METHODS.downloadOpen,
      { path: toDaemonPath(path) },
      60_000,
    );
    const sessionId = String(session.session_id ?? session.sessionId ?? "");
    const total = Number(session.length ?? 0);
    if (!sessionId) throw new Error(tKey("shared.instance.files.download-failed"));

    const maxChunk = Number(
      session.max_chunk_size ?? session.maxChunkSize ?? 256 * 1024,
    );
    const chunkSize = Math.min(options?.chunkSize ?? maxChunk, maxChunk);
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    try {
      while (loaded < total) {
        const maximumLength = Math.min(chunkSize, total - loaded);
        const readPromise = this.waitDownloadChunk(
          sessionId,
          loaded,
          maximumLength,
          60_000,
        );
        const meta = await this.request<DaemonDownloadReadResult>(
          V2_METHODS.downloadRead,
          {
            session_id: sessionId,
            offset: loaded,
            maximum_length: maximumLength,
          },
          60_000,
        );
        const payload = await readPromise;
        const expectedLength = Number(meta.length ?? payload.byteLength);
        if (payload.byteLength !== expectedLength) {
          throw new Error(tKey("shared.instance.files.download-failed"));
        }
        chunks.push(payload);
        loaded += payload.byteLength;
        options?.onProgress?.({ loaded, total });
        if (meta.is_final || meta.isFinal || loaded >= total) break;
      }
    } finally {
      try {
        await this.request(V2_METHODS.downloadClose, {
          session_id: sessionId,
        });
      } catch {
        // ignore close errors
      }
    }
    return new Blob(chunks as BlobPart[]);
  }

  private sendUploadChunk(
    sessionId: string,
    offset: number,
    length: number,
    frame: ArrayBuffer | ArrayBufferView,
    timeoutMs: number,
  ): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error(tKey("shared.daemon.error.not-connected")));
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingUploadAcks.delete(sessionId);
        reject(
          new Error(
            tKey("shared.daemon.error.request-timeout", {
              action: V2_METHODS.uploadOpen,
            }),
          ),
        );
      }, timeoutMs);
      this.pendingUploadAcks.set(sessionId, {
        resolve,
        reject,
        timer,
        offset,
        length,
      });
      try {
        this.socket!.send(frame);
      } catch (error) {
        clearTimeout(timer);
        this.pendingUploadAcks.delete(sessionId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private waitDownloadChunk(
    sessionId: string,
    offset: number,
    length: number,
    timeoutMs: number,
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingDownloadChunks.delete(sessionId);
        reject(
          new Error(
            tKey("shared.daemon.error.request-timeout", {
              action: V2_METHODS.downloadRead,
            }),
          ),
        );
      }, timeoutMs);
      this.pendingDownloadChunks.set(sessionId, {
        resolve,
        reject,
        timer,
        offset,
        length,
      });
    });
  }

  private async handleMessage(raw: unknown) {
    if (raw instanceof ArrayBuffer) {
      this.handleBinaryFrame(raw);
      return;
    }
    if (ArrayBuffer.isView(raw)) {
      this.handleBinaryFrame(raw);
      return;
    }
    if (raw instanceof Blob) {
      const buffer = await raw.arrayBuffer();
      // Heuristic: binary frames are not valid UTF-8 JSON objects.
      // Prefer binary parse when length looks like a frame.
      if (buffer.byteLength >= 32) {
        const asText = new TextDecoder().decode(buffer);
        if (!asText.trimStart().startsWith("{") && !asText.trimStart().startsWith("[")) {
          this.handleBinaryFrame(buffer);
          return;
        }
        await this.handleTextMessage(asText);
        return;
      }
      await this.handleTextMessage(new TextDecoder().decode(buffer));
      return;
    }
    if (typeof raw === "string") {
      await this.handleTextMessage(raw);
    }
  }

  private handleBinaryFrame(raw: ArrayBuffer | ArrayBufferView) {
    const parsed = tryReadBinaryFrame(raw);
    if (!parsed.ok) return;

    if (parsed.header.kind === BINARY_FRAME_KIND_DOWNLOAD) {
      const pending = this.pendingDownloadChunks.get(parsed.header.sessionId);
      if (!pending) return;
      if (
        pending.offset !== parsed.header.offset ||
        pending.length !== parsed.header.payloadLength
      ) {
        clearTimeout(pending.timer);
        this.pendingDownloadChunks.delete(parsed.header.sessionId);
        pending.reject(new Error(tKey("shared.instance.files.download-failed")));
        return;
      }
      clearTimeout(pending.timer);
      this.pendingDownloadChunks.delete(parsed.header.sessionId);
      pending.resolve(parsed.payload);
      return;
    }

    // Upload chunks are client-originated; ignore unexpected inbound upload frames.
    if (parsed.header.kind === BINARY_FRAME_KIND_UPLOAD) {
      return;
    }

    if (parsed.header.kind === BINARY_FRAME_KIND_CONSOLE_OUTPUT) {
      const key = parsed.header.sessionId.toLowerCase();
      const listeners = this.consoleOutputListeners.get(key);
      if (!listeners || listeners.size === 0) return;
      for (const listener of listeners) {
        try {
          listener(
            parsed.header.sessionId,
            parsed.payload,
            parsed.header.offset,
          );
        } catch {
          // ignore listener errors
        }
      }
      return;
    }

    // ConsoleInput is client-originated; ignore unexpected inbound frames.
    if (parsed.header.kind === BINARY_FRAME_KIND_CONSOLE_INPUT) {
      return;
    }
  }

  private async handleTextMessage(text: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return;
    }

    this.options.onMessage?.(parsed);
    if (!parsed || typeof parsed !== "object") return;
    const message = parsed as Record<string, unknown>;

    // Upload acknowledgement notification
    if (
      message.jsonrpc === "2.0" &&
      message.method === V2_UPLOAD_ACK_METHOD &&
      message.params &&
      typeof message.params === "object"
    ) {
      this.handleUploadAck(message.params as Record<string, unknown>);
      return;
    }

    // Typed event notification (no id)
    if (
      message.jsonrpc === "2.0" &&
      typeof message.method === "string" &&
      message.id == null &&
      message.params &&
      typeof message.params === "object"
    ) {
      const method = String(message.method);
      if (method.startsWith("mcsl.event.")) {
        this.dispatchEventNotification(
          method,
          message.params as Record<string, unknown>,
        );
        return;
      }
    }

    // JSON-RPC response
    if (message.jsonrpc === "2.0" && message.id != null) {
      const id = String(message.id);
      const pending = this.pending.get(id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(id);

      if (message.error && typeof message.error === "object") {
        pending.reject(toRpcError(message.error as JsonRpcErrorObject));
        return;
      }
      pending.resolve(message.result);
      return;
    }
  }

  private handleUploadAck(params: Record<string, unknown>) {
    const sessionId = String(params.session_id ?? params.sessionId ?? "");
    if (!sessionId) return;
    const pending = this.pendingUploadAcks.get(sessionId);
    if (!pending) return;

    const offset = Number(params.offset ?? -1);
    const length = Number(params.length ?? -1);
    const status = String(params.status ?? "").toLowerCase();

    if (offset !== pending.offset || length !== pending.length) {
      clearTimeout(pending.timer);
      this.pendingUploadAcks.delete(sessionId);
      pending.reject(
        new Error(
          tKey("shared.daemon.error.action-failed", {
            action: V2_UPLOAD_ACK_METHOD,
          }),
        ),
      );
      return;
    }

    clearTimeout(pending.timer);
    this.pendingUploadAcks.delete(sessionId);

    if (status === "accepted") {
      pending.resolve();
      return;
    }

    const errorObj =
      params.error && typeof params.error === "object"
        ? (params.error as JsonRpcErrorObject)
        : null;
    pending.reject(
      errorObj
        ? toRpcError(errorObj)
        : new Error(
            tKey("shared.daemon.error.action-failed", {
              action: V2_UPLOAD_ACK_METHOD,
            }),
          ),
    );
  }

  private dispatchEventNotification(
    method: string,
    params: Record<string, unknown>,
  ) {
    const dataRaw = params.data;
    const metaRaw = params.meta;
    const eventPacket: DaemonEventPacket = {
      event: method,
      data:
        dataRaw && typeof dataRaw === "object"
          ? (dataRaw as Record<string, unknown>)
          : null,
      meta:
        metaRaw && typeof metaRaw === "object"
          ? (metaRaw as Record<string, unknown>)
          : metaRaw === null
            ? null
            : null,
      time:
        typeof params.timestamp === "number"
          ? params.timestamp
          : typeof params.time === "number"
            ? params.time
            : undefined,
      sequence:
        typeof params.sequence === "number" ? params.sequence : undefined,
    };
    for (const listener of this.eventListeners) {
      try {
        listener(eventPacket);
      } catch {
        // 单个监听器异常不阻断其它监听
      }
    }
  }

  private rejectAll(error: Error) {
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
    for (const [, pending] of this.pendingUploadAcks) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingUploadAcks.clear();
    for (const [, pending] of this.pendingDownloadChunks) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingDownloadChunks.clear();
    this.consoleOutputListeners.clear();
  }
}

/** Prefer V2 daemon_error_code; map common lifecycle codes to Chinese soft strings. */
function toRpcError(error: JsonRpcErrorObject): Error {
  const data =
    error.data && typeof error.data === "object"
      ? (error.data as Record<string, unknown>)
      : null;
  const daemonCode =
    data && typeof data.daemon_error_code === "string"
      ? data.daemon_error_code
      : data && typeof data.code === "string"
        ? data.code
        : "";
  const dataMessage =
    data && typeof data.message === "string" && data.message.trim()
      ? data.message.trim()
      : "";

  const mapped = mapDaemonErrorCode(daemonCode);
  if (mapped) {
    const err = new Error(mapped);
    (err as Error & { daemonErrorCode?: string }).daemonErrorCode = daemonCode;
    return err;
  }

  // Avoid bare "Daemon error" / "Rejected" when we have a structured code.
  const top = (error.message || "").trim();
  const topIsGeneric =
    !top ||
    /^daemon error$/i.test(top) ||
    /^rejected$/i.test(top) ||
    /^failed$/i.test(top) ||
    /^remote failure$/i.test(top);

  const message =
    (!topIsGeneric ? top : "") ||
    dataMessage ||
    daemonCode ||
    tKey("shared.daemon.error.operation-failed");
  const err = new Error(message);
  if (daemonCode) {
    (err as Error & { daemonErrorCode?: string }).daemonErrorCode = daemonCode;
  }
  return err;
}

function mapDaemonErrorCode(code: string): string | null {
  if (!code) return null;
  const key = `shared.daemon.error.code.${code}`;
  const translated = tKey(key);
  return translated !== key ? translated : null;
}

/** True when stop/kill against an already-stopped instance (idempotent success). */
export function isIdempotentLifecycleError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as Error & { daemonErrorCode?: string }).daemonErrorCode;
  if (
    code === "instance.not_running" ||
    code === "instance.already_stopped"
  ) {
    return true;
  }
  const msg = error.message.toLowerCase();
  return (
    msg.includes("instance.not_running") ||
    msg.includes("not running") ||
    msg.includes("实例未运行") ||
    msg.includes("实例不在运行")
  );
}

/** Map flat create wizard payload → V2 nested CreateInstanceRequest. */
export function toCreateInstanceRequest(
  setting: InstanceFactorySettingPayload,
): Record<string, unknown> {
  const instanceId = crypto.randomUUID();
  return {
    setting: {
      configuration: {
        instance_id: instanceId,
        name: setting.name,
        target: setting.target,
        instance_type: setting.instance_type,
        target_type: setting.target_type,
        version: setting.mc_version ?? "",
        input_encoding: setting.input_encoding ?? "utf-8",
        output_encoding: setting.output_encoding ?? "utf-8",
        java_path: setting.java_path ?? "",
        arguments: setting.arguments ?? [],
        environment_variables: {},
        event_rules: [],
      },
      source: setting.source,
      source_type: setting.source_type,
      mirror: setting.mirror ?? "none",
      use_post_process: setting.use_post_process ?? false,
    },
  };
}

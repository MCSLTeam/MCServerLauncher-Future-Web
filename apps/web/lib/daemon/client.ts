import {
  type DaemonActionResponse,
  type DaemonInstanceReport,
  type DaemonSystemInfo,
  wsUrl,
} from "@/lib/daemon/types";

type Pending = {
  resolve: (value: DaemonActionResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

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
};

/**
 * MCSL Future Daemon WebSocket action 客户端。
 * 协议：ws(s)://host:port/api/v1?token=...
 * 请求：{ action, params, id }  响应：{ status, retcode, data, message, id }
 */
export class DaemonClient {
  private socket: WebSocket | null = null;
  private pending = new Map<string, Pending>();
  private closedByUser = false;
  private readonly timeoutMs: number;

  constructor(private readonly options: DaemonClientOptions) {
    this.timeoutMs = options.requestTimeoutMs ?? 12_000;
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
          reject(new Error("WebSocket 连接失败"));
        }
      };

      socket.onclose = (event) => {
        this.rejectAll(new Error(event.reason || "连接已关闭"));
        this.options.onClose?.(event);
        if (!settled) {
          settled = true;
          reject(new Error(event.reason || "WebSocket 连接关闭"));
        }
      };

      socket.onmessage = (event) => {
        void this.handleMessage(event.data);
      };
    });
  }

  close() {
    this.closedByUser = true;
    this.rejectAll(new Error("连接已断开"));
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
  ): Promise<T> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("节点未连接");
    }
    const id = crypto.randomUUID();
    const payload = {
      action,
      params: params ?? {},
      id,
    };

    const response = await new Promise<DaemonActionResponse>(
      (resolve, reject) => {
        const timer = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error(`请求超时：${action}`));
        }, this.timeoutMs);
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
      throw new Error(response.message || `Action 失败：${action}`);
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

  private async handleMessage(raw: unknown) {
    let text: string;
    if (typeof raw === "string") {
      text = raw;
    } else if (raw instanceof Blob) {
      text = await raw.text();
    } else if (raw instanceof ArrayBuffer) {
      // 二进制分片上传响应，当前客户端不处理
      return;
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
    if (!parsed || typeof parsed !== "object") return;
    const message = parsed as Partial<DaemonActionResponse> & {
      event?: string;
      type?: string;
    };

    // action 响应
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

  private rejectAll(error: Error) {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
      this.pending.delete(id);
    }
  }
}

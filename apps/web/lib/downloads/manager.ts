import { invokeTauri, isTauriRuntime } from "@/lib/tauri-runtime";
import { tKey } from "@/lib/i18n/translate";

export type DownloadTaskStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

/** 下载目的地：本机 和/或 一个或多个守护进程 */
export type DownloadDestination =
  | { kind: "local" }
  | {
      kind: "daemon";
      nodeId: string;
      nodeName: string;
      /** daemon 相对路径，默认 caches/downloads/{fileName} */
      path?: string;
    };

export type DownloadTask = {
  id: string;
  fileName: string;
  url: string;
  status: DownloadTaskStatus;
  receivedBytes: number;
  totalBytes: number;
  bytesPerSecond: number;
  progress: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
  objectUrl?: string;
  localPath?: string;
  /** 可读目的地摘要，如 "本机 · 节点A · 节点B" */
  destinationSummary?: string;
};

export type DaemonUploadFn = (
  nodeId: string,
  file: File,
  dst: string,
  onProgress?: (progress: { loaded: number; total: number }) => void,
) => Promise<{ ok: boolean; message?: string }>;

export type StartDownloadOptions = {
  destinations: DownloadDestination[];
  /** 推送到 daemon 时必填 */
  uploadToDaemon?: DaemonUploadFn;
};

type Listener = (tasks: DownloadTask[]) => void;

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<FileSystemFileHandle>;
};

function formatSpeed(bps: number) {
  if (bps > 1024 * 1024) return `${(bps / 1024 / 1024).toFixed(2)} MB/s`;
  if (bps > 1024) return `${(bps / 1024).toFixed(2)} KB/s`;
  return `${bps.toFixed(0)} B/s`;
}

export function formatDownloadSpeed(bps: number) {
  return formatSpeed(bps);
}

export function formatDownloadSize(bytes: number) {
  if (!bytes || bytes < 0) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function defaultDaemonDownloadPath(fileName: string) {
  const safe = fileName.replace(/[/\\]/g, "_").trim() || "download.bin";
  return `caches/downloads/${safe}`;
}

export function summarizeDestinations(destinations: DownloadDestination[]) {
  const parts: string[] = [];
  for (const dest of destinations) {
    if (dest.kind === "local") parts.push(tKey("shared.download.dest.local"));
    else parts.push(dest.nodeName || dest.nodeId);
  }
  return parts.join(" · ");
}

/**
 * 资源下载管理器（对齐 WPF DownloadManager + 多目的地）。
 * - local：Tauri Save 对话框 / 浏览器 File System Access / a[download]
 * - daemon：经同源代理取文件 → file_upload_* 推到各节点 caches/downloads/
 */
class DownloadManager {
  private tasks: DownloadTask[] = [];
  private listeners = new Set<Listener>();
  private controllers = new Map<string, AbortController>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.tasks);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getTasks() {
    return this.tasks;
  }

  private emit() {
    const snapshot = [...this.tasks];
    for (const listener of this.listeners) listener(snapshot);
  }

  private upsert(task: DownloadTask) {
    const index = this.tasks.findIndex((item) => item.id === task.id);
    if (index >= 0) {
      this.tasks = [
        ...this.tasks.slice(0, index),
        task,
        ...this.tasks.slice(index + 1),
      ];
    } else {
      this.tasks = [task, ...this.tasks];
    }
    this.emit();
  }

  private getTask(id: string) {
    return this.tasks.find((item) => item.id === id);
  }

  /**
   * 启动下载。
   * - 未传 destinations 时默认本机（兼容旧调用）
   * - 用户取消本机路径选择且无 daemon 目标时返回 null
   */
  async start(
    url: string,
    fileName: string,
    options?: StartDownloadOptions,
  ): Promise<string | null> {
    if (!url.trim()) throw new Error("Download URL is empty.");
    if (!fileName.trim()) throw new Error("Download file name is empty.");

    const destinations =
      options?.destinations?.length && options.destinations.length > 0
        ? options.destinations
        : ([{ kind: "local" }] as DownloadDestination[]);

    const wantLocal = destinations.some((d) => d.kind === "local");
    const daemonTargets = destinations.filter(
      (d): d is Extract<DownloadDestination, { kind: "daemon" }> =>
        d.kind === "daemon",
    );

    if (daemonTargets.length > 0 && !options?.uploadToDaemon) {
      throw new Error(tKey("shared.download.dest.need-upload"));
    }

    let destPath: string | null = null;
    let browserHandle: FileSystemFileHandle | null = null;

    if (wantLocal) {
      if (isTauriRuntime()) {
        destPath = await invokeTauri<string | null>("pick_save_path", {
          title: tKey("shared.tauri.save-dialog.title"),
          defaultFileName: fileName,
        });
        if (!destPath && daemonTargets.length === 0) return null;
        if (!destPath) {
          // 用户取消本机路径，仍可只推 daemon
        }
      } else {
        const picker = (window as SaveFilePickerWindow).showSaveFilePicker;
        if (typeof picker === "function") {
          try {
            browserHandle = await picker({ suggestedName: fileName });
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
              if (daemonTargets.length === 0) return null;
              browserHandle = null;
            } else {
              browserHandle = null;
            }
          }
        }
      }
    }

    // 用户取消了本机路径，且本机是唯一目标
    if (
      wantLocal &&
      daemonTargets.length === 0 &&
      isTauriRuntime() &&
      !destPath
    ) {
      return null;
    }

    const resolvedName =
      destPath?.split(/[/\\]/).pop()?.trim() ||
      browserHandle?.name ||
      fileName;

    const id = crypto.randomUUID();
    const now = Date.now();
    const task: DownloadTask = {
      id,
      fileName: resolvedName,
      url,
      status: "running",
      receivedBytes: 0,
      totalBytes: 0,
      bytesPerSecond: 0,
      progress: 0,
      createdAt: now,
      updatedAt: now,
      localPath: destPath ?? undefined,
      destinationSummary: summarizeDestinations(
        destinations.filter((d) => {
          if (d.kind === "local") {
            return Boolean(destPath || browserHandle || !isTauriRuntime());
          }
          return true;
        }),
      ),
    };
    this.upsert(task);

    const controller = new AbortController();
    this.controllers.set(id, controller);

    try {
      // 仅本机且 Tauri 有路径：原生直下（不经 blob 中转）
      if (
        wantLocal &&
        daemonTargets.length === 0 &&
        isTauriRuntime() &&
        destPath
      ) {
        await this.startViaTauri(id, url, destPath, controller.signal);
        return id;
      }

      // 需要 blob：本机浏览器 和/或 推 daemon
      const { blob, total } = await this.fetchBlob(
        id,
        url,
        controller.signal,
      );

      if (wantLocal && isTauriRuntime() && destPath) {
        // Tauri 本地落盘：再走原生下载（与 blob 并行语义一致，省去 bytes 命令）
        if (controller.signal.aborted) {
          throw new Error(tKey("shared.download.cancelled"));
        }
        const local = await invokeTauri<{
          path: string;
          size: number;
          fileName: string;
        }>("resource_download", { url, destPath });
        this.upsert({
          ...this.getTask(id)!,
          localPath: local.path,
          fileName: local.fileName || resolvedName,
          receivedBytes: Math.max(total, local.size, blob.size),
          totalBytes: Math.max(total, local.size, blob.size),
          progress: daemonTargets.length > 0 ? 70 : 100,
          updatedAt: Date.now(),
        });
      } else if (wantLocal) {
        await this.finishBrowser(
          id,
          resolvedName,
          blob,
          total || blob.size,
          browserHandle,
          daemonTargets.length === 0,
        );
      }

      for (const target of daemonTargets) {
        if (controller.signal.aborted) {
          throw new Error(tKey("shared.download.cancelled"));
        }
        const dst =
          target.path?.trim() || defaultDaemonDownloadPath(resolvedName);
        const file = new File([blob], resolvedName, {
          type: blob.type || "application/octet-stream",
        });
        this.upsert({
          ...this.getTask(id)!,
          status: "running",
          progress: Math.min(99, this.getTask(id)!.progress || 50),
          error: undefined,
          destinationSummary: `${this.getTask(id)!.destinationSummary ?? ""} → ${target.nodeName}`,
          updatedAt: Date.now(),
        });
        const result = await options!.uploadToDaemon!(
          target.nodeId,
          file,
          dst,
          (progress) => {
            const pct =
              progress.total > 0
                ? Math.round((progress.loaded / progress.total) * 100)
                : 0;
            this.upsert({
              ...this.getTask(id)!,
              status: "running",
              receivedBytes: progress.loaded,
              totalBytes: progress.total || blob.size,
              progress: pct,
              updatedAt: Date.now(),
            });
          },
        );
        if (!result.ok) {
          throw new Error(
            result.message ||
              tKey("shared.download.dest.upload-failed", {
                node: target.nodeName,
              }),
          );
        }
      }

      this.upsert({
        ...this.getTask(id)!,
        status: "completed",
        receivedBytes: total || blob.size,
        totalBytes: total || blob.size,
        progress: 100,
        bytesPerSecond: 0,
        fileName: resolvedName,
        localPath: destPath ?? this.getTask(id)!.localPath,
        destinationSummary: summarizeDestinations(destinations),
        updatedAt: Date.now(),
      });
      this.controllers.delete(id);
      return id;
    } catch (error) {
      if (controller.signal.aborted) {
        this.upsert({
          ...this.getTask(id)!,
          status: "cancelled",
          error: tKey("shared.download.cancelled"),
          updatedAt: Date.now(),
        });
      } else {
        this.upsert({
          ...this.getTask(id)!,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
          updatedAt: Date.now(),
        });
      }
      this.controllers.delete(id);
      throw error;
    }
  }

  private async fetchBlob(
    id: string,
    url: string,
    signal: AbortSignal,
  ): Promise<{ blob: Blob; total: number }> {
    const response = await fetch("/api/resource/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal,
    });
    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const json = (await response.json()) as { err?: string };
        if (json.err) detail = json.err;
      } catch {
        // ignore
      }
      throw new Error(detail);
    }
    const total = Number(response.headers.get("content-length") ?? 0);
    const reader = response.body?.getReader();
    if (!reader) {
      const blob = await response.blob();
      this.upsert({
        ...this.getTask(id)!,
        receivedBytes: blob.size,
        totalBytes: blob.size,
        progress: 100,
        updatedAt: Date.now(),
      });
      return { blob, total: blob.size };
    }

    const chunks: Uint8Array[] = [];
    let received = 0;
    let lastTick = Date.now();
    let lastReceived = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.byteLength;
        const nowTs = Date.now();
        const dt = Math.max(1, nowTs - lastTick);
        if (dt >= 250) {
          const speed = ((received - lastReceived) * 1000) / dt;
          lastTick = nowTs;
          lastReceived = received;
          this.upsert({
            ...this.getTask(id)!,
            receivedBytes: received,
            totalBytes: total,
            bytesPerSecond: speed,
            progress: total > 0 ? (received / total) * 100 : 0,
            status: "running",
            updatedAt: nowTs,
          });
        }
      }
    }

    const blob = new Blob(chunks as BlobPart[]);
    return { blob, total: total || received };
  }

  private async startViaTauri(
    id: string,
    url: string,
    destPath: string,
    signal: AbortSignal,
  ) {
    if (signal.aborted) throw new Error(tKey("shared.download.cancelled"));
    const result = await invokeTauri<{
      path: string;
      size: number;
      fileName: string;
    }>("resource_download", { url, destPath });
    if (signal.aborted) throw new Error(tKey("shared.download.cancelled"));
    this.upsert({
      ...this.getTask(id)!,
      status: "completed",
      receivedBytes: result.size,
      totalBytes: result.size,
      progress: 100,
      bytesPerSecond: 0,
      localPath: result.path,
      fileName: result.fileName || this.getTask(id)!.fileName,
      destinationSummary: tKey("shared.download.dest.local"),
      updatedAt: Date.now(),
    });
    this.controllers.delete(id);
  }

  private async finishBrowser(
    id: string,
    fileName: string,
    blob: Blob,
    totalBytes: number,
    handle: FileSystemFileHandle | null,
    complete: boolean,
  ) {
    if (handle) {
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      if (complete) {
        this.upsert({
          ...this.getTask(id)!,
          status: "completed",
          receivedBytes: totalBytes,
          totalBytes,
          progress: 100,
          bytesPerSecond: 0,
          fileName: handle.name || fileName,
          updatedAt: Date.now(),
        });
        this.controllers.delete(id);
      } else {
        this.upsert({
          ...this.getTask(id)!,
          receivedBytes: totalBytes,
          totalBytes,
          progress: 80,
          fileName: handle.name || fileName,
          updatedAt: Date.now(),
        });
      }
    } else {
      const objectUrl = URL.createObjectURL(blob);
      this.triggerSave(objectUrl, fileName);
      if (complete) {
        this.upsert({
          ...this.getTask(id)!,
          status: "completed",
          receivedBytes: totalBytes,
          totalBytes,
          progress: 100,
          bytesPerSecond: 0,
          objectUrl,
          updatedAt: Date.now(),
        });
        this.controllers.delete(id);
      } else {
        this.upsert({
          ...this.getTask(id)!,
          receivedBytes: totalBytes,
          totalBytes,
          progress: 80,
          objectUrl,
          updatedAt: Date.now(),
        });
      }
    }
  }

  private triggerSave(objectUrl: string, fileName: string) {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  cancel(id: string) {
    const controller = this.controllers.get(id);
    if (controller) controller.abort();
    const task = this.getTask(id);
    if (task && (task.status === "running" || task.status === "queued")) {
      this.upsert({
        ...task,
        status: "cancelled",
        error: tKey("shared.download.cancelled"),
        updatedAt: Date.now(),
      });
    }
    this.controllers.delete(id);
  }

  remove(id: string) {
    const task = this.getTask(id);
    if (task?.objectUrl) {
      try {
        URL.revokeObjectURL(task.objectUrl);
      } catch {
        // ignore
      }
    }
    this.tasks = this.tasks.filter((item) => item.id !== id);
    this.emit();
  }

  clearFinished() {
    for (const task of this.tasks) {
      if (
        task.status === "completed" ||
        task.status === "failed" ||
        task.status === "cancelled"
      ) {
        if (task.objectUrl) {
          try {
            URL.revokeObjectURL(task.objectUrl);
          } catch {
            // ignore
          }
        }
      }
    }
    this.tasks = this.tasks.filter(
      (task) => task.status === "running" || task.status === "queued",
    );
    this.emit();
  }
}

export const downloadManager = new DownloadManager();

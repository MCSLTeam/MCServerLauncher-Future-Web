"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useDaemon } from "@/features/nodes/daemon-provider";
import {
  downloadManager,
  type DownloadDestination,
  type DownloadTask,
  type StartDownloadOptions,
} from "@/lib/downloads/manager";

type DownloadContextValue = {
  tasks: DownloadTask[];
  open: boolean;
  setOpen: (open: boolean) => void;
  /** 用户取消路径选择且无其它目的地时返回 null */
  startDownload: (
    url: string,
    fileName: string,
    options?: Omit<StartDownloadOptions, "uploadToDaemon"> & {
      destinations?: DownloadDestination[];
    },
  ) => Promise<string | null>;
  cancel: (id: string) => void;
  remove: (id: string) => void;
  clearFinished: () => void;
  activeCount: number;
};

const DownloadContext = createContext<DownloadContextValue | null>(null);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [open, setOpen] = useState(false);
  const daemon = useDaemon();

  useEffect(() => downloadManager.subscribe(setTasks), []);

  const startDownload = useCallback(
    async (
      url: string,
      fileName: string,
      options?: Omit<StartDownloadOptions, "uploadToDaemon"> & {
        destinations?: DownloadDestination[];
      },
    ) => {
      const destinations = options?.destinations;
      const needDaemon = destinations?.some((d) => d.kind === "daemon");
      const id = await downloadManager.start(url, fileName, {
        destinations: destinations ?? [{ kind: "local" }],
        uploadToDaemon: needDaemon
          ? async (nodeId, file, dst, onProgress) => {
              if (daemon.getStatus(nodeId) !== "online") {
                const connected = await daemon.connectNode(nodeId);
                if (!connected.ok) {
                  return {
                    ok: false,
                    message: connected.message,
                  };
                }
              }
              return daemon.uploadFile(nodeId, file, dst, onProgress);
            }
          : undefined,
      });
      if (id) setOpen(true);
      return id;
    },
    [daemon],
  );

  const cancel = useCallback((id: string) => downloadManager.cancel(id), []);
  const remove = useCallback((id: string) => downloadManager.remove(id), []);
  const clearFinished = useCallback(
    () => downloadManager.clearFinished(),
    [],
  );

  const activeCount = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "running" || task.status === "queued",
      ).length,
    [tasks],
  );

  const value = useMemo(
    () => ({
      tasks,
      open,
      setOpen,
      startDownload,
      cancel,
      remove,
      clearFinished,
      activeCount,
    }),
    [
      tasks,
      open,
      startDownload,
      cancel,
      remove,
      clearFinished,
      activeCount,
    ],
  );

  return (
    <DownloadContext.Provider value={value}>{children}</DownloadContext.Provider>
  );
}

export function useDownloads() {
  const ctx = useContext(DownloadContext);
  if (!ctx) {
    throw new Error("useDownloads must be used within DownloadProvider");
  }
  return ctx;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { DaemonClient, type UploadProgress } from "@/lib/daemon/client";
import {
  mapDaemonStatus,
  type DaemonConnectionState,
  type DaemonInstanceConfig,
  type DaemonInstanceReport,
  type DaemonLiveInstance,
  type DaemonSystemInfo,
  type InstanceFactorySettingPayload,
  type JavaInfo,
  httpInfoUrl,
} from "@/lib/daemon/types";
import {
  getNode,
  getNodeTokenAsync,
  hydrateNodes,
  listNodes,
  refreshNodes,
} from "@/lib/nodes-store";
import { hydrateSettings } from "@/lib/settings-store";
import type { NodeStatus, SavedNode } from "@/lib/types";
import { tKey } from "@/lib/i18n/translate";

type ConnectOptions = {
  /** 强制重建连接（对齐 WPF AutoRefresh / Refresh） */
  force?: boolean;
};

type Credentials = {
  host: string;
  port: string;
  secure: boolean;
  token: string;
};

type DaemonContextValue = {
  connections: Record<string, DaemonConnectionState>;
  instances: DaemonLiveInstance[];
  refreshing: boolean;
  getStatus: (nodeId: string) => NodeStatus;
  /** 连接已保存节点；成功条件与 WPF 一致：WS + get_system_info */
  connectNode: (
    nodeId: string,
    options?: ConnectOptions,
  ) => Promise<{ ok: boolean; message?: string; info?: DaemonSystemInfo }>;
  disconnectNode: (nodeId: string, options?: { purge?: boolean }) => void;
  /** 并发上限 4，对齐 WPF CreateAllDaemonWsAsync */
  connectAll: (options?: ConnectOptions) => Promise<void>;
  /** 对齐 RefreshAsync：按配置重连并刷新系统信息 */
  refreshDaemons: () => Promise<void>;
  refreshInstances: () => Promise<void>;
  /**
   * 对齐添加前探测：不落盘。
   * 先可选 HTTP /info，再 WS ping + get_system_info。
   */
  testNode: (
    input: Credentials,
  ) => Promise<{ ok: boolean; message?: string; info?: DaemonSystemInfo }>;
  startInstance: (
    nodeId: string,
    instanceId: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  stopInstance: (
    nodeId: string,
    instanceId: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  killInstance: (
    nodeId: string,
    instanceId: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  restartInstance: (
    nodeId: string,
    instanceId: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  removeInstance: (
    nodeId: string,
    instanceId: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  sendCommand: (
    nodeId: string,
    instanceId: string,
    command: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  getLogs: (
    nodeId: string,
    instanceId: string,
  ) => Promise<{ ok: boolean; logs?: string[]; message?: string }>;
  /**
   * 订阅 instance_log 实时推送。cleanup 会 unsubscribe + 移除监听。
   * 对齐 WPF InstanceDataManager.SubscribeEvent(InstanceLog)。
   */
  subscribeInstanceLog: (
    nodeId: string,
    instanceId: string,
    onLog: (line: string) => void,
  ) => Promise<{ ok: boolean; unsubscribe?: () => void; message?: string }>;
  /** 刷新单个实例 report（对齐 WPF 2s get_instance_report） */
  refreshInstanceReport: (
    nodeId: string,
    instanceId: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  /** 在已连接节点上执行任意 DaemonClient 操作 */
  runWithClient: <T,>(
    nodeId: string,
    run: (client: DaemonClient) => Promise<T>,
  ) => Promise<{ ok: true; data: T } | { ok: false; message?: string }>;
  getJavaList: (
    nodeId: string,
  ) => Promise<{ ok: boolean; javaList?: JavaInfo[]; message?: string }>;
  addInstance: (
    nodeId: string,
    setting: InstanceFactorySettingPayload,
  ) => Promise<{
    ok: boolean;
    config?: DaemonInstanceConfig;
    message?: string;
  }>;
  uploadFile: (
    nodeId: string,
    file: File | Blob,
    dst: string,
    onProgress?: (progress: UploadProgress) => void,
  ) => Promise<{ ok: boolean; path?: string; message?: string }>;
};

const DaemonContext = createContext<DaemonContextValue | null>(null);

function emptyState(nodeId: string): DaemonConnectionState {
  return {
    nodeId,
    status: "offline",
    error: null,
    lastPongAt: null,
    systemInfo: null,
  };
}

function extractReports(data: unknown): Record<string, DaemonInstanceReport> {
  if (!data || typeof data !== "object") return {};
  const root = data as Record<string, unknown>;
  const reports = (root.reports ?? root) as Record<
    string,
    DaemonInstanceReport
  >;
  if (!reports || typeof reports !== "object") return {};
  return reports;
}

function extractSystemInfo(data: unknown): DaemonSystemInfo | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  if (root.info && typeof root.info === "object") {
    return root.info as DaemonSystemInfo;
  }
  return root as DaemonSystemInfo;
}

function reportToLive(
  node: SavedNode,
  id: string,
  report: DaemonInstanceReport,
): DaemonLiveInstance {
  const config = report.config ?? {};
  const uuid = String(config.uuid ?? id);
  return {
    id: uuid,
    nodeId: node.id,
    nodeName: node.name,
    name: String(config.name ?? uuid),
    status: mapDaemonStatus(report.status),
    type: String(config.instance_type ?? "universal"),
    gameVersion: config.mc_version ? String(config.mc_version) : undefined,
    cpu: report.performance_counter?.cpu,
    memory: report.performance_counter?.memory,
    raw: report,
  };
}

function initialConnections(): Record<string, DaemonConnectionState> {
  return {};
}

/** 并发池，对齐 WPF min(ProcessorCount, 4) */
async function mapPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  if (items.length === 0) return;
  const concurrency = Math.max(1, Math.min(limit, items.length));
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => run()));
}

export function DaemonProvider({ children }: { children: ReactNode }) {
  const clientsRef = useRef<Map<string, DaemonClient>>(new Map());
  const [connections, setConnections] =
    useState<Record<string, DaemonConnectionState>>(initialConnections);
  const [instances, setInstances] = useState<DaemonLiveInstance[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const setNodeState = useCallback(
    (nodeId: string, patch: Partial<DaemonConnectionState>) => {
      setConnections((prev) => ({
        ...prev,
        [nodeId]: {
          ...(prev[nodeId] ?? emptyState(nodeId)),
          nodeId,
          ...patch,
        },
      }));
    },
    [],
  );

  const disconnectNode = useCallback(
    (nodeId: string, options?: { purge?: boolean }) => {
      const client = clientsRef.current.get(nodeId);
      if (client) {
        client.close();
        clientsRef.current.delete(nodeId);
      }
      setInstances((prev) => prev.filter((item) => item.nodeId !== nodeId));
      if (options?.purge) {
        // 删除节点：彻底移出连接表，避免残留 offline 条目影响列表
        setConnections((prev) => {
          if (!(nodeId in prev)) return prev;
          const next = { ...prev };
          delete next[nodeId];
          return next;
        });
        return;
      }
      setNodeState(nodeId, {
        status: "offline",
        error: null,
        systemInfo: null,
        lastPongAt: null,
      });
    },
    [setNodeState],
  );

  const refreshNodeInstances = useCallback(async (nodeId: string) => {
    const client = clientsRef.current.get(nodeId);
    const node = getNode(nodeId);
    if (!client?.ready || !node) return;
    const data = await client.getAllReports();
    const reports = extractReports(data);
    const next = Object.entries(reports).map(([id, report]) =>
      reportToLive(node, id, report),
    );
    setInstances((prev) => {
      const others = prev.filter((item) => item.nodeId !== nodeId);
      return [...others, ...next].sort((a, b) =>
        a.name.localeCompare(b.name, "zh-CN"),
      );
    });
  }, []);

  const attachClient = useCallback(
    (nodeId: string, credentials: Credentials) => {
      const client = new DaemonClient({
        host: credentials.host,
        port: credentials.port,
        secure: credentials.secure,
        token: credentials.token,
        onClose: () => {
          if (clientsRef.current.get(nodeId) === client) {
            if (client.intentionallyClosed) return;
            clientsRef.current.delete(nodeId);
            setNodeState(nodeId, {
              status: "offline",
              error: tKey("shared.daemon.error.disconnected"),
            });
          }
        },
      });
      return client;
    },
    [setNodeState],
  );

  /**
   * 对齐 ConnectDaemonInternalAsync：
   * 打开连接 → get_system_info 成功才算 ok。
   */
  const connectNode = useCallback(
    async (nodeId: string, options?: ConnectOptions) => {
      const node = getNode(nodeId);
      if (!node) {
        return { ok: false, message: tKey("shared.daemon.error.node-missing") };
      }
      const token = await getNodeTokenAsync(nodeId);
      if (!token) {
        setNodeState(nodeId, {
          status: "offline",
          error: tKey("shared.daemon.error.token-missing"),
          systemInfo: null,
        });
        return { ok: false, message: tKey("shared.daemon.error.token-missing") };
      }

      const credentials: Credentials = {
        host: node.host,
        port: node.port,
        secure: node.secure,
        token,
      };

      const existing = clientsRef.current.get(nodeId);
      if (existing?.ready && !options?.force) {
        try {
          await existing.ping();
          const systemInfo = extractSystemInfo(await existing.getSystemInfo());
          if (!systemInfo) {
            throw new Error(tKey("shared.daemon.error.system-info"));
          }
          setNodeState(nodeId, {
            status: "online",
            error: null,
            lastPongAt: Date.now(),
            systemInfo,
          });
          try {
            await refreshNodeInstances(nodeId);
          } catch {
            // 系统信息成功即视为在线；实例列表失败不降级连接
          }
          return { ok: true, info: systemInfo };
        } catch {
          existing.close();
          clientsRef.current.delete(nodeId);
        }
      } else if (existing) {
        existing.close();
        clientsRef.current.delete(nodeId);
      }

      setNodeState(nodeId, {
        status: "connecting",
        error: null,
      });

      const client = attachClient(nodeId, credentials);
      try {
        await client.connect();
        clientsRef.current.set(nodeId, client);
        await client.ping();
        const systemInfo = extractSystemInfo(await client.getSystemInfo());
        if (!systemInfo) {
          throw new Error(tKey("shared.daemon.error.system-info"));
        }
        setNodeState(nodeId, {
          status: "online",
          error: null,
          lastPongAt: Date.now(),
          systemInfo,
        });
        try {
          await refreshNodeInstances(nodeId);
        } catch {
          // ignore instance refresh failure after successful connect
        }
        return { ok: true, info: systemInfo };
      } catch (error) {
        client.close();
        clientsRef.current.delete(nodeId);
        const message = error instanceof Error ? error.message : tKey("shared.daemon.error.connect-failed");
        setNodeState(nodeId, {
          status: "offline",
          error: message,
          systemInfo: null,
        });
        setInstances((prev) => prev.filter((item) => item.nodeId !== nodeId));
        return { ok: false, message };
      }
    },
    [attachClient, refreshNodeInstances, setNodeState],
  );

  const connectAll = useCallback(
    async (options?: ConnectOptions) => {
      const nodes = listNodes();
      // 同步连接状态骨架，避免 UI 漏节点
      setConnections((prev) => {
        const next = { ...prev };
        for (const node of nodes) {
          if (!next[node.id]) next[node.id] = emptyState(node.id);
        }
        for (const id of Object.keys(next)) {
          if (!nodes.some((n) => n.id === id)) {
            delete next[id];
          }
        }
        return next;
      });
      await mapPool(nodes, 4, async (node) => {
        await connectNode(node.id, options);
      });
    },
    [connectNode],
  );

  const refreshDaemons = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshNodes();
      await connectAll({ force: true });
    } finally {
      setRefreshing(false);
    }
  }, [connectAll]);

  const refreshInstances = useCallback(async () => {
    setRefreshing(true);
    try {
      const nodes = listNodes();
      const onlineIds = nodes
        .map((n) => n.id)
        .filter((id) => clientsRef.current.get(id)?.ready);
      if (onlineIds.length === 0) {
        await connectAll();
        return;
      }
      await Promise.all(
        onlineIds.map(async (nodeId) => {
          try {
            await connectNode(nodeId);
          } catch (error) {
            setNodeState(nodeId, {
              status: "offline",
              error: error instanceof Error ? error.message : tKey("shared.daemon.error.refresh-failed"),
            });
          }
        }),
      );
    } finally {
      setRefreshing(false);
    }
  }, [connectAll, connectNode, setNodeState]);

  const testNode = useCallback(async (input: Credentials) => {
    // 可选 HTTP /info（CORS 失败不阻断）
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 2500);
      await fetch(httpInfoUrl(input.host, input.port, input.secure), {
        method: "GET",
        mode: "cors",
        signal: controller.signal,
      }).catch(() => null);
      window.clearTimeout(timer);
    } catch {
      // ignore
    }

    const client = new DaemonClient({
      host: input.host,
      port: input.port,
      secure: input.secure,
      token: input.token,
      requestTimeoutMs: 10_000,
    });
    try {
      await client.connect();
      await client.ping();
      const systemInfo = extractSystemInfo(await client.getSystemInfo());
      client.close();
      if (!systemInfo) {
        return { ok: false, message: tKey("shared.daemon.error.system-info") };
      }
      return { ok: true, info: systemInfo };
    } catch (error) {
      client.close();
      return {
        ok: false,
        message: error instanceof Error ? error.message : tKey("shared.daemon.error.connect-failed"),
      };
    }
  }, []);

  const withClient = useCallback(
    async (
      nodeId: string,
      run: (client: DaemonClient) => Promise<void>,
    ): Promise<{ ok: boolean; message?: string }> => {
      const client = clientsRef.current.get(nodeId);
      if (!client?.ready) {
        const connected = await connectNode(nodeId);
        if (!connected.ok) return connected;
      }
      const ready = clientsRef.current.get(nodeId);
      if (!ready?.ready) {
        return { ok: false, message: tKey("shared.daemon.error.not-connected") };
      }
      try {
        await run(ready);
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : tKey("shared.daemon.error.operation-failed"),
        };
      }
    },
    [connectNode],
  );

  const startInstance = useCallback(
    (nodeId: string, instanceId: string) =>
      withClient(nodeId, async (client) => {
        await client.startInstance(instanceId);
        await refreshNodeInstances(nodeId);
      }),
    [refreshNodeInstances, withClient],
  );

  const stopInstance = useCallback(
    (nodeId: string, instanceId: string) =>
      withClient(nodeId, async (client) => {
        await client.stopInstance(instanceId);
        await refreshNodeInstances(nodeId);
      }),
    [refreshNodeInstances, withClient],
  );

  const killInstance = useCallback(
    (nodeId: string, instanceId: string) =>
      withClient(nodeId, async (client) => {
        await client.killInstance(instanceId);
        await refreshNodeInstances(nodeId);
      }),
    [refreshNodeInstances, withClient],
  );

  // WPF 同样没有 restart_instance：停止后等待一秒再启动。
  const restartInstance = useCallback(
    (nodeId: string, instanceId: string) =>
      withClient(nodeId, async (client) => {
        await client.stopInstance(instanceId);
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        await client.startInstance(instanceId);
        await refreshNodeInstances(nodeId);
      }),
    [refreshNodeInstances, withClient],
  );

  const removeInstance = useCallback(
    (nodeId: string, instanceId: string) =>
      withClient(nodeId, async (client) => {
        await client.removeInstance(instanceId);
        await refreshNodeInstances(nodeId);
      }),
    [refreshNodeInstances, withClient],
  );

  const sendCommand = useCallback(
    (nodeId: string, instanceId: string, command: string) =>
      withClient(nodeId, async (client) => {
        await client.sendToInstance(instanceId, command);
      }),
    [withClient],
  );

  const getLogs = useCallback(
    async (nodeId: string, instanceId: string) => {
      const client = clientsRef.current.get(nodeId);
      if (!client?.ready) {
        const connected = await connectNode(nodeId);
        if (!connected.ok) {
          return { ok: false, message: connected.message };
        }
      }
      const ready = clientsRef.current.get(nodeId);
      if (!ready?.ready) {
        return { ok: false, message: tKey("shared.daemon.error.not-connected") };
      }
      try {
        const data = await ready.getInstanceLogHistory(instanceId);
        const logs = Array.isArray(data?.logs)
          ? data.logs.map(String)
          : Array.isArray(data)
            ? (data as unknown[]).map(String)
            : [];
        return { ok: true, logs };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : tKey("shared.daemon.error.read-logs-failed"),
        };
      }
    },
    [connectNode],
  );

  const subscribeInstanceLog = useCallback(
    async (
      nodeId: string,
      instanceId: string,
      onLog: (line: string) => void,
    ) => {
      const client = clientsRef.current.get(nodeId);
      if (!client?.ready) {
        const connected = await connectNode(nodeId);
        if (!connected.ok) {
          return { ok: false as const, message: connected.message };
        }
      }
      const ready = clientsRef.current.get(nodeId);
      if (!ready?.ready) {
        return {
          ok: false as const,
          message: tKey("shared.daemon.error.not-connected"),
        };
      }
      try {
        const unsubscribe = await ready.subscribeInstanceLog(instanceId, onLog);
        return { ok: true as const, unsubscribe };
      } catch (error) {
        return {
          ok: false as const,
          message:
            error instanceof Error
              ? error.message
              : tKey("shared.daemon.error.operation-failed"),
        };
      }
    },
    [connectNode],
  );

  const refreshInstanceReport = useCallback(
    async (nodeId: string, instanceId: string) => {
      const node = getNode(nodeId);
      const client = clientsRef.current.get(nodeId);
      if (!client?.ready || !node) {
        return {
          ok: false as const,
          message: tKey("shared.daemon.error.not-connected"),
        };
      }
      try {
        const data = await client.getInstanceReport(instanceId);
        const report =
          data && typeof data === "object" && "report" in (data as object)
            ? ((data as { report?: DaemonInstanceReport }).report ??
              (data as DaemonInstanceReport))
            : (data as DaemonInstanceReport);
        if (!report || typeof report !== "object") {
          return {
            ok: false as const,
            message: tKey("shared.daemon.error.operation-failed"),
          };
        }
        const live = reportToLive(node, instanceId, report);
        setInstances((prev) => {
          const others = prev.filter(
            (item) => !(item.nodeId === nodeId && item.id === instanceId),
          );
          return [...others, live].sort((a, b) =>
            a.name.localeCompare(b.name, "zh-CN"),
          );
        });
        return { ok: true as const };
      } catch (error) {
        return {
          ok: false as const,
          message:
            error instanceof Error
              ? error.message
              : tKey("shared.daemon.error.operation-failed"),
        };
      }
    },
    [],
  );

  const runWithClient = useCallback(
    async <T,>(
      nodeId: string,
      run: (client: DaemonClient) => Promise<T>,
    ): Promise<{ ok: true; data: T } | { ok: false; message?: string }> => {
      const client = clientsRef.current.get(nodeId);
      if (!client?.ready) {
        const connected = await connectNode(nodeId);
        if (!connected.ok) return { ok: false, message: connected.message };
      }
      const ready = clientsRef.current.get(nodeId);
      if (!ready?.ready) {
        return { ok: false, message: tKey("shared.daemon.error.not-connected") };
      }
      try {
        const data = await run(ready);
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : tKey("shared.daemon.error.operation-failed"),
        };
      }
    },
    [connectNode],
  );

  const getJavaList = useCallback(
    async (nodeId: string) => {
      const result = await runWithClient(nodeId, (client) =>
        client.getJavaList(),
      );
      if (!result.ok) return { ok: false, message: result.message };
      return { ok: true, javaList: result.data };
    },
    [runWithClient],
  );

  const addInstance = useCallback(
    async (nodeId: string, setting: InstanceFactorySettingPayload) => {
      const result = await runWithClient(nodeId, async (client) => {
        const config = await client.addInstance(setting);
        await refreshNodeInstances(nodeId);
        return config;
      });
      if (!result.ok) return { ok: false, message: result.message };
      return { ok: true, config: result.data };
    },
    [refreshNodeInstances, runWithClient],
  );

  const uploadFile = useCallback(
    async (
      nodeId: string,
      file: File | Blob,
      dst: string,
      onProgress?: (progress: UploadProgress) => void,
    ) => {
      const result = await runWithClient(nodeId, (client) =>
        client.uploadFile(file, dst, { onProgress }),
      );
      if (!result.ok) return { ok: false, message: result.message };
      return { ok: true, path: result.data };
    },
    [runWithClient],
  );

  const getStatus = useCallback(
    (nodeId: string): NodeStatus => connections[nodeId]?.status ?? "offline",
    [connections],
  );

  // 启动：从后端 hydrate 节点与偏好后连接全部
  useEffect(() => {
    const clients = clientsRef.current;
    let cancelled = false;
    const task = window.setTimeout(() => {
      void (async () => {
        await Promise.all([hydrateNodes(), hydrateSettings()]);
        if (cancelled) return;
        await connectAll();
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(task);
      for (const [id, client] of clients) {
        client.close();
        clients.delete(id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const value = useMemo(
    () => ({
      connections,
      instances,
      refreshing,
      getStatus,
      connectNode,
      disconnectNode,
      connectAll,
      refreshDaemons,
      refreshInstances,
      testNode,
      startInstance,
      stopInstance,
      killInstance,
      restartInstance,
      removeInstance,
      sendCommand,
      getLogs,
      subscribeInstanceLog,
      refreshInstanceReport,
      runWithClient,
      getJavaList,
      addInstance,
      uploadFile,
    }),
    [
      connections,
      instances,
      refreshing,
      getStatus,
      connectNode,
      disconnectNode,
      connectAll,
      refreshDaemons,
      refreshInstances,
      testNode,
      startInstance,
      stopInstance,
      killInstance,
      restartInstance,
      removeInstance,
      sendCommand,
      getLogs,
      subscribeInstanceLog,
      refreshInstanceReport,
      runWithClient,
      getJavaList,
      addInstance,
      uploadFile,
    ],
  );

  return (
    <DaemonContext.Provider value={value}>{children}</DaemonContext.Provider>
  );
}

export function useDaemon() {
  const ctx = useContext(DaemonContext);
  if (!ctx) throw new Error("useDaemon must be used within DaemonProvider");
  return ctx;
}

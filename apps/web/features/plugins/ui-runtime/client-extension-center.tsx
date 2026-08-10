"use client";

import {
  CheckCircle2,
  FileArchive,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ConsolePanel,
  ConsolePanelHeader,
} from "@/components/templates/console-surface";
import { useDaemon } from "@/features/nodes/daemon-provider";
import { type DaemonEventPacket } from "@/lib/daemon/client";
import { sha256Hex } from "@/lib/daemon/binary";
import { V2_EVENTS } from "@/lib/daemon/types";
import { cn } from "@/lib/utils";

import {
  ClientExtensionManager,
  IndexedDbClientExtensionPayloadStore,
  LocalStorageClientExtensionCacheStore,
  MemoryClientExtensionPayloadStore,
  buildClientExtensionManifestDrift,
  type ClientExtensionCacheEntry,
  type ClientExtensionManifestDrift,
  type ClientExtensionPayloadStore,
} from "./client-extension-manager";
import {
  applyClientExtensionStateEnvelope,
  createClientExtensionState,
  dispatchClientExtensionCommand,
  dispatchClientExtensionEvent,
  listClientExtensionResources,
} from "./client-extension-runtime";
import {
  parseExtensionProtocolEnvelope,
  type ExtensionJsonValue,
  type ExtensionProtocolEnvelope,
  type ExtensionStateSnapshot,
} from "./extension-protocol";
import {
  validateMpxPackage,
  type MpxPackageDiagnostic,
  type ValidatedMpxPackage,
} from "./mpx-validator";
import { PluginUiRenderer, type PluginUiEvent } from "./web-renderer";

interface ExtensionCenterMessage {
  readonly kind: "success" | "error" | "info";
  readonly title: string;
  readonly details?: string;
}

interface ExtensionEventRecord {
  readonly timestamp: string;
  readonly extensionId: string;
  readonly event: PluginUiEvent | ExtensionProtocolEnvelope;
  readonly status?: string;
}

interface PendingExtensionInstall {
  readonly fileName: string;
  readonly bytes: Uint8Array;
  readonly package: ValidatedMpxPackage;
  readonly drift: readonly ClientExtensionManifestDrift[];
}

interface DaemonRestartWatch {
  readonly nodeId: string;
  readonly extensionId: string;
  readonly sawDisconnect: boolean;
}

export function ClientExtensionCenter() {
  const daemon = useDaemon();
  const managerRef = useRef<ClientExtensionManager | null>(null);
  const payloadStoreRef = useRef<ClientExtensionPayloadStore | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [entries, setEntries] = useState<readonly ClientExtensionCacheEntry[]>(
    [],
  );
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState<ExtensionCenterMessage | null>(null);
  const [installing, setInstalling] = useState(false);
  const [pendingInstall, setPendingInstall] =
    useState<PendingExtensionInstall | null>(null);
  const [events, setEvents] = useState<readonly ExtensionEventRecord[]>([]);
  const [stateSnapshots, setStateSnapshots] = useState<
    Readonly<Record<string, ExtensionStateSnapshot>>
  >({});
  const [daemonDeploymentStatuses, setDaemonDeploymentStatuses] = useState<
    Readonly<Record<string, string>>
  >({});
  const [restartWatch, setRestartWatch] = useState<DaemonRestartWatch | null>(
    null,
  );

  const connectedNodeId = useMemo(
    () =>
      Object.values(daemon.connections).find(
        (connection) => connection.status === "online",
      )?.nodeId ?? "",
    [daemon.connections],
  );

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? entries[0],
    [entries, selectedId],
  );

  const selectedDaemonDeploymentStatus = selectedEntry
    ? daemonDeploymentStatuses[selectedEntry.id]
    : undefined;

  const recordEvent = useCallback(
    (
      entry: ClientExtensionCacheEntry,
      event: PluginUiEvent | ExtensionProtocolEnvelope,
      status?: string,
    ) => {
      setEvents((current) =>
        [
          {
            timestamp: new Date().toLocaleTimeString(),
            extensionId: entry.id,
            event,
            status,
          },
          ...current,
        ].slice(0, 8),
      );
    },
    [],
  );

  const routeExtensionEnvelope = useCallback(
    (nodeId: string, envelope: ExtensionProtocolEnvelope) => {
      const entry = managerRef.current?.get(envelope.plugin ?? "");
      if (entry === undefined) return;

      if (
        envelope.type === "state.patch" ||
        envelope.type === "state.snapshot"
      ) {
        setStateSnapshots((current) => {
          const snapshot =
            current[entry.id] ?? createClientExtensionState(entry);
          const next = applyClientExtensionStateEnvelope(
            entry,
            snapshot,
            envelope,
          );
          if (!next.applied) return current;
          return { ...current, [entry.id]: next };
        });
        recordEvent(
          entry,
          envelope,
          `State revision ${envelope.revision} applied from ${nodeId}.`,
        );
        return;
      }

      if (envelope.type === "event") {
        void dispatchClientExtensionEvent(
          entry,
          envelope,
          async (eventEnvelope) => {
            recordEvent(
              entry,
              eventEnvelope,
              `Daemon event '${eventEnvelope.name}' accepted from ${nodeId}.`,
            );
          },
        ).then((result) => {
          if (!result.dispatched) {
            recordEvent(entry, envelope, result.diagnostics.join(", "));
          }
        });
      }
    },
    [recordEvent],
  );

  const refreshEntries = useCallback(() => {
    const nextEntries = managerRef.current?.list() ?? [];
    setEntries(nextEntries);
    setSelectedId((current) => {
      if (current && nextEntries.some((entry) => entry.id === current)) {
        return current;
      }
      return nextEntries[0]?.id ?? "";
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const payloadStore =
      typeof window.indexedDB === "undefined"
        ? new MemoryClientExtensionPayloadStore()
        : new IndexedDbClientExtensionPayloadStore();
    const manager = new ClientExtensionManager(
      new LocalStorageClientExtensionCacheStore(window.localStorage),
      payloadStore,
    );
    managerRef.current = manager;
    payloadStoreRef.current = payloadStore;

    void manager
      .restore()
      .then(() => {
        if (!cancelled) refreshEntries();
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setMessage({
          kind: "error",
          title: "Could not restore installed extensions.",
          details: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [refreshEntries]);

  useEffect(() => {
    return daemon.subscribeDaemonEvents((nodeId, packet) => {
      const directEnvelope = parseExtensionProtocolEnvelope(
        extractExtensionEnvelope(packet.data),
      );
      if (directEnvelope.ok) {
        if (
          isPluginExtensionEnvelopeSource(directEnvelope.envelope, packet.event)
        ) {
          routeExtensionEnvelope(nodeId, directEnvelope.envelope);
        }
        return;
      }

      for (const entry of managerRef.current?.list() ?? []) {
        const envelope = wrapDaemonEventForEntry(entry, packet);
        if (envelope !== undefined) {
          routeExtensionEnvelope(nodeId, envelope);
        }
      }
    });
  }, [daemon, routeExtensionEnvelope]);

  useEffect(() => {
    if (!connectedNodeId || entries.length === 0) return;

    const eventNames = Array.from(
      new Set(
        entries.flatMap((entry) =>
          (entry.manifest.permissions.events ?? [])
            .map((eventName) => toDaemonEventName(entry, eventName))
            .filter((name): name is string => name !== undefined),
        ),
      ),
    );
    if (eventNames.length === 0) return;

    let cancelled = false;
    const subscribed: string[] = [];
    void (async () => {
      for (const eventName of eventNames) {
        if (cancelled) return;
        const result = await daemon.runWithClient(connectedNodeId, (client) =>
          client.subscribeEvent(eventName),
        );
        if (result.ok) {
          subscribed.push(eventName);
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const eventName of subscribed) {
        void daemon.runWithClient(connectedNodeId, (client) =>
          client.unsubscribeEvent(eventName),
        );
      }
    };
  }, [connectedNodeId, daemon, entries]);

  useEffect(() => {
    if (!restartWatch) return;
    const status = daemon.connections[restartWatch.nodeId]?.status ?? "offline";
    if (!restartWatch.sawDisconnect && status !== "online") {
      setRestartWatch({ ...restartWatch, sawDisconnect: true });
      setMessage({
        kind: "info",
        title: "Daemon shutdown observed.",
        details:
          "Waiting for the same daemon node to come back online. Restart must be performed by its launcher or service manager.",
      });
      return;
    }

    if (restartWatch.sawDisconnect && status === "online") {
      setMessage({
        kind: "success",
        title: "Daemon reconnected.",
        details: `Node ${restartWatch.nodeId} is online again. Refresh deployment status before continuing extension work.`,
      });
      setRestartWatch(null);
    }
  }, [daemon.connections, restartWatch]);

  useEffect(() => {
    if (!selectedEntry?.deploymentPlan.daemon?.plugin) return;
    if (!connectedNodeId) {
      setDaemonDeploymentStatuses((current) => ({
        ...current,
        [selectedEntry.id]:
          "No connected daemon is available for deployment status.",
      }));
      return;
    }

    let cancelled = false;
    void daemon
      .runWithClient(connectedNodeId, (client) =>
        client.getExtensionDaemonBundleStatus(selectedEntry.id),
      )
      .then((result) => {
        if (cancelled) return;
        setDaemonDeploymentStatuses((current) => ({
          ...current,
          [selectedEntry.id]: result.ok
            ? deploymentStatus(result.data)
            : (result.message ?? "Daemon deployment status is unavailable."),
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [
    connectedNodeId,
    daemon,
    selectedEntry?.id,
    selectedEntry?.deploymentPlan.daemon?.plugin,
  ]);

  async function installPackage(file: File) {
    const manager = managerRef.current;
    if (!manager) return;
    setInstalling(true);
    setMessage(null);
    setPendingInstall(null);

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const validation = await validateMpxPackage(bytes);
      if (!validation.ok) {
        setMessage({
          kind: "error",
          title: "Extension package was rejected.",
          details: formatDiagnostics(validation.diagnostics),
        });
        return;
      }

      setPendingInstall({
        fileName: file.name,
        bytes,
        package: validation.package,
        drift: buildClientExtensionManifestDrift(
          manager.get(validation.package.manifest.package.id),
          validation.package,
        ),
      });
      setMessage({
        kind: "info",
        title: "Review extension permissions before installation.",
        details:
          "The package is validated, but no client cache entry has been written yet.",
      });
    } catch (error) {
      setMessage({
        kind: "error",
        title: "Extension package could not be read.",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setInstalling(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function confirmPendingInstall() {
    const manager = managerRef.current;
    if (!manager || !pendingInstall) return;
    setInstalling(true);
    setMessage(null);

    try {
      const installed = await manager.installPersisted(
        pendingInstall.package,
        pendingInstall.bytes,
      );
      if (!installed.ok) {
        setMessage({
          kind: "error",
          title: "Extension could not be installed.",
          details: `${installed.code}: ${installed.message}`,
        });
        return;
      }

      await manager.restore();
      refreshEntries();
      setSelectedId(installed.entry.id);
      setPendingInstall(null);
      setMessage({
        kind: "success",
        title: "Extension installed.",
        details: `${installed.entry.id} ${installed.entry.version}`,
      });
    } catch (error) {
      setMessage({
        kind: "error",
        title: "Extension could not be installed.",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setInstalling(false);
    }
  }

  function cancelPendingInstall() {
    setPendingInstall(null);
    setMessage({
      kind: "info",
      title: "Extension installation cancelled.",
    });
  }

  async function uninstallSelected() {
    if (!selectedEntry) return;
    const removed = await managerRef.current?.uninstallPersisted(
      selectedEntry.id,
    );
    refreshEntries();
    setMessage({
      kind: removed ? "success" : "info",
      title: removed ? "Extension removed." : "Extension was already absent.",
      details: selectedEntry.id,
    });
  }

  async function deploySelectedDaemonBundle() {
    if (!selectedEntry) return;
    const daemonBundle = selectedEntry.deploymentPlan.daemon?.plugin;
    if (daemonBundle === undefined) return;
    if (!connectedNodeId) {
      setMessage({
        kind: "error",
        title: "No connected daemon is available for deployment.",
      });
      return;
    }

    const payload = selectedEntry.cachedPayloads?.find(
      (candidate) => candidate.path === daemonBundle.path,
    );
    const payloadStore = payloadStoreRef.current;
    if (payload === undefined || payloadStore === null) {
      setMessage({
        kind: "error",
        title: "Daemon bundle bytes are not cached.",
        details:
          "Reinstall the .mpx package so the daemon bundle can be deployed.",
      });
      return;
    }

    setInstalling(true);
    setMessage(null);
    try {
      const bytes = await payloadStore.readFile(payload.storageRef);
      if (
        bytes === undefined ||
        (await sha256Hex(bytes)) !== daemonBundle.sha256
      ) {
        setMessage({
          kind: "error",
          title: "Cached daemon bundle failed digest verification.",
        });
        return;
      }

      const uploadBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(uploadBuffer).set(bytes);
      const upload = await daemon.uploadFile(
        connectedNodeId,
        new Blob([uploadBuffer], { type: "application/zip" }),
        `caches/uploads/extensions/${selectedEntry.id}-${selectedEntry.version}.zip`,
      );
      if (!upload.ok || !upload.path) {
        setMessage({
          kind: "error",
          title: "Daemon bundle upload failed.",
          details: upload.message,
        });
        return;
      }

      const deployed = await daemon.runWithClient(connectedNodeId, (client) =>
        client.installExtensionDaemonBundle({
          pluginId: selectedEntry.id,
          sourcePath: upload.path!,
          sha256: daemonBundle.sha256,
        }),
      );
      if (!deployed.ok) {
        setMessage({
          kind: "error",
          title: "Daemon bundle deployment failed.",
          details: deployed.message,
        });
        return;
      }

      setMessage({
        kind: "success",
        title: "Daemon bundle deployed.",
        details: `${deploymentStatus(deployed.data)} Restart the daemon to apply it.`,
      });
      setDaemonDeploymentStatuses((current) => ({
        ...current,
        [selectedEntry.id]: deploymentStatus(deployed.data),
      }));
    } catch (error) {
      setMessage({
        kind: "error",
        title: "Daemon bundle deployment failed.",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setInstalling(false);
    }
  }

  async function setSelectedDaemonBundleEnabled(enabled: boolean) {
    if (!selectedEntry || !selectedEntry.deploymentPlan.daemon?.plugin) return;
    if (!connectedNodeId) {
      setMessage({
        kind: "error",
        title: `No connected daemon is available for ${enabled ? "enable" : "disable"}.`,
      });
      return;
    }

    setInstalling(true);
    setMessage(null);
    try {
      const changed = await daemon.runWithClient(connectedNodeId, (client) =>
        enabled
          ? client.enableExtensionDaemonBundle(selectedEntry.id)
          : client.disableExtensionDaemonBundle(selectedEntry.id),
      );
      if (!changed.ok) {
        setMessage({
          kind: "error",
          title: `Daemon bundle ${enabled ? "enable" : "disable"} failed.`,
          details: changed.message,
        });
        return;
      }

      const status = deploymentStatus(changed.data);
      setMessage({
        kind: "success",
        title: `Daemon bundle ${enabled ? "enabled" : "disabled"}.`,
        details: `${status} Restart the daemon to apply it.`,
      });
      setDaemonDeploymentStatuses((current) => ({
        ...current,
        [selectedEntry.id]: status,
      }));
    } catch (error) {
      setMessage({
        kind: "error",
        title: `Daemon bundle ${enabled ? "enable" : "disable"} failed.`,
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setInstalling(false);
    }
  }

  async function removeSelectedDaemonBundle() {
    if (!selectedEntry || !selectedEntry.deploymentPlan.daemon?.plugin) return;
    if (!connectedNodeId) {
      setMessage({
        kind: "error",
        title: "No connected daemon is available for removal.",
      });
      return;
    }

    setInstalling(true);
    setMessage(null);
    try {
      const removed = await daemon.runWithClient(connectedNodeId, (client) =>
        client.removeExtensionDaemonBundle(selectedEntry.id),
      );
      if (!removed.ok) {
        setMessage({
          kind: "error",
          title: "Daemon bundle removal failed.",
          details: removed.message,
        });
        return;
      }

      setMessage({
        kind: "success",
        title: "Daemon bundle removed.",
        details: `${deploymentStatus(removed.data)} Restart the daemon to apply it.`,
      });
      setDaemonDeploymentStatuses((current) => ({
        ...current,
        [selectedEntry.id]: deploymentStatus(removed.data),
      }));
    } catch (error) {
      setMessage({
        kind: "error",
        title: "Daemon bundle removal failed.",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setInstalling(false);
    }
  }

  async function requestDaemonRestart() {
    if (!selectedEntry || !selectedEntry.deploymentPlan.daemon?.plugin) return;
    if (!connectedNodeId) {
      setMessage({
        kind: "error",
        title: "No connected daemon is available for restart request.",
      });
      return;
    }

    setInstalling(true);
    setMessage(null);
    try {
      const requested = await daemon.runWithClient(connectedNodeId, (client) =>
        client.requestDaemonShutdown(`extension:${selectedEntry.id}`),
      );
      if (!requested.ok) {
        setMessage({
          kind: "error",
          title: "Daemon restart request failed.",
          details: requested.message,
        });
        return;
      }

      setMessage({
        kind: "success",
        title: "Daemon shutdown requested.",
        details:
          (requested.data.message ??
            "Restart the daemon through its service manager or launcher.") +
          " Waiting for disconnect and reconnect signals.",
      });
      setRestartWatch({
        nodeId: connectedNodeId,
        extensionId: selectedEntry.id,
        sawDisconnect: false,
      });
    } catch (error) {
      setMessage({
        kind: "error",
        title: "Daemon restart request failed.",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setInstalling(false);
    }
  }

  async function handleUiEvent(
    entry: ClientExtensionCacheEntry,
    event: PluginUiEvent,
  ) {
    recordEvent(entry, event);
    if (!event.command) return;

    if (!connectedNodeId) {
      recordEvent(
        entry,
        event,
        "No connected daemon is available for command dispatch.",
      );
      return;
    }

    const result = await dispatchClientExtensionCommand(
      entry,
      {
        async request<T>(method: string, params: Record<string, unknown>) {
          const dispatched = await daemon.runWithClient(
            connectedNodeId,
            (client) => client.request<T>(method, params),
          );
          if (!dispatched.ok) {
            throw new Error(dispatched.message ?? "Daemon request failed.");
          }
          return dispatched.data;
        },
      },
      event,
    );

    recordEvent(
      entry,
      event,
      result.ok
        ? "Extension Protocol command accepted."
        : result.diagnostics.join(", "),
    );
  }

  const selectedState = selectedEntry
    ? (stateSnapshots[selectedEntry.id]?.state ?? {})
    : {};
  const selectedResources = selectedEntry
    ? listClientExtensionResources(selectedEntry)
    : [];

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
      <ConsolePanel className="flex min-h-0 flex-col gap-4" padded={false}>
        <div className="border-b p-4">
          <ConsolePanelHeader
            className="mb-0"
            title="扩展 / 插件"
            description="安装、恢复和管理本机已校验的 .mpx 扩展包。"
            action={
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  title="Refresh"
                  onClick={refreshEntries}
                >
                  <RefreshCw className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  title="Install .mpx"
                  disabled={installing}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-4" />
                </Button>
              </div>
            }
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".mpx,application/zip"
            className="hidden"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void installPackage(file);
            }}
          />
        </div>

        <div className="mcsl-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={cn(
                "flex w-full min-w-0 flex-col gap-2 rounded-xl border p-3 text-left transition-colors",
                selectedEntry?.id === entry.id
                  ? "border-primary/50 bg-primary/5"
                  : "hover:bg-muted/50",
              )}
              onClick={() => setSelectedId(entry.id)}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{entry.id}</span>
                <Badge variant={entry.uiSchema ? "success" : "secondary"}>
                  {entry.uiSchema ? "UI" : "assets"}
                </Badge>
              </span>
              <span className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                <Badge variant="outline">v{entry.version}</Badge>
                <Badge variant="outline">
                  {entry.commands.length} command(s)
                </Badge>
                <Badge variant="outline">
                  {entry.resources.length} resource(s)
                </Badge>
              </span>
            </button>
          ))}
          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              No extension package is installed in the client cache yet.
            </div>
          ) : null}
        </div>
      </ConsolePanel>

      <div className="min-w-0 space-y-4">
        <MarketplacePreviewPanel />

        {message ? (
          <Alert variant={message.kind === "error" ? "destructive" : "default"}>
            {message.kind === "success" ? (
              <CheckCircle2 className="size-4" />
            ) : null}
            <AlertTitle>{message.title}</AlertTitle>
            {message.details ? (
              <AlertDescription>{message.details}</AlertDescription>
            ) : null}
          </Alert>
        ) : null}

        {pendingInstall ? (
          <PendingInstallReview
            review={pendingInstall}
            installing={installing}
            onConfirm={() => void confirmPendingInstall()}
            onCancel={cancelPendingInstall}
          />
        ) : null}

        {selectedEntry ? (
          <>
            <ConsolePanel>
              <ConsolePanelHeader
                title={selectedEntry.id}
                description={`Version ${selectedEntry.version}. ${connectedNodeId ? `Daemon dispatch target: ${connectedNodeId}.` : "Connect a daemon to enable command dispatch."}`}
                action={
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.deploymentPlan.daemon?.plugin ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={installing || !connectedNodeId}
                          onClick={() => void deploySelectedDaemonBundle()}
                        >
                          <Upload className="size-4" />
                          Deploy daemon
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={installing || !connectedNodeId}
                          onClick={() =>
                            void setSelectedDaemonBundleEnabled(true)
                          }
                        >
                          <CheckCircle2 className="size-4" />
                          Enable daemon
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={installing || !connectedNodeId}
                          onClick={() =>
                            void setSelectedDaemonBundleEnabled(false)
                          }
                        >
                          <TriangleAlert className="size-4" />
                          Disable daemon
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={installing || !connectedNodeId}
                          onClick={() => void requestDaemonRestart()}
                        >
                          <RefreshCw className="size-4" />
                          Request restart
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={installing || !connectedNodeId}
                          onClick={() => void removeSelectedDaemonBundle()}
                        >
                          <Trash2 className="size-4" />
                          Remove daemon
                        </Button>
                      </>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void uninstallSelected()}
                    >
                      <Trash2 className="size-4" />
                      Remove client
                    </Button>
                  </div>
                }
              />
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <SummaryBlock
                  icon={<PlugZap className="size-4" />}
                  label="Capabilities"
                  values={selectedEntry.manifest.permissions.host ?? []}
                  empty="No host capability"
                />
                <SummaryBlock
                  icon={<FileArchive className="size-4" />}
                  label="Commands"
                  values={selectedEntry.commands.map((command) => command.id)}
                  empty="No command"
                />
                <SummaryBlock
                  icon={<FileArchive className="size-4" />}
                  label="Resources"
                  values={selectedResources.map((resource) => resource.path)}
                  empty="No resource"
                />
              </div>
              {restartWatch?.extensionId === selectedEntry.id ? (
                <Alert className="mt-3">
                  <RefreshCw className="size-4" />
                  <AlertTitle>Daemon restart lifecycle</AlertTitle>
                  <AlertDescription>
                    {restartWatch.sawDisconnect
                      ? "Shutdown was observed. Waiting for this daemon node to reconnect."
                      : "Shutdown request was accepted. Waiting for the daemon connection to close."}
                  </AlertDescription>
                </Alert>
              ) : null}
              {selectedEntry.deploymentPlan.daemon?.plugin ? (
                <Alert className="mt-3">
                  <TriangleAlert className="size-4" />
                  <AlertTitle>Daemon deployment pending</AlertTitle>
                  <AlertDescription>
                    Bundle {selectedEntry.deploymentPlan.daemon.plugin.path} is
                    cached with this package. Deploying it to daemon plugins and
                    applying the required daemon restart is a separate lifecycle
                    step.
                    {selectedDaemonDeploymentStatus ? (
                      <span className="mt-2 block">
                        Daemon status: {selectedDaemonDeploymentStatus}
                      </span>
                    ) : null}
                  </AlertDescription>
                </Alert>
              ) : null}
            </ConsolePanel>

            {selectedEntry.uiSchema ? (
              <PluginUiRenderer
                schema={selectedEntry.uiSchema}
                state={selectedState}
                onEvent={(event) => void handleUiEvent(selectedEntry, event)}
              />
            ) : (
              <Alert>
                <AlertTitle>This extension has no UI panel.</AlertTitle>
                <AlertDescription>
                  It is installed and available to runtime helpers, but it only
                  contributes resources, theme data, or daemon payloads.
                </AlertDescription>
              </Alert>
            )}

            <ConsolePanel>
              <ConsolePanelHeader
                title="Runtime events"
                description="Recent UI events and command dispatch results for this installed extension."
              />
              <div className="space-y-2">
                {events.filter(
                  (event) => event.extensionId === selectedEntry.id,
                ).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No event emitted yet.
                  </p>
                ) : null}
                {events
                  .filter((event) => event.extensionId === selectedEntry.id)
                  .map((record, index) => (
                    <pre
                      key={`${record.timestamp}-${index}`}
                      className="overflow-auto rounded-xl bg-muted p-3 text-xs text-foreground"
                    >
                      {record.timestamp} {record.status ?? "UI event"}
                      {"\n"}
                      {JSON.stringify(record.event, null, 2)}
                    </pre>
                  ))}
              </div>
            </ConsolePanel>
          </>
        ) : (
          <ConsolePanel className="flex min-h-[20rem] items-center justify-center text-center">
            <div className="max-w-sm text-sm text-muted-foreground">
              <FileArchive className="mx-auto mb-3 size-8" />
              Install a validated .mpx package to inspect its declared commands,
              resources, capabilities, and UI surface.
            </div>
          </ConsolePanel>
        )}
      </div>
    </div>
  );
}

function MarketplacePreviewPanel() {
  return (
    <ConsolePanel>
      <ConsolePanelHeader
        title="Extension marketplace"
        description="Online discovery, registry search, updates, and dependency downloads are reserved for the registry phase."
        action={
          <Button type="button" variant="outline" disabled>
            <PlugZap className="size-4" />
            Coming soon
          </Button>
        }
      />
      <Alert>
        <TriangleAlert className="size-4" />
        <AlertTitle>Marketplace shell only</AlertTitle>
        <AlertDescription>
          This preview keeps the user-facing marketplace location stable without
          contacting a remote registry or installing packages from the network.
          Use local .mpx install for now.
        </AlertDescription>
      </Alert>
    </ConsolePanel>
  );
}

function PendingInstallReview({
  review,
  installing,
  onConfirm,
  onCancel,
}: {
  readonly review: PendingExtensionInstall;
  readonly installing: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  const manifest = review.package.manifest;
  const daemonPlan = review.package.deploymentPlan.daemon;
  const extensionPoints =
    review.package.deploymentPlan.daemon?.extensionPoints ??
    manifest.extensionPoints ??
    [];
  const signatureSummary = review.package.signature
    ? `Trusted publisher ${review.package.signature.publisher} (${review.package.signature.keyId})`
    : "Unsigned local package";
  const dependencies = manifest.dependencies?.extensions ?? [];
  const updateSummary = manifest.updates
    ? `${manifest.updates.channel ?? "stable"}/${manifest.updates.strategy ?? "manual"}`
    : "Manual local install";
  const auditFindings = buildAuditFindings(review.package);
  return (
    <ConsolePanel>
      <ConsolePanelHeader
        title="Permission review"
        description={`${manifest.package.displayName ?? manifest.package.id} ${manifest.package.version} from ${review.fileName}`}
        action={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={installing}
              onClick={onCancel}
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button type="button" disabled={installing} onClick={onConfirm}>
              <ShieldCheck className="size-4" />
              Confirm install
            </Button>
          </div>
        }
      />
      <div className="space-y-3">
        <Alert>
          <TriangleAlert className="size-4" />
          <AlertTitle>Local package audit</AlertTitle>
          <AlertDescription>
            {review.package.signature
              ? `Signature verified for ${review.package.signature.publisher} with key ${review.package.signature.keyId}.`
              : "This package is unsigned; install only if the source is trusted."}{" "}
            {daemonPlan?.plugin
              ? "It also carries a daemon payload, so daemon deployment and restart status must be handled separately."
              : "It will only be cached by this client."}
          </AlertDescription>
        </Alert>
        {review.drift.length > 0 ? (
          <Alert>
            <TriangleAlert className="size-4" />
            <AlertTitle>Installed extension drift</AlertTitle>
            <AlertDescription>
              This package replaces an installed entry and changes reviewed
              permissions, trust, deployment, or dependency metadata.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <SummaryBlock
            icon={<PlugZap className="size-4" />}
            label="Host permissions"
            values={manifest.permissions.host ?? []}
            empty="No host capability"
          />
          <SummaryBlock
            icon={<ShieldCheck className="size-4" />}
            label="Event permissions"
            values={manifest.permissions.events ?? []}
            empty="No event subscription"
          />
          <SummaryBlock
            icon={<FileArchive className="size-4" />}
            label="Daemon commands"
            values={(manifest.commands ?? []).map((command) => command.id)}
            empty="No daemon command"
          />
          <SummaryBlock
            icon={<FileArchive className="size-4" />}
            label="Extension points"
            values={extensionPoints.map((point) => `${point.kind}:${point.id}`)}
            empty="No extension point"
          />
          <SummaryBlock
            icon={<FileArchive className="size-4" />}
            label="Resources"
            values={(manifest.resources ?? []).map((resource) => resource.path)}
            empty="No resource"
          />
          <SummaryBlock
            icon={<PlugZap className="size-4" />}
            label="Dependencies"
            values={dependencies.map(
              (dependency) => `${dependency.id} ${dependency.version}`,
            )}
            empty="No extension dependency"
          />
          <SummaryBlock
            icon={<ShieldCheck className="size-4" />}
            label="Updates"
            values={[updateSummary]}
            empty="Manual local install"
          />
          <SummaryBlock
            icon={<ShieldCheck className="size-4" />}
            label="Signature"
            values={[signatureSummary]}
            empty="Unsigned local package"
          />
          <SummaryBlock
            icon={<FileArchive className="size-4" />}
            label="Package size"
            values={[formatBytes(review.package.totalUncompressedBytes)]}
            empty="No payload"
          />
        </div>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          {review.drift.map((finding) => (
            <div
              key={`drift-${finding.title}`}
              className="rounded-xl border p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-medium">Drift: {finding.title}</span>
                <Badge
                  variant={
                    finding.level === "high"
                      ? "destructive"
                      : finding.level === "medium"
                        ? "warning"
                        : "success"
                  }
                >
                  {finding.level}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{finding.details}</p>
            </div>
          ))}
          {auditFindings.map((finding) => (
            <div key={finding.title} className="rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-medium">{finding.title}</span>
                <Badge
                  variant={
                    finding.level === "high"
                      ? "destructive"
                      : finding.level === "medium"
                        ? "warning"
                        : "success"
                  }
                >
                  {finding.level}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{finding.details}</p>
            </div>
          ))}
        </div>
      </div>
    </ConsolePanel>
  );
}

type AuditFinding = {
  readonly level: "low" | "medium" | "high";
  readonly title: string;
  readonly details: string;
};

function buildAuditFindings(pkg: ValidatedMpxPackage): readonly AuditFinding[] {
  const manifest = pkg.manifest;
  const host = manifest.permissions.host ?? [];
  const extensionPoints = pkg.deploymentPlan.daemon?.extensionPoints ?? [];
  const daemonPayload = pkg.deploymentPlan.daemon?.plugin;
  const dependencies = pkg.dependencies;
  return [
    pkg.signature
      ? {
          level: "low",
          title: "Signature",
          details: `Trusted publisher ${pkg.signature.publisher}, key ${pkg.signature.keyId}.`,
        }
      : {
          level: "medium",
          title: "Signature",
          details: "Unsigned package. Trust is based only on the local source.",
        },
    daemonPayload
      ? {
          level: "high",
          title: "Daemon payload",
          details: `${daemonPayload.path} can install startup-loaded C# plugin code and requires daemon restart lifecycle review.`,
        }
      : {
          level: "low",
          title: "Daemon payload",
          details: "No daemon bundle is declared.",
        },
    {
      level: host.some((capability) => capability.startsWith("daemon."))
        ? "medium"
        : "low",
      title: "Host APIs",
      details:
        host.length === 0 ? "No host capability requested." : host.join(", "),
    },
    {
      level: extensionPoints.some((point) => point.kind === "override")
        ? "high"
        : extensionPoints.some((point) => point.target === "daemon")
          ? "medium"
          : "low",
      title: "Extension points",
      details:
        extensionPoints.length === 0
          ? "No daemon extension point declared."
          : extensionPoints
              .map((point) => `${point.kind}:${point.id}`)
              .join(", "),
    },
    {
      level: dependencies.length === 0 ? "low" : "medium",
      title: "Local dependencies",
      details:
        dependencies.length === 0
          ? "No local extension dependency declared."
          : dependencies
              .map((dependency) => `${dependency.id} ${dependency.version}`)
              .join(", "),
    },
  ];
}

function SummaryBlock({
  icon,
  label,
  values,
  empty,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly values: readonly string[];
  readonly empty: string;
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {values.length === 0 ? (
          <span className="text-xs text-muted-foreground">{empty}</span>
        ) : (
          values.slice(0, 8).map((value) => (
            <Badge
              key={value}
              variant="outline"
              className="max-w-full truncate"
            >
              {value}
            </Badge>
          ))
        )}
        {values.length > 8 ? (
          <Badge variant="secondary">+{values.length - 8}</Badge>
        ) : null}
      </div>
    </div>
  );
}

function deploymentStatus(value: unknown): string {
  if (!isRecord(value)) return "Deployment status is unknown.";
  const status = String(value.status ?? "unknown");
  const directory = String(
    value.plugin_directory ?? value.pluginDirectory ?? "plugins/<plugin>",
  );
  const message = typeof value.message === "string" ? value.message : "";
  return `${status} at ${directory}.${message ? ` ${message}` : ""}`;
}

function extractExtensionEnvelope(value: unknown): unknown {
  if (!isRecord(value)) return undefined;
  if (value.protocol === "mcsl.extension.v1") return value;
  return value.envelope;
}

function isPluginExtensionEnvelopeSource(
  envelope: ExtensionProtocolEnvelope,
  sourceEvent: string,
): boolean {
  const plugin = "plugin" in envelope ? envelope.plugin : undefined;
  return (
    typeof plugin === "string" &&
    sourceEvent === `plugin.${plugin}.event.extension`
  );
}

function wrapDaemonEventForEntry(
  entry: ClientExtensionCacheEntry,
  packet: DaemonEventPacket,
): ExtensionProtocolEnvelope | undefined {
  const eventName = toExtensionEventName(packet.event);
  if (eventName === undefined) return undefined;
  if (!(entry.manifest.permissions.events ?? []).includes(eventName)) {
    return undefined;
  }
  const data = toExtensionJsonObject(packet.data ?? {});
  if (data === undefined) return undefined;
  const meta = toExtensionJsonObject(packet.meta ?? undefined);
  return {
    protocol: "mcsl.extension.v1",
    type: "event",
    plugin: entry.id,
    name: eventName,
    version: 1,
    data,
    ...(meta === undefined ? {} : { meta }),
  };
}

function toDaemonEventName(
  entry: ClientExtensionCacheEntry,
  eventName: string,
): string | undefined {
  if (eventName === `plugin.${entry.id}.event.extension`) {
    return eventName;
  }

  switch (eventName) {
    case "daemon.instance.catalog.changed":
      return V2_EVENTS.catalogChanged;
    case "daemon.instance.log":
      return V2_EVENTS.instanceLog;
    case "daemon.report":
      return V2_EVENTS.daemonReport;
    case "daemon.notification":
      return V2_EVENTS.notification;
    default:
      return undefined;
  }
}

function toExtensionEventName(eventName: string): string | undefined {
  switch (eventName) {
    case V2_EVENTS.catalogChanged:
      return "daemon.instance.catalog.changed";
    case V2_EVENTS.instanceLog:
      return "daemon.instance.log";
    case V2_EVENTS.daemonReport:
      return "daemon.report";
    case V2_EVENTS.notification:
      return "daemon.notification";
    default:
      return undefined;
  }
}

function toExtensionJsonObject(
  value: Record<string, unknown> | undefined,
): Record<string, ExtensionJsonValue> | undefined {
  if (value === undefined) return undefined;
  const converted = toExtensionJsonValue(value);
  return isRecord(converted) && !Array.isArray(converted)
    ? (converted as Record<string, ExtensionJsonValue>)
    : undefined;
}

function toExtensionJsonValue(value: unknown): ExtensionJsonValue | undefined {
  if (value === null) return null;
  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    const items: ExtensionJsonValue[] = [];
    for (const item of value) {
      const converted = toExtensionJsonValue(item);
      if (converted === undefined) return undefined;
      items.push(converted);
    }
    return items;
  }
  if (isRecord(value)) {
    const output: Record<string, ExtensionJsonValue> = {};
    for (const [key, item] of Object.entries(value)) {
      const converted = toExtensionJsonValue(item);
      if (converted === undefined) return undefined;
      output[key] = converted;
    }
    return output;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatDiagnostics(
  diagnostics: readonly MpxPackageDiagnostic[],
): string {
  return diagnostics
    .slice(0, 6)
    .map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`)
    .join("\n");
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  const kib = bytes / 1024;
  if (kib < 1024) return `${kib.toFixed(1)} KiB`;
  return `${(kib / 1024).toFixed(1)} MiB`;
}

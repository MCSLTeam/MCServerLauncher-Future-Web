"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  MoreHorizontal,
  Play,
  RefreshCw,
  RotateCw,
  Skull,
  Square,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { ConsolePage } from "@/components/templates/console-surface";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFeedback } from "@/components/ui-feedback";
import { useT } from "@/features/i18n/locale-provider";
import { useDaemon } from "@/features/nodes/daemon-provider";
import {
  loadAutoRefreshPreference,
  normalizeRefreshInterval,
  REFRESH_INTERVAL_OPTIONS,
  saveAutoRefreshPreference,
  type RefreshIntervalSeconds,
} from "@/lib/daemon/system-info";
import { formatInstanceTypeLabel } from "@/features/console/event-types";
import type { DaemonLiveInstance } from "@/lib/daemon/types";
import { listNodes, nodeAddress } from "@/lib/nodes-store";
import type { SavedNode } from "@/lib/types";
import {
  buildInstanceConsoleWindowTitle,
  instanceDetailPath,
  openInstanceConsole,
} from "@/lib/tauri-windows";
import { useIsTauriRuntime } from "@/lib/tauri-runtime";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "running" | "stopped" | "crashed";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(2)} ${units[index]}`;
}

function UsageRow({
  label,
  value,
  text,
}: {
  label: string;
  value: number;
  text: string;
}) {
  const percentage = Math.min(
    100,
    Math.max(0, Number.isFinite(value) ? value : 0),
  );
  return (
    <div className="grid grid-cols-[3.625rem_7.25rem_minmax(0,1fr)] items-center gap-x-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className="truncate text-right tabular-nums text-muted-foreground"
        title={text}
      >
        {text}
      </span>
    </div>
  );
}

function statusColor(status: string) {
  if (status === "running") return "bg-[#107C10]";
  if (status === "crashed") return "bg-[#E81123]";
  return "bg-[#999999]";
}

export default function InstancesPage() {
  const t = useT();
  const { confirm, toast } = useFeedback();
  const isTauri = useIsTauriRuntime();
  const {
    instances,
    connections,
    refreshing,
    refreshInstances,
    startInstance,
    stopInstance,
    killInstance,
    restartInstance,
    removeInstance,
  } = useDaemon();
  const [nodes] = useState<SavedNode[]>(() => listNodes());
  const [selectedNodeId, setSelectedNodeId] = useState(
    () => listNodes()[0]?.id || "",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(
    () => loadAutoRefreshPreference().enabled,
  );
  const [intervalSeconds, setIntervalSeconds] =
    useState<RefreshIntervalSeconds>(() => loadAutoRefreshPreference().seconds);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!autoRefresh || !selectedNodeId) return;
    const timer = window.setInterval(
      () => void refreshInstances(),
      intervalSeconds * 1000,
    );
    return () => window.clearInterval(timer);
  }, [autoRefresh, intervalSeconds, refreshInstances, selectedNodeId]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return instances.filter((instance) => {
      if (instance.nodeId !== selectedNodeId) return false;
      if (statusFilter !== "all" && instance.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      const localizedStatus = t(`shared.instance.status.${instance.status}`);
      return [
        instance.name,
        instance.type,
        formatInstanceTypeLabel(instance.type),
        instance.gameVersion,
        instance.status,
        localizedStatus,
        instance.id,
        instance.nodeName,
        selectedNode ? nodeAddress(selectedNode) : "",
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [instances, search, selectedNode, selectedNodeId, statusFilter, t]);

  function statusLabel(status: string) {
    const key = `shared.instance.status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  }

  async function runAction(
    item: DaemonLiveInstance,
    action: "start" | "stop" | "restart" | "kill" | "remove",
  ) {
    const confirmations: Record<typeof action, string> = {
      start: t("shared.instances.confirm.start", { name: item.name }),
      stop: t("shared.instances.confirm.stop", { name: item.name }),
      restart: t("shared.instances.confirm.restart", { name: item.name }),
      kill: t("shared.instances.confirm.kill", { name: item.name }),
      remove: t("shared.instances.confirm.remove", { name: item.name }),
    };
    const ok = await confirm({
      description: confirmations[action],
      destructive: action === "kill" || action === "remove",
      confirmLabel: t("ui.common.confirm"),
      cancelLabel: t("ui.common.cancel"),
    });
    if (!ok) return;
    setBusy(`${item.nodeId}:${item.id}:${action}`);
    const result =
      action === "start"
        ? await startInstance(item.nodeId, item.id)
        : action === "stop"
          ? await stopInstance(item.nodeId, item.id)
          : action === "restart"
            ? await restartInstance(item.nodeId, item.id)
            : action === "kill"
              ? await killInstance(item.nodeId, item.id)
              : await removeInstance(item.nodeId, item.id);
    setBusy(null);
    if (!result.ok) {
      toast.error(result.message ?? t("shared.instances.action.failed"));
    }
  }

  return (
    <ConsolePage className="gap-0">
      <Reveal>
        <p className="text-sm text-muted-foreground">
          {t("shared.instances.tip")}
        </p>
      </Reveal>

      {nodes.length > 0 ? (
        <Reveal delay={0.02}>
          <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2">
            <Select value={selectedNodeId} onValueChange={setSelectedNodeId}>
              <SelectTrigger className="h-8 min-w-[4.375rem] max-w-[9.375rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {nodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.name} [{nodeAddress(node)}]
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="h-8 w-[7.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("shared.instances.status.all")}
                </SelectItem>
                <SelectItem value="running">
                  {statusLabel("running")}
                </SelectItem>
                <SelectItem value="stopped">
                  {statusLabel("stopped")}
                </SelectItem>
                <SelectItem value="crashed">
                  {statusLabel("crashed")}
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex h-8 min-w-24 items-center gap-2">
              <Switch
                id="instances-auto-refresh"
                checked={autoRefresh}
                onCheckedChange={(enabled) => {
                  setAutoRefresh(enabled);
                  saveAutoRefreshPreference(enabled, intervalSeconds);
                }}
              />
              <label
                htmlFor="instances-auto-refresh"
                className="whitespace-nowrap text-sm"
              >
                {autoRefresh
                  ? t("shared.nodes.auto-refresh.on")
                  : t("shared.nodes.auto-refresh.off")}
              </label>
            </div>

            <Select
              value={String(intervalSeconds)}
              onValueChange={(value) => {
                const seconds = normalizeRefreshInterval(Number(value));
                setIntervalSeconds(seconds);
                saveAutoRefreshPreference(autoRefresh, seconds);
              }}
            >
              <SelectTrigger className="h-8 w-[5.625rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_INTERVAL_OPTIONS.map((seconds) => (
                  <SelectItem key={seconds} value={String(seconds)}>
                    {seconds === 60
                      ? t("shared.instances.interval.minute")
                      : t("shared.nodes.auto-refresh.interval", {
                          sec: seconds,
                        })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("shared.nodes.search.placeholder")}
              className="h-8 w-[13.75rem] min-w-[7.5rem] max-w-[25rem]"
            />
            <Button
              type="button"
              variant="outline"
              className="h-8"
              disabled={refreshing}
              onClick={() => void refreshInstances()}
            >
              <RefreshCw
                className={cn("size-4", refreshing && "animate-spin")}
              />
              {t("shared.nodes.refresh")}
            </Button>
          </div>
        </Reveal>
      ) : null}

      <Reveal delay={0.04}>
        <div className="relative mt-3.5 min-h-52">
          {nodes.length === 0 ? (
            <Empty className="border-0 bg-transparent shadow-none">
              <EmptyHeader>
                <EmptyTitle>{t("shared.instances.disabled.title")}</EmptyTitle>
                <EmptyDescription>
                  {t("shared.instances.disabled.description")}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/nodes/">
                    {t("shared.instances.connect-daemon")}
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : filtered.length === 0 && !search && statusFilter === "all" ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t("shared.instances.empty.title")}</EmptyTitle>
                <EmptyDescription>
                  {t("shared.instances.empty.description")}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/create/">{t("shared.create.button")}</Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="flex flex-wrap gap-2 pb-4">
              {filtered.map((item) => {
                const cpu = Math.min(100, Math.max(0, Number(item.cpu ?? 0)));
                const memoryBytes = Number(item.memory ?? 0);
                const totalMemoryBytes =
                  Number(
                    connections[item.nodeId]?.systemInfo?.mem?.total ?? 0,
                  ) * 1024;
                const memoryPercentage =
                  totalMemoryBytes > 0
                    ? Math.min(100, (memoryBytes / totalMemoryBytes) * 100)
                    : 0;
                const memoryText =
                  totalMemoryBytes > 0
                    ? `${memoryPercentage.toFixed(2)}% (${formatBytes(memoryBytes)} / ${formatBytes(totalMemoryBytes)})`
                    : formatBytes(memoryBytes);
                const canStart =
                  item.status === "stopped" || item.status === "crashed";
                const running = item.status === "running";

                return (
                  <article
                    key={`${item.nodeId}:${item.id}`}
                    className="flex h-[13.75rem] min-w-[min(100%,22.5rem)] flex-1 basis-[22.5rem] flex-col rounded-xl border bg-card shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 px-5 pt-3.5">
                      <h3 className="truncate text-base font-semibold">
                        {item.name}
                      </h3>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold text-white",
                          statusColor(item.status),
                        )}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 px-5 text-sm">
                      <span className="text-muted-foreground">
                        {t("shared.instances.type-label")}
                      </span>
                      <span title={item.type}>
                        {formatInstanceTypeLabel(item.type)}
                      </span>
                      <span className="text-muted-foreground">
                        {t("shared.instances.version-label")}
                      </span>
                      <span>{item.gameVersion ?? ""}</span>
                    </div>

                    <div className="mt-2 space-y-1.5 px-5">
                      <UsageRow
                        label="CPU"
                        value={cpu}
                        text={`${cpu.toFixed(2)}%`}
                      />
                      <UsageRow
                        label={t("shared.nodes.resource.memory")}
                        value={memoryPercentage}
                        text={memoryText}
                      />
                    </div>

                    <div className="mt-auto flex justify-end gap-2 px-5 pb-5 pt-2.5">
                      <Button
                        size="sm"
                        type="button"
                        onClick={() => {
                          void (async () => {
                            if (isTauri) {
                              try {
                                const result = await openInstanceConsole({
                                  instanceId: item.id,
                                  nodeId: item.nodeId,
                                  title: buildInstanceConsoleWindowTitle(
                                    t,
                                    item.name,
                                    item.nodeName ||
                                      selectedNode?.name ||
                                      item.nodeId,
                                  ),
                                });
                                if (result.openedAsWindow) return;
                              } catch {
                                // fall through to in-app route
                              }
                            }
                            window.location.href = instanceDetailPath(
                              item.id,
                              item.nodeId,
                            );
                          })();
                        }}
                      >
                        <Eye className="size-4" />
                        {t("shared.instances.open")}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" size="sm" variant="outline">
                            <MoreHorizontal className="size-4" />
                            {t("ui.common.more")}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={!canStart || busy !== null}
                            onClick={() => void runAction(item, "start")}
                          >
                            <Play className="size-4" />
                            {t("shared.instance.action.start")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!running || busy !== null}
                            onClick={() => void runAction(item, "stop")}
                          >
                            <Square className="size-4" />
                            {t("shared.instance.action.stop")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!running || busy !== null}
                            onClick={() => void runAction(item, "restart")}
                          >
                            <RotateCw className="size-4" />
                            {t("shared.instance.action.restart")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={!running || busy !== null}
                            variant="destructive"
                            onClick={() => void runAction(item, "kill")}
                          >
                            <Skull className="size-4" />
                            {t("shared.instance.action.kill")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={busy !== null}
                            variant="destructive"
                            onClick={() => void runAction(item, "remove")}
                          >
                            <Trash2 className="size-4" />
                            {t("ui.common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>
    </ConsolePage>
  );
}

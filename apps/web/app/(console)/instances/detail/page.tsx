"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import {
  ConsolePage,
  ConsolePanel,
  ConsolePanelHeader,
} from "@/components/templates/console-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/locale-provider";
import { useDaemon } from "@/features/nodes/daemon-provider";
import { cn } from "@/lib/utils";

/** 对齐 WPF InstanceConsole 顶栏：看板 / 终端 / 文件 / 事件 / 组件 / 设置 */
type ConsoleTab =
  | "board"
  | "command"
  | "files"
  | "events"
  | "components"
  | "settings";

const CONSOLE_TABS: { key: ConsoleTab; labelKey: string }[] = [
  { key: "board", labelKey: "shared.instance.detail.overview" },
  { key: "command", labelKey: "shared.instance.detail.console" },
  { key: "files", labelKey: "shared.instance.detail.files" },
  { key: "events", labelKey: "shared.instance.detail.automation" },
  { key: "components", labelKey: "shared.instance.detail.components" },
  { key: "settings", labelKey: "shared.instance.detail.settings" },
];

function InstanceDetailInner() {
  const t = useT();
  const search = useSearchParams();
  const id = search.get("id")?.trim() || "";
  const nodeId = search.get("node")?.trim() || "";
  const {
    instances,
    getStatus,
    startInstance,
    stopInstance,
    killInstance,
    sendCommand,
    getLogs,
    refreshInstances,
  } = useDaemon();

  const [tab, setTab] = useState<ConsoleTab>("board");
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const instance = useMemo(
    () =>
      instances.find(
        (item) => item.id === id && (!nodeId || item.nodeId === nodeId),
      ) ?? instances.find((item) => item.id === id),
    [instances, id, nodeId],
  );

  const resolvedNodeId = instance?.nodeId ?? nodeId;
  const nodeOnline =
    resolvedNodeId !== "" && getStatus(resolvedNodeId) === "online";
  const canOperate = Boolean(instance && resolvedNodeId && nodeOnline);

  const statusLabel = (status: string) => {
    const key = `shared.instance.status.${status}`;
    const value = t(key);
    return value === key ? status : value;
  };

  const loadLogs = useCallback(async () => {
    if (!resolvedNodeId || !id) return;
    const result = await getLogs(resolvedNodeId, id);
    if (result.ok) {
      setLogs(result.logs ?? []);
      setMessage(null);
    } else {
      setMessage(
        result.message ?? t("shared.instance.console.need-connection"),
      );
    }
  }, [getLogs, id, resolvedNodeId, t]);

  useEffect(() => {
    if (tab === "command" && canOperate) {
      void loadLogs();
    }
  }, [tab, canOperate, loadLogs]);

  async function runAction(action: "start" | "stop" | "kill") {
    if (!resolvedNodeId || !id) return;
    setBusy(true);
    setMessage(null);
    const result =
      action === "start"
        ? await startInstance(resolvedNodeId, id)
        : action === "stop"
          ? await stopInstance(resolvedNodeId, id)
          : await killInstance(resolvedNodeId, id);
    setBusy(false);
    setMessage(
      result.ok
        ? t("ui.common.done")
        : (result.message ?? t("shared.instance.console.need-connection")),
    );
    await refreshInstances();
    if (tab === "command") void loadLogs();
  }

  async function onSend() {
    if (!resolvedNodeId || !id || !command.trim()) return;
    setBusy(true);
    const result = await sendCommand(resolvedNodeId, id, command.trim());
    setBusy(false);
    if (result.ok) {
      setCommand("");
      setMessage(t("ui.common.done"));
      await loadLogs();
    } else {
      setMessage(
        result.message ?? t("shared.instance.console.need-connection"),
      );
    }
  }

  if (!id) {
    return (
      <ConsolePage>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t("shared.instances.empty.no-data.title")}</EmptyTitle>
            <EmptyDescription>
              {t("shared.instance.console.need-connection")}
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href="/instances/">{t("ui.common.close")}</Link>
          </Button>
        </Empty>
      </ConsolePage>
    );
  }

  const tabLabel = (key: string) => {
    const value = t(key);
    return value === key ? (key.split(".").pop() ?? key) : value;
  };

  return (
    <ConsolePage className="gap-0">
      {/* 对齐 InstanceConsole 窗口标题区 */}
      <Reveal>
        <div className="mb-3 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {t("shared.instance.console.title")}
            </p>
            <h2 className="truncate text-xl font-semibold tracking-tight">
              {instance?.name ?? id}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {instance
                ? `${instance.nodeName} · ${instance.type}${
                    instance.gameVersion ? ` · ${instance.gameVersion}` : ""
                  }`
                : id}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={nodeOnline ? "default" : "secondary"}>
              {statusLabel(instance?.status ?? "stopped")}
            </Badge>
            <Button
              type="button"
              size="sm"
              disabled={!canOperate || busy}
              onClick={() => void runAction("start")}
            >
              {t("shared.instance.action.start")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canOperate || busy}
              onClick={() => void runAction("stop")}
            >
              {t("shared.instance.action.stop")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={!canOperate || busy}
              onClick={() => void runAction("kill")}
            >
              {t("shared.instance.action.kill")}
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/instances/">{t("ui.common.close")}</Link>
            </Button>
          </div>
        </div>
      </Reveal>

      {/* 顶栏二级导航：对齐 WPF PaneDisplayMode=Top */}
      <Reveal delay={0.03}>
        <nav
          className="mcsl-scrollbar mb-4 flex gap-1 overflow-x-auto border-b pb-px"
          aria-label="instance-console"
        >
          {CONSOLE_TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "shrink-0 rounded-t-xl px-3 py-2 text-sm transition-colors",
                tab === item.key
                  ? "border-b-2 border-primary font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tabLabel(item.labelKey)}
            </button>
          ))}
        </nav>
      </Reveal>

      {message ? (
        <p className="mb-3 text-sm text-muted-foreground">{message}</p>
      ) : null}

      {tab === "board" ? (
        <Reveal delay={0.04}>
          <div className="grid gap-4 md:grid-cols-2">
            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.instance.detail.overview")}
              />
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">
                  {t("shared.instances.table.name")}
                </dt>
                <dd>{instance?.name ?? id}</dd>
                <dt className="text-muted-foreground">
                  {t("shared.instances.table.status")}
                </dt>
                <dd>{statusLabel(instance?.status ?? "stopped")}</dd>
                <dt className="text-muted-foreground">
                  {t("shared.instances.table.type")}
                </dt>
                <dd>{instance?.type ?? "—"}</dd>
                <dt className="text-muted-foreground">
                  {t("shared.instances.table.version")}
                </dt>
                <dd>{instance?.gameVersion || "—"}</dd>
                <dt className="text-muted-foreground">
                  {t("shared.nodes.title")}
                </dt>
                <dd>
                  {instance?.nodeName ?? "—"}
                  {nodeOnline ? " · online" : " · offline"}
                </dd>
              </dl>
            </ConsolePanel>
            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.instance.detail.connected")}
              />
              <p className="text-sm text-muted-foreground">
                {canOperate
                  ? t("shared.instance.detail.connected")
                  : t("shared.instance.console.need-connection")}
              </p>
            </ConsolePanel>
          </div>
        </Reveal>
      ) : null}

      {tab === "command" ? (
        <Reveal delay={0.04}>
          <ConsolePanel className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <ConsolePanelHeader title={t("shared.instance.detail.console")} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canOperate || busy}
                onClick={() => void loadLogs()}
              >
                {t("shared.instances.refresh")}
              </Button>
            </div>
            <pre className="mcsl-scrollbar max-h-[min(28rem,50vh)] overflow-auto rounded-xl bg-muted/40 p-3 font-mono text-xs leading-relaxed">
              {logs.length > 0
                ? logs.join("\n")
                : t("shared.instance.console.empty")}
            </pre>
            <div className="flex gap-2">
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder={t("shared.instance.console.placeholder")}
                disabled={!canOperate || busy}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onSend();
                }}
              />
              <Button
                type="button"
                disabled={!canOperate || busy || !command.trim()}
                onClick={() => void onSend()}
              >
                {t("shared.instance.console.send")}
              </Button>
            </div>
          </ConsolePanel>
        </Reveal>
      ) : null}

      {tab === "files" ||
      tab === "events" ||
      tab === "components" ||
      tab === "settings" ? (
        <Reveal delay={0.04}>
          <ConsolePanel>
            <ConsolePanelHeader
              title={tabLabel(
                CONSOLE_TABS.find((x) => x.key === tab)?.labelKey ?? "",
              )}
            />
            <p className="text-sm text-muted-foreground">
              {t("shared.instance.detail.placeholder")}
            </p>
          </ConsolePanel>
        </Reveal>
      ) : null}
    </ConsolePage>
  );
}

export default function InstanceDetailPage() {
  return (
    <Suspense
      fallback={
        <ConsolePage>
          <p className="text-sm text-muted-foreground">…</p>
        </ConsolePage>
      }
    >
      <InstanceDetailInner />
    </Suspense>
  );
}

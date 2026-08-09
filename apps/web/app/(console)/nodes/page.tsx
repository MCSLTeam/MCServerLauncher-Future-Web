"use client";

/**
 * 远程主机页 — 布局与交互对齐 WPF DaemonManagerPage + NewDaemonConnectionInput。
 * 卡片上只有「更多 → 编辑 / 删除」；新建/编辑走对话框，不在侧栏常驻表单。
 */
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Unplug,
} from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { ConsolePage } from "@/components/templates/console-surface";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  buildResourceView,
  loadAutoRefreshPreference,
  normalizeRefreshInterval,
  REFRESH_INTERVAL_OPTIONS,
  saveAutoRefreshPreference,
  type RefreshIntervalSeconds,
} from "@/lib/daemon/system-info";
import { useAuth } from "@/features/auth/auth-provider";
import {
  addNode,
  getNodeTokenAsync,
  hydrateNodes,
  listNodes,
  nodeAddress,
  removeNode,
  updateNode,
  type NodeInput,
  type NodeVisibilityMode,
} from "@/lib/nodes-store";
import { canManageNodes } from "@/lib/permission";
import { useIsTauriRuntime } from "@/lib/tauri-runtime";
import type { NodeStatus, SavedNode } from "@/lib/types";
import { cn } from "@/lib/utils";

const emptyForm: NodeInput = {
  name: "",
  host: "",
  // 默认指向 MCSL Future Daemon（Web API 自己是 11451）
  port: "11452",
  secure: false,
  token: "",
  visibility: "all",
  visibleTo: [],
};

/** OS 图标：对齐 WPF Windows/Darwin/Linux DrawingImage */
function OsGlyph({ type }: { type: string | null }) {
  if (type === "Windows") {
    return (
      <svg
        aria-label="Windows"
        className="size-5 shrink-0"
        viewBox="0 0 1024 1024"
        role="img"
      >
        <path
          fill="#0078D4"
          d="M0 0h485.42v485.21H0zM538.58 0H1024v485.21H538.58zM0 538.58h485.42V1024H0zM538.58 538.58H1024V1024H538.58z"
        />
      </svg>
    );
  }
  if (type === "Darwin") {
    return (
      <svg
        aria-label="macOS"
        className="size-5 shrink-0"
        viewBox="0 0 1024 1024"
        role="img"
      >
        <rect
          x="37"
          y="39"
          width="949"
          height="948"
          rx="237"
          fill="currentColor"
        />
        <path
          fill="var(--background)"
          d="M427.5 809.1c37-1.5 50.9-24.3 95.5-24.3 44.7 0 57.2 24.3 96.2 23.6 39.6-.8 64.8-36.7 89.1-72.8 28.1-41.8 39.6-82.2 40.3-84.2-.9-.4-77.4-30.2-78.2-119.8-.7-75 60.2-111 62.9-112.8-34.2-50.9-87.6-57.9-106.6-58.7-45.4-4.7-88.5 27.1-111.5 27.1-23 0-58.5-26.5-96.1-25.8-49.4.8-95 29.3-120.5 74.3-51.4 90.6-13.1 224.9 36.9 298.5 24.5 36 53.6 76.4 91.9 74.9zm114.1-547.5c-18.8 22.2-35.3 57.6-30.9 91.7 32.7 2.6 66-16.9 86.4-41.9 20.3-25.1 34-59.9 30.3-94.5-29.3 1.2-64.8 19.8-85.8 44.7z"
        />
      </svg>
    );
  }
  if (type === "Linux") {
    return (
      <svg
        aria-label="Linux"
        className="size-5 shrink-0"
        viewBox="0 0 1024 1024"
        role="img"
      >
        <path
          fill="#020204"
          d="M512 8c-95 0-145 91-145 205 0 64 4 91 0 132-20 32-61 74-79 119-24 59-31 123-27 188-38 34-79 72-79 111 0 52 68 65 119 80 31 10 55 45 101 45 42 0 69-27 110-27 42 0 69 27 111 27 46 0 70-35 101-45 51-15 119-28 119-80 0-39-41-77-79-111 4-65-3-129-27-188-18-45-59-87-79-119-4-41 0-68 0-132C657 99 607 8 512 8z"
        />
        <ellipse cx="512" cy="180" rx="55" ry="43" fill="#fff" />
        <path
          fill="#f5bd0c"
          d="M390 298c42-33 91-42 142-32 40 8 72 27 66 50-8 29-63 61-101 61-42 0-86-30-107-57z"
        />
        <circle cx="487" cy="210" r="14" fill="#020204" />
        <circle cx="537" cy="210" r="14" fill="#020204" />
        <path fill="#d99a03" d="M487 235h50l-25 23z" />
      </svg>
    );
  }
  return (
    <span
      aria-label="Unknown operating system"
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
    >
      ?
    </span>
  );
}

function ResourceRow({
  label,
  value,
  text,
  title,
}: {
  label: string;
  value: number;
  text: string;
  title?: string;
}) {
  return (
    <div className="grid grid-cols-[3.6rem_7.25rem_minmax(0,1fr)] items-center gap-x-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span
        className="truncate text-right tabular-nums text-muted-foreground"
        title={title ?? text}
      >
        {text}
      </span>
    </div>
  );
}

export default function NodesPage() {
  const t = useT();
  const { toast } = useFeedback();
  const {
    connections,
    getStatus,
    connectNode,
    disconnectNode,
    refreshDaemons,
    testNode,
    refreshing,
  } = useDaemon();
  const { user } = useAuth();
  const isTauri = useIsTauriRuntime();
  const manageNodes = isTauri || canManageNodes(user?.permissions);

  const [nodes, setNodes] = useState<SavedNode[]>([]);
  const [searchText, setSearchText] = useState("");
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [refreshInterval, setRefreshInterval] =
    useState<RefreshIntervalSeconds>(30);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NodeInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  async function refreshList() {
    await hydrateNodes();
    setNodes(listNodes());
  }

  useEffect(() => {
    void refreshList().then(() => {
      const pref = loadAutoRefreshPreference();
      setAutoRefreshEnabled(pref.enabled);
      setRefreshInterval(pref.seconds);
    });
  }, []);

  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const timer = window.setInterval(() => {
      void refreshDaemons();
    }, refreshInterval * 1000);
    return () => window.clearInterval(timer);
  }, [autoRefreshEnabled, refreshInterval, refreshDaemons]);

  const resourceLabels = useMemo(
    () => ({
      notLoaded: t("shared.nodes.resource.not-loaded"),
      loadFailed: t("shared.nodes.resource.load-failed"),
      cpu: t("shared.nodes.resource.cpu"),
      memory: t("shared.nodes.resource.memory"),
      drive: t("shared.nodes.resource.drive"),
    }),
    [t],
  );

  const filteredNodes = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return nodes;
    return nodes.filter((node) => {
      const status = getStatus(node.id);
      const detail = connections[node.id];
      const resource = buildResourceView(
        detail?.systemInfo,
        resourceLabels,
        detail?.error ?? "",
      );
      const haystack = [
        node.name,
        node.host,
        node.port,
        nodeAddress(node),
        status,
        resource.systemType,
        resource.systemVersion,
        resource.daemonVersion,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [nodes, searchText, getStatus, connections, resourceLabels]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setFormOpen(true);
  }

  async function startEdit(node: SavedNode) {
    setEditingId(node.id);
    const token = (await getNodeTokenAsync(node.id)) ?? "";
    setForm({
      name: node.name,
      host: node.host,
      port: node.port,
      secure: node.secure,
      token,
      visibility: node.visibility ?? "all",
      visibleTo: node.visibleTo ?? [],
    });
    setError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setSubmitting(false);
  }

  /** 对齐 WPF 连接状态文案：正常 / 异常 / 连接中 */
  function connectionStatusUi(status: NodeStatus, hasError: boolean) {
    if (status === "online") {
      return {
        label: t("shared.nodes.status.ok"),
        icon: CheckCircle2,
        className: "text-emerald-600 dark:text-emerald-400",
        clickable: false,
      };
    }
    if (status === "connecting" || status === "reconnecting") {
      return {
        label: t("shared.nodes.status.connecting"),
        icon: Loader2,
        className: "text-muted-foreground",
        clickable: false,
        spin: true,
      };
    }
    if (hasError) {
      return {
        label: t("shared.nodes.status.error"),
        icon: CircleAlert,
        className: "text-destructive",
        clickable: true,
      };
    }
    return {
      label: t("shared.nodes.status.connecting"),
      icon: Unplug,
      className: "text-muted-foreground",
      clickable: false,
    };
  }

  /**
   * 对齐 WPF TryConnectNewDaemonAsync / EditDaemon：
   * 先真实连接成功再落盘；失败不保留新配置。
   */
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const host = form.host.trim();
    const port = form.port.trim();
    const token =
      form.token?.trim() ||
      (editingId ? ((await getNodeTokenAsync(editingId)) ?? "") : "");
    if (!host || !port || Number.isNaN(Number(port)) || !token) {
      setError(t("ui.form.invalid.require"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (editingId) {
        disconnectNode(editingId);
        const probe = await testNode({
          host,
          port,
          secure: form.secure,
          token,
        });
        if (!probe.ok) {
          setError(probe.message ?? t("shared.nodes.connect.failed"));
          await connectNode(editingId);
          return;
        }
        const updated = await updateNode(editingId, {
          ...form,
          host,
          port,
          name: form.name.trim(),
          token,
        });
        if (!updated) {
          setError(t("shared.nodes.connect.failed"));
          return;
        }
        await refreshList();
        const result = await connectNode(editingId, { force: true });
        if (!result.ok) {
          setError(result.message ?? t("shared.nodes.connect.failed"));
          return;
        }
        closeForm();
        return;
      }

      const probe = await testNode({
        host,
        port,
        secure: form.secure,
        token,
      });
      if (!probe.ok) {
        setError(probe.message ?? t("shared.nodes.connect.failed"));
        return;
      }

      const node = await addNode({
        ...form,
        host,
        port,
        name: form.name.trim() || t("shared.nodes.title"),
        token,
      });
      if (!node) {
        setError(t("shared.nodes.connect.failed"));
        return;
      }
      await refreshList();
      const result = await connectNode(node.id, { force: true });
      if (!result.ok) {
        disconnectNode(node.id);
        await removeNode(node.id);
        await refreshList();
        setError(result.message ?? t("shared.nodes.connect.failed"));
        return;
      }
      closeForm();
    } finally {
      setSubmitting(false);
      await refreshList();
    }
  }

  function requestDelete(id: string, name: string) {
    setDeleteTarget({
      id,
      name: name.trim() || t("shared.nodes.title"),
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    try {
      disconnectNode(id, { purge: true });
      const ok = await removeNode(id);
      if (!ok) {
        toast.error(t("shared.nodes.connect.failed"));
        return;
      }
      if (editingId === id) closeForm();
      setDeleteTarget(null);
      await refreshList();
      toast.success(
        t("shared.nodes.delete.success", {
          name: name || t("shared.nodes.title"),
        }),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("shared.nodes.connect.failed"),
      );
    }
  }

  return (
    <ConsolePage className="gap-3">
      {/* tip 保留；章节标题由 topbar 提供 */}
      <Reveal>
        <p className="text-sm text-muted-foreground">{t("shared.nodes.tip")}</p>
      </Reveal>

      {/* 工具栏：右对齐 — 自动刷新 / 间隔 / 搜索 / 刷新 / 新建连接 */}
      <Reveal delay={0.02}>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
          <div className="flex items-center gap-2">
            <Switch
              id="daemon-auto-refresh"
              checked={autoRefreshEnabled}
              onCheckedChange={(enabled) => {
                setAutoRefreshEnabled(enabled);
                saveAutoRefreshPreference(enabled, refreshInterval);
              }}
            />
            <Label
              htmlFor="daemon-auto-refresh"
              className="cursor-pointer text-sm font-normal whitespace-nowrap"
            >
              {autoRefreshEnabled
                ? t("shared.nodes.auto-refresh.on")
                : t("shared.nodes.auto-refresh.off")}
            </Label>
          </div>

          <Select
            value={String(refreshInterval)}
            onValueChange={(v) => {
              const seconds = normalizeRefreshInterval(Number(v));
              setRefreshInterval(seconds);
              saveAutoRefreshPreference(autoRefreshEnabled, seconds);
            }}
            disabled={!autoRefreshEnabled}
          >
            <SelectTrigger className="h-9 w-[5.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REFRESH_INTERVAL_OPTIONS.map((sec) => (
                <SelectItem key={sec} value={String(sec)}>
                  {sec}s
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t("shared.nodes.search.placeholder")}
            className="h-9 w-[13.75rem] max-w-full"
          />

          <Button
            type="button"
            variant="outline"
            className="h-9"
            disabled={refreshing}
            onClick={() => void refreshDaemons()}
          >
            <RefreshCw
              className={cn("size-4", refreshing && "animate-spin")}
              aria-hidden
            />
            {t("shared.nodes.refresh")}
          </Button>

          <Button
            type="button"
            className="h-9"
            onClick={openAdd}
            disabled={!manageNodes}
          >
            <Plus className="size-4" aria-hidden />
            {t("shared.nodes.connect.new")}
          </Button>
        </div>
      </Reveal>

      {/* 卡片网格：对齐 WrapPanel MinWidth=390 */}
      <Reveal delay={0.04}>
        {filteredNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-base font-medium tracking-tight">
              {nodes.length === 0
                ? t("shared.nodes.list.empty.title")
                : t("shared.nodes.search.empty.title")}
            </p>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              {nodes.length === 0
                ? t("shared.nodes.list.empty.desc")
                : t("shared.nodes.search.empty.desc")}
            </p>
            {nodes.length === 0 ? (
              <Button
                type="button"
                className="mt-1"
                onClick={openAdd}
                disabled={!manageNodes}
              >
                <Plus className="size-4" aria-hidden />
                {t("shared.nodes.connect.new")}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredNodes.map((node) => {
              const status = getStatus(node.id);
              const detail = connections[node.id];
              const resource = buildResourceView(
                detail?.systemInfo,
                resourceLabels,
                detail?.error ?? "",
              );
              const displayName = node.name.trim() || t("shared.nodes.title");
              const statusUi = connectionStatusUi(
                status,
                Boolean(detail?.error),
              );
              const StatusIcon = statusUi.icon;

              return (
                <article
                  key={node.id}
                  className="flex min-h-[13.5rem] min-w-[min(100%,24.375rem)] flex-1 basis-[24.375rem] flex-col rounded-xl border bg-card px-4 py-3.5 shadow-sm"
                >
                  {/* 行0：OS + 友好名 */}
                  <div className="mb-1 flex items-center gap-2.5">
                    <OsGlyph type={resource.systemType} />
                    <h3 className="truncate text-[1.05rem] font-semibold leading-tight">
                      {displayName}
                    </h3>
                  </div>

                  {/* 行1：远端地址 / 链接状态 / 操作系统 / 节点版本 */}
                  <div className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
                    <span className="text-muted-foreground">
                      {t("shared.nodes.card.uri")}
                    </span>
                    <span className="truncate" title={nodeAddress(node)}>
                      {nodeAddress(node)}
                    </span>

                    <span className="text-muted-foreground">
                      {t("shared.nodes.card.status")}
                    </span>
                    <button
                      type="button"
                      disabled={!statusUi.clickable}
                      className={cn(
                        "inline-flex items-center gap-1.5 text-left",
                        statusUi.className,
                        statusUi.clickable && "hover:underline",
                      )}
                      title={detail?.error ?? undefined}
                      onClick={() => {
                        if (detail?.error) toast.error(detail.error);
                      }}
                    >
                      <StatusIcon
                        className={cn(
                          "size-3.5 shrink-0",
                          "spin" in statusUi && statusUi.spin && "animate-spin",
                        )}
                        aria-hidden
                      />
                      {statusUi.label}
                    </button>

                    <span className="text-muted-foreground">
                      {t("shared.nodes.card.system")}
                    </span>
                    <span className="truncate" title={resource.systemVersion}>
                      {resource.systemVersion}
                    </span>

                    <span className="text-muted-foreground">
                      {t("shared.nodes.card.daemon")}
                    </span>
                    <span className="truncate" title={resource.daemonVersion}>
                      {resource.daemonVersion}
                    </span>
                  </div>

                  {/* 行2：CPU / 内存 / 磁盘 — 对齐 ProgressBar 布局 */}
                  <div className="mt-3 space-y-1.5">
                    <ResourceRow
                      label={t("shared.nodes.resource.cpu")}
                      value={resource.cpuUsage}
                      text={resource.cpuUsageText}
                    />
                    <ResourceRow
                      label={t("shared.nodes.resource.memory")}
                      value={resource.memoryUsage}
                      text={resource.memoryUsageText}
                    />
                    <ResourceRow
                      label={t("shared.nodes.resource.drive")}
                      value={resource.driveUsage}
                      text={resource.driveUsageText}
                      title={resource.driveUsageTooltip}
                    />
                  </div>

                  {/* 行3：仅「更多」下拉 — 编辑 / 删除（WPF 无卡片连接/断开按钮） */}
                  <div className="mt-auto flex justify-end pt-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <MoreHorizontal className="size-4" aria-hidden />
                          {t("ui.common.more")}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(node)}>
                          <Pencil className="size-4" aria-hidden />
                          {t("ui.common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => requestDelete(node.id, displayName)}
                        >
                          <Trash2 className="size-4" aria-hidden />
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
      </Reveal>

      {/* 新建/编辑连接对话框 — 对齐 NewDaemonConnectionInput ContentDialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("ui.common.delete")}</DialogTitle>
            <DialogDescription>
              {t("shared.nodes.delete.confirm", {
                name: deleteTarget?.name || t("shared.nodes.title"),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              {t("ui.common.cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              <Trash2 className="size-4" aria-hidden />
              {t("ui.common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open && !submitting) closeForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t("shared.nodes.form.edit")
                : t("shared.nodes.connect.new")}
            </DialogTitle>
            <DialogDescription>{t("shared.nodes.form.desc")}</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            {/* URL 行：ws/wss + host + : + port */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">URL</Label>
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto_5rem] items-center gap-1.5">
                <Select
                  value={form.secure ? "wss" : "ws"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, secure: v === "wss" }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ws">ws://</SelectItem>
                    <SelectItem value="wss">wss://</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="h-9"
                  placeholder={t("shared.nodes.connect.host.placeholder")}
                  value={form.host}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, host: e.target.value }))
                  }
                  autoComplete="off"
                />
                <span className="px-0.5 text-muted-foreground">:</span>
                <Input
                  className="h-9"
                  placeholder={t("shared.nodes.connect.port.label")}
                  value={form.port}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, port: e.target.value }))
                  }
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("shared.nodes.token.label")}
              </Label>
              <Input
                className="h-9"
                type="password"
                placeholder={t("shared.nodes.token.label")}
                value={form.token ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, token: e.target.value }))
                }
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("shared.nodes.connect.name.label")}
              </Label>
              <Input
                className="h-9"
                placeholder={t("shared.nodes.connect.name.label")}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                autoComplete="off"
              />
            </div>

            {manageNodes ? (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("shared.nodes.visibility.label")}
                </Label>
                <Select
                  value={form.visibility ?? "all"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      visibility: v as NodeVisibilityMode,
                    }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("shared.nodes.visibility.all")}
                    </SelectItem>
                    <SelectItem value="selected">
                      {t("shared.nodes.visibility.selected")}
                    </SelectItem>
                    <SelectItem value="admins">
                      {t("shared.nodes.visibility.admins")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {form.visibility === "selected" ? (
                  <Input
                    className="h-9"
                    placeholder={t(
                      "shared.nodes.visibility.usernames-placeholder",
                    )}
                    value={(form.visibleTo ?? []).join(",")}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        visibleTo: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                    }
                    autoComplete="off"
                  />
                ) : null}
              </div>
            ) : null}

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={closeForm}
              >
                {t("ui.common.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {t("shared.nodes.status.connecting")}
                  </>
                ) : editingId ? (
                  t("ui.common.edit")
                ) : (
                  t("shared.nodes.connect.new")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ConsolePage>
  );
}

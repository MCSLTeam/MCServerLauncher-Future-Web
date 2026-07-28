"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  HardDrive,
  Package,
} from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import {
  ConsolePage,
  ConsolePanel,
  ConsolePanelHeader,
} from "@/components/templates/console-surface";
import { Badge } from "@/components/ui/badge";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useFeedback } from "@/components/ui-feedback";
import {
  CommandPanel,
  type ConsoleViewMode,
} from "@/features/console/components/command-panel";
import type { PtyTerminalHandle } from "@/features/console/components/pty-terminal";
import {
  ComponentManagerPanel,
  type ComponentEntry,
} from "@/features/console/components/component-manager-panel";
import { EventTriggerPanel } from "@/features/console/components/event-trigger-panel";
import { isLikelyTextFile } from "@/features/console/components/file-editor-workspace";
import {
  FileManagerPanel,
  type DirEntry,
} from "@/features/console/components/file-manager-panel";
import { InstanceSettingsPanel } from "@/features/console/components/instance-settings-panel";
import { JvmArgHelperDialog } from "@/features/create/components/jvm-arg-helper-dialog";
import {
  cloneRule,
  createEmptyRule,
  normalizeEventRules,
  formatInstanceTypeLabel,
  isJavaRuntimeType,
  normalizeInstanceType,
  toWireRules,
  type EventRule,
} from "@/features/console/event-types";
import {
  appendLogLines,
  parseDaemonTimestamp,
  playerDisplayName,
} from "@/features/console/log-utils";
import {
  getRealPath,
  isMinecraftBoardType,
  joinVirtualPath,
  normalizeVirtualPath,
  parentVirtualPath,
} from "@/features/console/virtual-path";
import { useLocale, useT } from "@/features/i18n/locale-provider";
import { useDaemon } from "@/features/nodes/daemon-provider";
import type { JavaInfo } from "@/lib/create/types";
import { tryValidateJavaPath } from "@/lib/create/validation";
import { isInstanceProcessUp } from "@/lib/daemon/types";
import {
  buildInstanceConsoleWindowTitle,
  openFileEditorWindow,
} from "@/lib/tauri-windows";
import { cn } from "@/lib/utils";

/** 对齐 WPF InstanceConsole 顶栏：看板 / 终端 / 文件 / 事件 / 组件 / 设置 */
type ConsoleTab =
  | "board"
  | "command"
  | "files"
  | "events"
  | "components"
  | "settings";

type LifecycleAction = "start" | "stop" | "restart" | "kill";

const CONSOLE_TABS: { key: ConsoleTab; labelKey: string }[] = [
  { key: "board", labelKey: "shared.instance.detail.overview" },
  { key: "command", labelKey: "shared.instance.detail.console" },
  { key: "files", labelKey: "shared.instance.detail.files" },
  { key: "events", labelKey: "shared.instance.detail.automation" },
  { key: "components", labelKey: "shared.instance.detail.components" },
  { key: "settings", labelKey: "shared.instance.detail.settings" },
];

const KILL_COUNTDOWN_SECONDS = 5;
const REPORT_POLL_MS = 2000;
const PING_POLL_MS = 5000;
const LOG_STICK_THRESHOLD_PX = 48;


function normalizeSettingsConsoleMode(value: unknown): "pipe" | "pty" {
  return String(value ?? "pipe").toLowerCase() === "pty" ? "pty" : "pipe";
}

function extractInstanceConsoleMode(
  instance: { raw?: Record<string, unknown> | null } | null | undefined,
): "pipe" | "pty" | null {
  const raw = (instance?.raw ?? {}) as Record<string, unknown>;
  const config = (raw.config ?? raw.Config ?? raw) as Record<string, unknown>;
  const value = config.console_mode ?? config.ConsoleMode;
  if (value == null || value === "") return null;
  return normalizeSettingsConsoleMode(value);
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(2)} ${units[index]}`;
}

function InstanceDetailInner() {
  const t = useT();
  const { confirm, prompt, toast } = useFeedback();
  const { locale } = useLocale();
  const search = useSearchParams();
  const id = search.get("id")?.trim() || "";
  const nodeId = search.get("node")?.trim() || "";
  const windowMode = search.get("view") === "window";
  const {
    instances,
    getStatus,
    startInstance,
    stopInstance,
    killInstance,
    restartInstance,
    sendCommand,
    getLogs,
    attachConsoleSession,
    subscribeInstanceLog,
    refreshInstanceReport,
    runWithClient,
    uploadFile,
    getJavaList,
  } = useDaemon();

  const [tab, setTab] = useState<ConsoleTab>("board");
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<LifecycleAction | null>(
    null,
  );
  const [killCountdown, setKillCountdown] = useState(KILL_COUNTDOWN_SECONDS);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [hideServerIp, setHideServerIp] = useState(false);

  // 文件：虚拟路径模型（对齐 WPF）
  const [virtualPath, setVirtualPath] = useState("/");
  const [fileEntries, setFileEntries] = useState<DirEntry[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileHistory, setFileHistory] = useState<string[]>(["/"]);
  const [fileHistoryIndex, setFileHistoryIndex] = useState(0);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [treeDirs, setTreeDirs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [jvmHelperOpen, setJvmHelperOpen] = useState(false);
  const [replacementCoreFile, setReplacementCoreFile] = useState<File | null>(
    null,
  );

  // 设置
  const [settingsName, setSettingsName] = useState("");
  const [settingsJava, setSettingsJava] = useState("");
  const [settingsArgs, setSettingsArgs] = useState<string[]>([]);
  const [settingsVersion, setSettingsVersion] = useState("");
  const [settingsType, setSettingsType] = useState("universal");
  const [settingsTarget, setSettingsTarget] = useState("");
  const [settingsForceRerun, setSettingsForceRerun] = useState(false);
  const [settingsConsoleMode, setSettingsConsoleMode] = useState<"pipe" | "pty">(
    "pipe",
  );
  const [settingsCanEdit, setSettingsCanEdit] = useState(true);
  const [settingsBlocked, setSettingsBlocked] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [javaList, setJavaList] = useState<JavaInfo[]>([]);
  const [javaScanning, setJavaScanning] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSnapshot, setSettingsSnapshot] = useState("");

  // 事件 / 组件
  const [eventRules, setEventRules] = useState<EventRule[]>([]);
  const [eventMultiTip, setEventMultiTip] = useState(true);
  const [components, setComponents] = useState<ComponentEntry[]>([]);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [hasModsDir, setHasModsDir] = useState(false);
  const [hasPluginsDir, setHasPluginsDir] = useState(false);

  const logPreRef = useRef<HTMLPreElement | null>(null);
  const stickToBottomRef = useRef(true);
  const consoleRootRef = useRef<HTMLDivElement | null>(null);
  const commandInputRef = useRef<HTMLInputElement | null>(null);
  const consoleSessionRef = useRef<{
    sendInput: (text: string) => void;
    resize: (columns: number, rows: number) => Promise<void>;
    close: () => Promise<void>;
    interactive: boolean;
  } | null>(null);
  const ptyHandleRef = useRef<PtyTerminalHandle | null>(null);
  const ptyBufferRef = useRef("");
  /** Survives console re-attach after processUp flips (history reload would wipe it). */
  const pendingConsoleNoticeRef = useRef<string | null>(null);

  const instance = useMemo(
    () =>
      instances.find(
        (item) => item.id === id && (!nodeId || item.nodeId === nodeId),
      ) ?? instances.find((item) => item.id === id),
    [instances, id, nodeId],
  );

  // UI mode 只跟实例配置的显式 console_mode 走；report 偶发缺字段时保持上次值，避免 pipe/pty 闪烁
  const [consoleViewMode, setConsoleViewMode] = useState<ConsoleViewMode>("pipe");
  useEffect(() => {
    const next = extractInstanceConsoleMode(instance);
    if (next) setConsoleViewMode(next);
  }, [instance]);
  // 仅在 console_mode 真值变化时重建终端会话
  const consoleModeKey = consoleViewMode;

  const resolvedNodeId = instance?.nodeId ?? nodeId;
  const nodeOnline =
    resolvedNodeId !== "" && getStatus(resolvedNodeId) === "online";
  const canOperate = Boolean(instance && resolvedNodeId && nodeOnline);

  const status = instance?.status ?? "stopped";
  // MC stays stopped on the wire until Done; mapDaemonStatus may report starting
  // while process_id > 0 — allow console I/O and stop/kill during boot.
  const processUp = isInstanceProcessUp(status);
  const canSend = nodeOnline && processUp;
  const canStart =
    nodeOnline && (status === "stopped" || status === "crashed");
  const canStop = nodeOnline && processUp;
  const canRestart = canStop;
  const canKill = canStop;

  const instanceName = instance?.name ?? id;
  const nodeName = instance?.nodeName ?? resolvedNodeId;
  const rootPath = useMemo(
    () => (id ? `/instances/${id}` : "/instances"),
    [id],
  );
  const showMcBoard = isMinecraftBoardType(instance?.type);

  useEffect(() => {
    if (!id) return;
    document.title = buildInstanceConsoleWindowTitle(t, instanceName, nodeName);
  }, [id, instanceName, nodeName, t]);

  // 2s report 轮询（文件/设置等非看板页降低频率，避免整表重绘卡顿）
  useEffect(() => {
    if (!resolvedNodeId || !id || !nodeOnline) return;
    // board / command 需要实时状态；文件管理页暂停 2s 轮询
    if (tab === "files") return;
    void refreshInstanceReport(resolvedNodeId, id);
    const timer = window.setInterval(() => {
      void refreshInstanceReport(resolvedNodeId, id);
    }, tab === "board" || tab === "command" ? REPORT_POLL_MS : REPORT_POLL_MS * 3);
    return () => window.clearInterval(timer);
  }, [resolvedNodeId, id, nodeOnline, refreshInstanceReport, tab]);

  // 进入文件页时预热 Monaco，打开编辑器时不再冷启动
  useEffect(() => {
    if (tab !== "files") return;
    void import("@/lib/monaco/setup").then(({ preloadMonaco }) => {
      void preloadMonaco(locale);
    });
  }, [tab, locale]);

  // 5s ping 延迟（对齐 DaemonConnectionInfo）
  useEffect(() => {
    if (!resolvedNodeId || !nodeOnline) {
      setLatencyMs(null);
      return;
    }
    // 文件页不需要延迟展示，避免无谓 setState
    if (tab === "files") return;
    let cancelled = false;
    const tick = async () => {
      const started = performance.now();
      const result = await runWithClient(resolvedNodeId, (client) =>
        client.ping(),
      );
      if (cancelled) return;
      if (result.ok) {
        setLatencyMs(Math.max(0, Math.round(performance.now() - started)));
      } else {
        setLatencyMs(null);
      }
    };
    void tick();
    const timer = window.setInterval(() => void tick(), PING_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [resolvedNodeId, nodeOnline, runWithClient, tab]);

  const statusLabel = (value: string) => {
    const key = `shared.instance.status.${value}`;
    const label = t(key);
    return label === key ? value : label;
  };

  const scrollLogToEnd = useCallback(() => {
    const el = logPreRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const onLogScroll = useCallback(() => {
    const el = logPreRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distance <= LOG_STICK_THRESHOLD_PX;
  }, []);

  const writeConsoleSystemNotice = useCallback(
    (text: string, options?: { persist?: boolean }) => {
      const line = text.trimEnd();
      if (!line) return;
      if (options?.persist !== false) {
        pendingConsoleNoticeRef.current = line;
      }
      const ptyChunk = `\r\n\x1b[36m${line}\x1b[0m\r\n`;
      if (consoleModeKey === "pty") {
        if (ptyHandleRef.current) {
          ptyHandleRef.current.write(ptyChunk);
        } else {
          ptyBufferRef.current += ptyChunk;
        }
      }
      setLogs((prev) => appendLogLines(prev, line));
      stickToBottomRef.current = true;
      requestAnimationFrame(() => {
        if (stickToBottomRef.current) scrollLogToEnd();
      });
    },
    [consoleModeKey, scrollLogToEnd],
  );

  // Keep console session for the whole detail visit (not only command tab).
  // Switching board/files must not close binary console or remount xterm.
  // 注意：不要依赖整个 instance 对象（report 2s 会换引用），否则会话反复拆建 → 模式闪烁
  useEffect(() => {
    if (!resolvedNodeId || !id || !nodeOnline) {
      return undefined;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let closeConsole: (() => Promise<void>) | undefined;
    stickToBottomRef.current = true;
    consoleSessionRef.current = null;
    // 不清空 ptyHandleRef / buffer：PtyTerminal 可能仍挂载，避免重 attach 丢 handle

    const interactive = consoleModeKey === "pty";
    // Seed history once per attach cycle; live output continues in xterm/logs.
    // Do not re-clear xterm when user only switches UI tabs (tab is not a dep).
    let seededPtyHistory = false;

    void (async () => {
      const history = await getLogs(resolvedNodeId, id);
      if (cancelled) return;
      const historyText = history.ok
        ? (history.logs ?? []).join("\n")
        : "";
      if (history.ok) {
        const base = history.logs ?? [];
        const notice = pendingConsoleNoticeRef.current;
        setLogs(notice ? appendLogLines(base, notice) : base);
        setMessage(null);
        requestAnimationFrame(() => {
          if (stickToBottomRef.current) scrollLogToEnd();
        });
      } else {
        setMessage(
          history.message ?? t("shared.instance.console.need-connection"),
        );
      }

      if (interactive && historyText && !seededPtyHistory) {
        // History bytes as-is: xterm renders real ANSI/SGR if present.
        const hist =
          historyText.endsWith("\n") ? historyText : `${historyText}\n`;
        const notice = pendingConsoleNoticeRef.current;
        const noticeChunk = notice
          ? `\r\n\x1b[36m${notice}\x1b[0m\r\n`
          : "";
        seededPtyHistory = true;
        if (ptyHandleRef.current) {
          // 已有 xterm：直接灌历史，避免只缓冲不显示
          ptyHandleRef.current.clear();
          ptyHandleRef.current.write(hist + noticeChunk);
          ptyBufferRef.current = "";
        } else {
          ptyBufferRef.current = hist + noticeChunk + ptyBufferRef.current;
        }
      } else if (interactive && !historyText) {
        const notice = pendingConsoleNoticeRef.current;
        if (notice) {
          const noticeChunk = `\r\n\x1b[36m${notice}\x1b[0m\r\n`;
          if (ptyHandleRef.current) {
            ptyHandleRef.current.write(noticeChunk);
          } else {
            ptyBufferRef.current += noticeChunk;
          }
        }
      }

      if (interactive && processUp) {
        const cols = ptyHandleRef.current?.cols?.() ?? 120;
        const rows = ptyHandleRef.current?.rows?.() ?? 40;
        const attached = await attachConsoleSession(resolvedNodeId, id, {
          columns: cols,
          rows: rows,
          onOutput: (text) => {
            if (cancelled) return;
            if (interactive) {
              if (ptyHandleRef.current) {
                ptyHandleRef.current.write(text);
              } else {
                ptyBufferRef.current += text;
              }
              return;
            }
            setLogs((prev) => appendLogLines(prev, text));
          },
        });
        if (cancelled) {
          if (attached.ok) void attached.close();
          return;
        }
        if (attached.ok) {
          consoleSessionRef.current = {
            sendInput: attached.sendInput,
            resize: attached.resize,
            close: attached.close,
            interactive,
          };
          closeConsole = attached.close;
          // Push current xterm size after open (initial open used fit size)
          try {
            const c = ptyHandleRef.current?.cols?.() ?? cols;
            const r = ptyHandleRef.current?.rows?.() ?? rows;
            void attached.resize(c, r);
          } catch {
            // ignore
          }
          return;
        }
        if (interactive) {
          setMessage(
            attached.message ?? t("shared.instance.console.need-connection"),
          );
        }
      }

      // binary console 不可用：pipe 订阅 log 事件；pty 仍保留 xterm，仅展示 history
      if (!interactive) {
        const sub = await subscribeInstanceLog(resolvedNodeId, id, (line) => {
          if (cancelled) return;
          setLogs((prev) => appendLogLines(prev, line));
        });
        if (cancelled) {
          sub.unsubscribe?.();
          return;
        }
        if (sub.ok && sub.unsubscribe) {
          unsubscribe = sub.unsubscribe;
        } else if (!sub.ok) {
          setMessage(
            sub.message ?? t("shared.instance.console.need-connection"),
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      consoleSessionRef.current = null;
      unsubscribe?.();
      void closeConsole?.();
    };
  }, [
    resolvedNodeId,
    id,
    nodeOnline,
    // Do NOT depend on `status` / processUp string churn (starting→running):
    // that tore down binary console mid-typing. Re-attach only when process
    // up/down flips or mode/node changes — not UI tab.
    processUp,
    consoleModeKey,
    getLogs,
    attachConsoleSession,
    subscribeInstanceLog,
    scrollLogToEnd,
    t,
  ]);

  // Refocus / fit when user returns to the command tab (panel stayed mounted).
  useEffect(() => {
    if (tab !== "command") return;
    const timer = window.setTimeout(() => {
      if (consoleModeKey === "pty") {
        ptyHandleRef.current?.fit();
        ptyHandleRef.current?.focus();
      } else {
        commandInputRef.current?.focus();
      }
    }, 50);
    return () => window.clearTimeout(timer);
  }, [tab, consoleModeKey]);

  useEffect(() => {
    if (tab !== "command") return;
    if (!stickToBottomRef.current) return;
    requestAnimationFrame(() => scrollLogToEnd());
  }, [logs, tab, scrollLogToEnd]);

  useEffect(() => {
    if (confirmAction !== "kill") {
      setKillCountdown(KILL_COUNTDOWN_SECONDS);
      return undefined;
    }
    setKillCountdown(KILL_COUNTDOWN_SECONDS);
    const timer = window.setInterval(() => {
      setKillCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [confirmAction]);

  useEffect(() => {
    const onChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const loadDirectory = useCallback(
    async (nextVirtual: string, options?: { pushHistory?: boolean }) => {
      if (!resolvedNodeId || !id) return;
      const virtual = normalizeVirtualPath(nextVirtual);
      const real = getRealPath(rootPath, virtual);
      setFileLoading(true);
      setFileError(null);
      setSelectedNames([]);
      const result = await runWithClient(resolvedNodeId, (client) =>
        client.getDirectoryInfo(real),
      );
      setFileLoading(false);
      if (!result.ok) {
        setFileError(
          result.message ?? t("shared.instance.files.load-failed"),
        );
        setFileEntries([]);
        return;
      }
      const data = result.data as Record<string, unknown>;
      const dirs = (data.directories ?? data.Directories ?? []) as Array<
        Record<string, unknown>
      >;
      const files = (data.files ?? data.Files ?? []) as Array<
        Record<string, unknown>
      >;
      const entries: DirEntry[] = [
        ...dirs.map((item) => {
          const meta = (item.meta ?? item.Meta ?? {}) as Record<
            string,
            unknown
          >;
          return {
            name: String(item.name ?? item.Name ?? ""),
            kind: "dir" as const,
            modified: parseDaemonTimestamp(
              meta.last_write_time ?? meta.LastWriteTime,
            ),
          };
        }),
        ...files.map((item) => {
          const meta = (item.meta ?? item.Meta ?? {}) as Record<
            string,
            unknown
          >;
          return {
            name: String(item.name ?? item.Name ?? ""),
            kind: "file" as const,
            size: Number(meta.size ?? meta.Size ?? 0) || undefined,
            modified: parseDaemonTimestamp(
              meta.last_write_time ?? meta.LastWriteTime,
            ),
          };
        }),
      ].filter((item) => item.name);
      entries.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setFileEntries(entries);
      setSelectedNames([]);
      if (virtual === "/" || virtual === "") {
        setTreeDirs(
          entries.filter((e) => e.kind === "dir").map((e) => e.name),
        );
      }
      setVirtualPath(virtual);
      if (options?.pushHistory !== false) {
        setFileHistory((prev) => {
          const base = prev.slice(0, fileHistoryIndex + 1);
          if (base[base.length - 1] === virtual) return base;
          const next = [...base, virtual];
          setFileHistoryIndex(next.length - 1);
          return next;
        });
      }
    },
    [
      resolvedNodeId,
      id,
      rootPath,
      runWithClient,
      t,
      fileHistoryIndex,
    ],
  );

  const loadSettings = useCallback(async () => {
    if (!resolvedNodeId || !id) return;
    setSettingsError(null);
    const result = await runWithClient(resolvedNodeId, (client) =>
      client.getInstanceSettings(id),
    );
    if (!result.ok) {
      const fallback = (instance?.raw?.config ?? {}) as Record<string, unknown>;
      setSettingsName(String(fallback.name ?? instance?.name ?? ""));
      setSettingsJava(String(fallback.java_path ?? ""));
      const fbArgs = Array.isArray(fallback.arguments)
        ? (fallback.arguments as string[])
        : [];
      setSettingsArgs(fbArgs);
      setSettingsVersion(String(fallback.version ?? fallback.mc_version ?? ""));
      setSettingsType(normalizeInstanceType(String(fallback.instance_type ?? instance?.type ?? "universal")));
      setSettingsTarget(String(fallback.target ?? ""));
      setSettingsForceRerun(false);
      const fbMode = normalizeSettingsConsoleMode(
        fallback.console_mode ?? fallback.ConsoleMode,
      );
      setSettingsConsoleMode(fbMode);
      setConsoleViewMode(fbMode);
      setSettingsSnapshot(
        JSON.stringify({
          name: String(fallback.name ?? instance?.name ?? ""),
          java: String(fallback.java_path ?? ""),
          args: fbArgs,
          version: String(fallback.version ?? fallback.mc_version ?? ""),
          type: normalizeInstanceType(String(fallback.instance_type ?? instance?.type ?? "universal")),
          force: false,
          consoleMode: fbMode,
        }),
      );
      setSettingsCanEdit(true);
      setSettingsBlocked(null);
      setSettingsError(result.message ?? null);
      return;
    }
    const data = result.data as Record<string, unknown>;
    const config = (data.config ?? data.Config ?? data) as Record<
      string,
      unknown
    >;
    setSettingsName(String(config.name ?? instance?.name ?? ""));
    setSettingsJava(String(config.java_path ?? config.JavaPath ?? ""));
    const argsRaw = (config.arguments ?? config.Arguments ?? []) as string[];
    const args = Array.isArray(argsRaw) ? argsRaw.map(String) : [];
    setSettingsArgs(args);
    setSettingsVersion(
      String(config.version ?? config.Version ?? config.mc_version ?? ""),
    );
    const nextType = normalizeInstanceType(
      String(
        config.instance_type ??
          config.InstanceType ??
          instance?.type ??
          "universal",
      ),
    );
    setSettingsType(nextType);
    setSettingsTarget(String(config.target ?? config.Target ?? ""));
    setSettingsForceRerun(false);
    const nextConsoleMode = normalizeSettingsConsoleMode(
      config.console_mode ?? config.ConsoleMode,
    );
    setSettingsConsoleMode(nextConsoleMode);
    setConsoleViewMode(nextConsoleMode);
    const canEdit = data.can_edit ?? data.CanEdit;
    setSettingsCanEdit(canEdit !== false);
    setSettingsBlocked(
      data.edit_blocked_reason
        ? String(data.edit_blocked_reason)
        : data.EditBlockedReason
          ? String(data.EditBlockedReason)
          : null,
    );
    setSettingsSnapshot(
      JSON.stringify({
        name: String(config.name ?? instance?.name ?? ""),
        java: String(config.java_path ?? config.JavaPath ?? ""),
        args,
        version: String(config.version ?? config.Version ?? config.mc_version ?? ""),
        type: nextType,
        force: false,
        consoleMode: nextConsoleMode,
      }),
    );

    setJavaScanning(true);
    const java = await getJavaList(resolvedNodeId);
    setJavaScanning(false);
    if (java.ok && java.javaList) {
      setJavaList(java.javaList);
    }
  }, [id, instance, resolvedNodeId, runWithClient, getJavaList]);

  const loadEvents = useCallback(async () => {
    if (!resolvedNodeId || !id) return;
    const result = await runWithClient(resolvedNodeId, (client) =>
      client.getEventRules(id),
    );
    if (!result.ok) {
      setEventRules([]);
      setMessage(result.message ?? t("shared.instance.events.load-failed"));
      return;
    }
    setEventRules(normalizeEventRules(result.data));
  }, [id, resolvedNodeId, runWithClient, t]);

  const loadComponents = useCallback(async () => {
    if (!resolvedNodeId || !id) return;
    setComponentsLoading(true);
    const folders: Array<"mods" | "plugins"> = ["mods", "plugins"];
    const next: ComponentEntry[] = [];
    let modsOk = false;
    let pluginsOk = false;
    for (const folder of folders) {
      const real = getRealPath(rootPath, `/${folder}`);
      const result = await runWithClient(resolvedNodeId, (client) =>
        client.getDirectoryInfo(real),
      );
      if (!result.ok) continue;
      if (folder === "mods") modsOk = true;
      if (folder === "plugins") pluginsOk = true;
      const data = result.data as Record<string, unknown>;
      const files = (data.files ?? data.Files ?? []) as Array<
        Record<string, unknown>
      >;
      for (const item of files) {
        const name = String(item.name ?? item.Name ?? "");
        if (!name) continue;
        const lower = name.toLowerCase();
        if (!lower.endsWith(".jar") && !lower.endsWith(".jar.disabled")) {
          continue;
        }
        next.push({
          name,
          enabled: !lower.endsWith(".disabled"),
          kind: folder,
        });
      }
    }
    next.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
      return a.name.localeCompare(b.name);
    });
    setHasModsDir(modsOk);
    setHasPluginsDir(pluginsOk);
    setComponents(next);
    setComponentsLoading(false);
  }, [resolvedNodeId, id, rootPath, runWithClient]);

  useEffect(() => {
    if (tab === "files" && canOperate) {
      void loadDirectory(virtualPath || "/", { pushHistory: false });
    }
  }, [tab, canOperate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === "settings" && canOperate) {
      void loadSettings();
    }
  }, [tab, canOperate, loadSettings]);

  useEffect(() => {
    if (tab === "events" && canOperate) {
      void loadEvents();
    }
  }, [tab, canOperate, loadEvents]);

  useEffect(() => {
    if (tab === "components" && canOperate) {
      void loadComponents();
    }
  }, [tab, canOperate, loadComponents]);

  const gateFor = (action: LifecycleAction) => {
    if (action === "start") return canStart;
    if (action === "stop") return canStop;
    if (action === "restart") return canRestart;
    return canKill;
  };

  function requestLifecycle(action: LifecycleAction) {
    if (!gateFor(action)) {
      setMessage(t("shared.instance.console.action-unavailable"));
      return;
    }
    setConfirmAction(action);
  }

  async function executeLifecycle(action: LifecycleAction) {
    if (!resolvedNodeId || !id) return;
    if (!gateFor(action)) {
      setMessage(t("shared.instance.console.action-unavailable"));
      setConfirmAction(null);
      return;
    }
    setBusy(true);
    setMessage(null);
    setConfirmAction(null);
    const result =
      action === "start"
        ? await startInstance(resolvedNodeId, id)
        : action === "stop"
          ? await stopInstance(resolvedNodeId, id)
          : action === "restart"
            ? await restartInstance(resolvedNodeId, id)
            : await killInstance(resolvedNodeId, id);
    setBusy(false);
    if (result.ok) {
      setMessage(null);
      const noticeKey =
        action === "start"
          ? "shared.instance.console.system.start"
          : action === "stop"
            ? "shared.instance.console.system.stop"
            : action === "restart"
              ? "shared.instance.console.system.restart"
              : "shared.instance.console.system.kill";
      writeConsoleSystemNotice(t(noticeKey));
    } else {
      const failMessage =
        result.message ?? t("shared.instance.console.need-connection");
      setMessage(failMessage);
      writeConsoleSystemNotice(
        t("shared.instance.console.system.failed", { message: failMessage }),
      );
    }
    void refreshInstanceReport(resolvedNodeId, id);
  }

  async function onSend() {
    if (!resolvedNodeId || !id || !command.trim()) return;
    if (!canSend) {
      setMessage(t("shared.instance.console.action-unavailable"));
      return;
    }
    const line = command.trim();
    setBusy(true);
    const session = consoleSessionRef.current;
    if (session && !session.interactive) {
      try {
        // Pipe session：行模式补换行
        session.sendInput(`${line}\n`);
        setBusy(false);
        setCommand("");
        setMessage(null);
        commandInputRef.current?.focus();
        return;
      } catch {
        // fall through to command.send
      }
    }
    const result = await sendCommand(resolvedNodeId, id, line);
    setBusy(false);
    if (result.ok) {
      setCommand("");
      setMessage(null);
      commandInputRef.current?.focus();
    } else {
      setMessage(
        result.message ?? t("shared.instance.console.need-connection"),
      );
    }
  }

  async function toggleFullscreen() {
    const root = consoleRootRef.current;
    if (!root) return;
    try {
      if (!document.fullscreenElement) {
        await root.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setMessage(t("shared.instance.console.action-unavailable"));
    }
  }

  async function onCreateDirectory() {
    if (!resolvedNodeId || !canOperate) return;
    const name = await prompt({
      title: t("shared.instance.files.mkdir-prompt"),
      confirmLabel: t("ui.common.confirm"),
      cancelLabel: t("ui.common.cancel"),
    });
    if (!name?.trim()) return;
    const real = getRealPath(
      rootPath,
      joinVirtualPath(virtualPath, name.trim()),
    );
    setBusy(true);
    const result = await runWithClient(resolvedNodeId, (client) =>
      client.createDirectory(real),
    );
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message ?? t("shared.instance.files.op-failed"));
      return;
    }
    setMessage(null);
    void loadDirectory(virtualPath, { pushHistory: false });
  }

  async function onRenameSelected() {
    if (!resolvedNodeId || !canOperate || !selectedNames[0]) return;
    const entry = fileEntries.find((item) => item.name === selectedNames[0]);
    if (!entry) return;
    const next = await prompt({
      title: t("shared.instance.files.rename-prompt"),
      defaultValue: entry.name,
      confirmLabel: t("ui.common.confirm"),
      cancelLabel: t("ui.common.cancel"),
    });
    if (!next?.trim() || next.trim() === entry.name) return;
    const real = getRealPath(
      rootPath,
      joinVirtualPath(virtualPath, entry.name),
    );
    setBusy(true);
    const result = await runWithClient(resolvedNodeId, (client) =>
      entry.kind === "dir"
        ? client.renameDirectory(real, next.trim())
        : client.renameFile(real, next.trim()),
    );
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message ?? t("shared.instance.files.op-failed"));
      return;
    }
    setMessage(null);
    void loadDirectory(virtualPath, { pushHistory: false });
  }

  async function onDeleteSelected() {
    if (!resolvedNodeId || !canOperate || selectedNames.length === 0) return;
    const entries = selectedNames
      .map((name) => fileEntries.find((item) => item.name === name))
      .filter((item): item is DirEntry => Boolean(item));
    if (entries.length === 0) return;
    const label =
      entries.length === 1
        ? entries[0].name
        : t("shared.instance.files.delete-multi", { count: entries.length });
    const ok = await confirm({
      description: t("shared.instance.files.delete-confirm", { name: label }),
      destructive: true,
      confirmLabel: t("ui.common.confirm"),
      cancelLabel: t("ui.common.cancel"),
    });
    if (!ok) return;
    setBusy(true);
    setMessage(null);
    for (const entry of entries) {
      const real = getRealPath(
        rootPath,
        joinVirtualPath(virtualPath, entry.name),
      );
      const result = await runWithClient(resolvedNodeId, (client) =>
        entry.kind === "dir"
          ? client.deleteDirectory(real, true)
          : client.deleteFile(real),
      );
      if (!result.ok) {
        setBusy(false);
        setMessage(result.message ?? t("shared.instance.files.op-failed"));
        void loadDirectory(virtualPath, { pushHistory: false });
        return;
      }
    }
    setBusy(false);
    setMessage(null);
    void loadDirectory(virtualPath, { pushHistory: false });
  }

  function triggerBrowserDownload(blob: Blob, fileName: string) {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
  }

  async function onDownloadSelected() {
    if (!resolvedNodeId || !canOperate || selectedNames.length === 0) return;
    const files = selectedNames
      .map((name) => fileEntries.find((item) => item.name === name))
      .filter((item): item is DirEntry => Boolean(item && item.kind === "file"));
    if (files.length === 0) {
      setMessage(t("shared.instance.files.download-failed"));
      return;
    }
    setBusy(true);
    setMessage(null);
    let okCount = 0;
    for (const entry of files) {
      const real = getRealPath(
        rootPath,
        joinVirtualPath(virtualPath, entry.name),
      );
      const result = await runWithClient(resolvedNodeId, (client) =>
        client.downloadFile(real),
      );
      if (!result.ok) {
        setBusy(false);
        setMessage(
          result.message ?? t("shared.instance.files.download-failed"),
        );
        return;
      }
      triggerBrowserDownload(result.data, entry.name);
      okCount += 1;
    }
    setBusy(false);
    setMessage(null);
  }

  async function openFileEditor(entry: DirEntry) {
    if (!resolvedNodeId || !canOperate || entry.kind !== "file") return;
    if (!isLikelyTextFile(entry.name, entry.size)) {
      const ok = await confirm({
        description: t("shared.instance.files.editor-binary-confirm"),
        confirmLabel: t("ui.common.confirm"),
        cancelLabel: t("ui.common.cancel"),
      });
      if (!ok) return;
    }
    const real = getRealPath(
      rootPath,
      joinVirtualPath(virtualPath, entry.name),
    );
    try {
      await openFileEditorWindow({
        instanceId: id,
        nodeId: resolvedNodeId,
        filePath: real,
        fileName: entry.name,
        fileSize: entry.size,
        title: entry.name,
      });
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : t("shared.instance.files.editor-load-failed"),
      );
    }
  }



  async function onUploadFiles(fileList: FileList | null) {
    if (!resolvedNodeId || !canOperate || !fileList || fileList.length === 0) {
      return;
    }
    setBusy(true);
    let progressRaf = 0;
    for (const file of Array.from(fileList)) {
      const target = getRealPath(
        rootPath,
        joinVirtualPath(virtualPath, file.name),
      );
      setUploadProgress(`${file.name} 0%`);
      const result = await uploadFile(
        resolvedNodeId,
        file,
        target,
        (progress) => {
          const pct =
            progress.total > 0
              ? Math.round((progress.loaded / progress.total) * 100)
              : 0;
          // rAF 节流进度更新，避免上传时整页狂刷
          if (progressRaf) return;
          progressRaf = window.requestAnimationFrame(() => {
            progressRaf = 0;
            setUploadProgress(`${file.name} ${pct}%`);
          });
        },
      );
      if (!result.ok) {
        setBusy(false);
        setUploadProgress(null);
        setMessage(result.message ?? t("shared.instance.files.op-failed"));
        return;
      }
    }
    setBusy(false);
    setUploadProgress(null);
    setMessage(null);
    void loadDirectory(virtualPath, { pushHistory: false });
  }

  async function toggleComponent(entry: ComponentEntry) {
    if (!resolvedNodeId || !canOperate) return;
    const real = getRealPath(rootPath, `/${entry.kind}/${entry.name}`);
    const nextName = entry.enabled
      ? `${entry.name}.disabled`
      : entry.name.replace(/\.disabled$/i, "");
    setBusy(true);
    const result = await runWithClient(resolvedNodeId, (client) =>
      client.renameFile(real, nextName),
    );
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message ?? t("shared.instance.files.op-failed"));
      return;
    }
    setMessage(null);
    void loadComponents();
  }

  async function saveSettings() {
    if (!resolvedNodeId || !id || !settingsCanEdit) return;
    if (!settingsName.trim()) {
      setSettingsError(t("shared.instance.settings.name-required"));
      return;
    }
    if (isJavaRuntimeType(normalizeInstanceType(settingsType))) {
      const javaCheck = tryValidateJavaPath(settingsJava);
      if (!javaCheck.ok) {
        setSettingsError(javaCheck.error);
        return;
      }
    }
    setSettingsSaving(true);
    setSettingsError(null);
    const args = settingsArgs.map((line) => line.trim()).filter(Boolean);
    let replacement_core:
      | {
          uploaded_source_path: string;
          preferred_target_name?: string | null;
        }
      | null = null;
    if (replacementCoreFile) {
      const uploadPath = `/instances/${id}/uploads/${replacementCoreFile.name}`;
      const upload = await uploadFile(
        resolvedNodeId,
        replacementCoreFile,
        uploadPath,
      );
      if (!upload.ok) {
        setSettingsSaving(false);
        setSettingsError(
          upload.message ?? t("shared.instance.settings.save-failed"),
        );
        return;
      }
      replacement_core = {
        uploaded_source_path: uploadPath,
        preferred_target_name: replacementCoreFile.name,
      };
    }
    const result = await runWithClient(resolvedNodeId, (client) =>
      client.updateInstanceSettings({
        id,
        name: settingsName.trim() || instanceName,
        instance_type: normalizeInstanceType(settingsType || "universal"),
        java_path: settingsJava.trim() || null,
        arguments: args,
        version: settingsVersion.trim() || null,
        force_rerun_installer: settingsForceRerun,
        console_mode: settingsConsoleMode,
        replacement_core,
      }),
    );
    setSettingsSaving(false);
    if (!result.ok) {
      setSettingsError(
        result.message ?? t("shared.instance.settings.save-failed"),
      );
      return;
    }
    setReplacementCoreFile(null);
    setMessage(null);
    setConsoleViewMode(settingsConsoleMode);
    void refreshInstanceReport(resolvedNodeId, id);
    void loadSettings();
  }

  async function scanJavaRuntimes() {
    if (!resolvedNodeId || javaScanning) return;
    setJavaScanning(true);
    setSettingsError(null);
    const java = await getJavaList(resolvedNodeId);
    setJavaScanning(false);
    if (java.ok && java.javaList) {
      setJavaList(java.javaList);
      if (!settingsJava.trim() && java.javaList[0]?.path) {
        setSettingsJava(java.javaList[0].path);
      }
      setMessage(null);
      return;
    }
    setSettingsError(
      java.message ?? t("shared.instance.settings.java-scan-failed"),
    );
  }

  function goHistory(delta: number) {
    const nextIndex = fileHistoryIndex + delta;
    if (nextIndex < 0 || nextIndex >= fileHistory.length) return;
    setFileHistoryIndex(nextIndex);
    void loadDirectory(fileHistory[nextIndex], { pushHistory: false });
  }

  function openFileEntry(entry: DirEntry) {
    if (entry.name === "..") {
      void loadDirectory(parentVirtualPath(virtualPath));
      return;
    }
    if (entry.kind === "dir") {
      void loadDirectory(joinVirtualPath(virtualPath, entry.name));
      return;
    }
    setSelectedNames([entry.name]);
    void openFileEditor(entry);
  }

  async function saveEventRules() {
    if (!resolvedNodeId || !id) return;
    setBusy(true);
    const result = await runWithClient(resolvedNodeId, (client) =>
      client.saveEventRules(id, toWireRules(eventRules) as unknown[]),
    );
    setBusy(false);
    setMessage(
      result.ok
        ? null
        : (result.message ?? t("shared.instance.events.save-failed")),
    );
  }

  function exportEventRules() {
    const blob = new Blob([JSON.stringify(toWireRules(eventRules), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "EventRules.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importEventRules(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const rules = normalizeEventRules(parsed).map((rule) =>
        cloneRule(rule, ""),
      );
      // re-id already in cloneRule; empty suffix then fix name
      setEventRules((prev) => [
        ...prev,
        ...rules.map((r, i) => ({
          ...r,
          name: r.name || `Import ${i + 1}`,
        })),
      ]);
      setMessage(null);
    } catch {
      setMessage(t("shared.instance.events.import-failed"));
    }
  }

  async function deleteComponent(entry: ComponentEntry) {
    if (!resolvedNodeId || !canOperate) return;
    const ok = await confirm({
      description: t("shared.instance.files.delete-confirm", { name: entry.name }),
      destructive: true,
      confirmLabel: t("ui.common.confirm"),
      cancelLabel: t("ui.common.cancel"),
    });
    if (!ok) return;
    const real = getRealPath(rootPath, `/${entry.kind}/${entry.name}`);
    setBusy(true);
    const result = await runWithClient(resolvedNodeId, (client) =>
      client.deleteFile(real),
    );
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message ?? t("shared.instance.files.op-failed"));
      return;
    }
    setMessage(null);
    void loadComponents();
  }

  async function addComponentFiles(
    kind: "mods" | "plugins",
    fileList: FileList | null,
  ) {
    if (!resolvedNodeId || !canOperate || !fileList?.length) return;
    setBusy(true);
    for (const file of Array.from(fileList)) {
      if (!file.name.toLowerCase().endsWith(".jar")) continue;
      const target = getRealPath(rootPath, `/${kind}/${file.name}`);
      const result = await uploadFile(resolvedNodeId, file, target);
      if (!result.ok) {
        setBusy(false);
        setMessage(result.message ?? t("shared.instance.files.op-failed"));
        return;
      }
    }
    setBusy(false);
    setMessage(null);
    void loadComponents();
  }

  const settingsDirty =
    settingsSnapshot !==
      JSON.stringify({
        name: settingsName,
        java: settingsJava,
        args: settingsArgs,
        version: settingsVersion,
        type: settingsType,
        force: settingsForceRerun,
        consoleMode: settingsConsoleMode,
      }) || Boolean(replacementCoreFile);

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
          {windowMode ? null : (
            <Button asChild>
              <Link href="/instances/">{t("ui.common.close")}</Link>
            </Button>
          )}
        </Empty>
      </ConsolePage>
    );
  }

  const tabLabel = (key: string) => {
    const value = t(key);
    return value === key ? (key.split(".").pop() ?? key) : value;
  };

  const config = (instance?.raw?.config ?? {}) as Record<string, unknown>;
  const properties = (instance?.raw?.properties ?? {}) as Record<
    string,
    string
  >;
  const players = Array.isArray(instance?.raw?.players)
    ? instance.raw.players
    : [];
  const serverIp = properties["server-ip"] ?? properties.server_ip ?? "";
  const serverPort =
    properties["server-port"] ?? properties.server_port ?? "";
  const addressText =
    hideServerIp
      ? `•••:${serverPort || "?"}`
      : `${serverIp || "0.0.0.0"}:${serverPort || "?"}`;

  const confirmTitle =
    confirmAction === "start"
      ? t("shared.instances.confirm.start")
      : confirmAction === "stop"
        ? t("shared.instances.confirm.stop")
        : confirmAction === "restart"
          ? t("shared.instances.confirm.restart")
          : confirmAction === "kill"
            ? t("shared.instances.confirm.kill")
            : "";

  const confirmContent =
    confirmAction === "start"
      ? t("shared.instance.console.confirm.start", { name: instanceName })
      : confirmAction === "stop"
        ? t("shared.instance.console.confirm.stop", { name: instanceName })
        : confirmAction === "restart"
          ? t("shared.instance.console.confirm.restart", { name: instanceName })
          : confirmAction === "kill"
            ? t("shared.instance.console.confirm.kill", { name: instanceName })
            : "";

  const confirmPrimaryLabel =
    confirmAction === "start"
      ? t("shared.instance.action.start")
      : confirmAction === "stop"
        ? t("shared.instance.action.stop")
        : confirmAction === "restart"
          ? t("shared.instance.action.restart")
          : confirmAction === "kill"
            ? killCountdown > 0
              ? `${t("shared.instance.action.kill")} (${killCountdown}s)`
              : t("shared.instance.action.kill")
            : t("ui.common.done");

  const killPrimaryDisabled =
    confirmAction === "kill" && killCountdown > 0;

  const cpuValue =
    instance?.cpu != null
      ? Math.max(0, Math.min(100, Number(instance.cpu)))
      : null;
  const memValue =
    instance?.memory != null ? Number(instance.memory) : null;

  const memMb =
    memValue != null ? memValue / 1024 / 1024 : null;

  return (
    <ConsolePage className="flex h-full min-h-0 flex-1 flex-col gap-0">
      <Reveal className="shrink-0">
        <div className="mb-3 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-medium">
                {t("shared.instance.console.title")}
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <Package className="size-3.5 shrink-0 opacity-70" />
                <span className="truncate font-medium" title={instanceName}>
                  {instanceName}
                </span>
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <HardDrive className="size-3.5 shrink-0 opacity-70" />
                <span className="truncate font-medium" title={nodeName}>
                  {nodeName}
                </span>
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {instance
                ? `${formatInstanceTypeLabel(instance.type)}${
                    instance.gameVersion ? ` · ${instance.gameVersion}` : ""
                  }`
                : id}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={nodeOnline ? "default" : "secondary"}>
              {statusLabel(status)}
            </Badge>
            {windowMode ? null : (
              <Button asChild size="sm" variant="ghost">
                <Link href="/instances/">{t("ui.common.close")}</Link>
              </Button>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.03} className="shrink-0">
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
        <p className="mb-3 shrink-0 text-sm text-destructive">{message}</p>
      ) : null}

      {tab === "board" ? (
        <Reveal delay={0.04} className="min-h-0 flex-1 overflow-y-auto">
          {/* WPF BoardPage: 纵向 Performance → Latency → Address/Players */}
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.instance.board.performance")}
              />
              <div className="space-y-4 text-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {t("shared.nodes.resource.memory")}
                    </span>
                    <span className="tabular-nums">
                      {memMb != null ? `${memMb.toFixed(2)} MB` : "—"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${
                          memMb != null
                            ? Math.max(0, Math.min(100, (memMb / 8192) * 100))
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">CPU</span>
                    <span className="tabular-nums">
                      {cpuValue != null ? `${cpuValue.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${cpuValue ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </ConsolePanel>

            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.instance.board.connection")}
              />
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">
                  {t("shared.instance.board.latency")}
                </dt>
                <dd className="tabular-nums">
                  {latencyMs != null
                    ? `${latencyMs} ms`
                    : nodeOnline
                      ? "…"
                      : "—"}
                </dd>
              </dl>
            </ConsolePanel>

            {showMcBoard ? (
              <>
                <ConsolePanel>
                  <ConsolePanelHeader
                    title={t("shared.instance.board.address")}
                    action={
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setHideServerIp((v) => !v)}
                      >
                        {hideServerIp
                          ? t("shared.instance.board.show-ip")
                          : t("shared.instance.board.hide-ip")}
                      </Button>
                    }
                  />
                  <p className="font-mono text-sm">{addressText}</p>
                  {!serverPort ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("shared.instance.board.address-empty")}
                    </p>
                  ) : null}
                </ConsolePanel>
                <ConsolePanel>
                  <ConsolePanelHeader
                    title={t("shared.instance.board.players")}
                  />
                  {players.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("shared.instance.board.players-empty")}
                    </p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {players.map((player, index) => (
                        <li key={index} className="truncate font-mono">
                          {playerDisplayName(player)}
                        </li>
                      ))}
                    </ul>
                  )}
                </ConsolePanel>
              </>
            ) : null}
          </div>
        </Reveal>
      ) : null}

      {/* Keep mounted across tabs so xterm scrollback + binary session survive. */}
      <Reveal
        delay={0.04}
        className={cn(
          "min-h-0 flex-1 flex-col",
          tab === "command" ? "flex h-full" : "hidden",
        )}
        aria-hidden={tab !== "command"}
      >
        <CommandPanel
          t={t}
          mode={consoleViewMode === "pty" ? "pty" : "pipe"}
          logs={logs}
          command={command}
          setCommand={setCommand}
          busy={busy}
          canSend={canSend}
          canStart={canStart}
          canStop={canStop}
          canRestart={canRestart}
          canKill={canKill}
          fullscreen={fullscreen}
          terminalActive={tab === "command"}
          logPreRef={logPreRef}
          commandInputRef={commandInputRef}
          consoleRootRef={consoleRootRef}
          onLogScroll={onLogScroll}
          onSend={() => void onSend()}
          onToggleFullscreen={() => void toggleFullscreen()}
          onLifecycle={requestLifecycle}
          onPtyData={(data) => {
            const session = consoleSessionRef.current;
            if (!session) return;
            // Always forward raw keystrokes once binary session exists
            // (interactive PTY or pipe session used as raw channel).
            session.sendInput(data);
          }}
          onPtyResize={(cols, rows) => {
            void consoleSessionRef.current?.resize(cols, rows);
          }}
          onPtyReady={(handle) => {
            ptyHandleRef.current = handle;
            if (ptyBufferRef.current) {
              handle.write(ptyBufferRef.current);
              ptyBufferRef.current = "";
            }
            handle.fit();
            if (tab === "command") handle.focus();
          }}
        />
      </Reveal>

      {tab === "files" ? (
        <Reveal delay={0.04} className="flex min-h-0 flex-1 flex-col">
          <FileManagerPanel
            t={t}
            canOperate={canOperate}
            busy={busy}
            virtualPath={virtualPath}
            fileEntries={fileEntries}
            fileError={fileError}
            fileLoading={fileLoading}
            selectedNames={selectedNames}
            setSelectedNames={setSelectedNames}
            treeDirs={treeDirs}
            canBack={fileHistoryIndex > 0}
            canForward={fileHistoryIndex < fileHistory.length - 1}
            uploadProgress={uploadProgress}
            fileInputRef={fileInputRef}
            onBack={() => goHistory(-1)}
            onForward={() => goHistory(1)}
            onUp={() => void loadDirectory(parentVirtualPath(virtualPath))}
            onRefresh={() =>
              void loadDirectory(virtualPath, { pushHistory: false })
            }
            onNavigatePath={(path) =>
              void loadDirectory(normalizeVirtualPath(path || "/"))
            }
            onOpenEntry={openFileEntry}
            onTreeNavigate={(p) => void loadDirectory(p)}
            onCreateDirectory={() => void onCreateDirectory()}
            onUpload={(files) => void onUploadFiles(files)}
            onDownload={() => void onDownloadSelected()}
            onRename={() => void onRenameSelected()}
            onDelete={() => void onDeleteSelected()}
          />
        </Reveal>
      ) : null}

      {tab === "events" ? (
        <Reveal delay={0.04} className="flex min-h-0 flex-1 flex-col">
          <EventTriggerPanel
            t={t}
            canOperate={canOperate}
            busy={busy}
            rules={eventRules}
            multiSelectTip={eventMultiTip}
            onDismissTip={() => setEventMultiTip(false)}
            onAdd={() =>
              setEventRules((prev) => [
                ...prev,
                createEmptyRule(
                  t("shared.instance.events.new-name"),
                  t("shared.instance.events.new-desc"),
                ),
              ])
            }
            onImport={(file) => void importEventRules(file)}
            onExport={exportEventRules}
            onSave={() => void saveEventRules()}
            onRefresh={() => void loadEvents()}
            onToggle={(ruleId, enabled) =>
              setEventRules((prev) =>
                prev.map((r) =>
                  r.id === ruleId ? { ...r, isEnabled: enabled } : r,
                ),
              )
            }
            onCopy={(ruleId) => {
              const rule = eventRules.find((r) => r.id === ruleId);
              if (!rule) return;
              setEventRules((prev) => [
                ...prev,
                cloneRule(rule, " - Copy"),
              ]);
            }}
            onDelete={(ruleId) =>
              setEventRules((prev) => prev.filter((r) => r.id !== ruleId))
            }
            onUpdateRule={(rule) =>
              setEventRules((prev) =>
                prev.map((r) => (r.id === rule.id ? rule : r)),
              )
            }
          />
        </Reveal>
      ) : null}

      {tab === "components" ? (
        <Reveal delay={0.04} className="flex min-h-0 flex-1 flex-col">
          <ComponentManagerPanel
            t={t}
            canOperate={canOperate}
            busy={busy}
            loading={componentsLoading}
            components={components}
            hasModsDir={hasModsDir}
            hasPluginsDir={hasPluginsDir}
            onRefresh={() => void loadComponents()}
            onToggle={(entry) => void toggleComponent(entry)}
            onDelete={(entry) => void deleteComponent(entry)}
            onLocate={(entry) => {
              const path = `/instances/${id}/${entry.kind}/${entry.name}`;
              void navigator.clipboard?.writeText(path);
              setMessage(t("shared.instance.components.locate-copied"));
            }}
            onAddFiles={(kind, files) => void addComponentFiles(kind, files)}
          />
        </Reveal>
      ) : null}

      {tab === "settings" ? (
        <Reveal delay={0.04} className="flex min-h-0 flex-1 flex-col">
                    <InstanceSettingsPanel
            t={t}
            instanceId={id}
            canOperate={canOperate}
            busy={busy}
            saving={settingsSaving}
            canEdit={settingsCanEdit}
            blockedReason={settingsBlocked}
            error={settingsError}
            name={settingsName}
            setName={setSettingsName}
            type={settingsType}
            setType={setSettingsType}
            version={settingsVersion}
            setVersion={setSettingsVersion}
            java={settingsJava}
            setJava={setSettingsJava}
            javaList={javaList}
            javaScanning={javaScanning}
            jvmArgs={settingsArgs}
            setJvmArgs={setSettingsArgs}
            target={settingsTarget}
            forceRerun={settingsForceRerun}
            setForceRerun={setSettingsForceRerun}
            consoleMode={settingsConsoleMode}
            setConsoleMode={setSettingsConsoleMode}
            replacementCoreName={replacementCoreFile?.name ?? null}
            dirty={settingsDirty}
            onRefresh={() => void loadSettings()}
            onSave={() => void saveSettings()}
            onScanJava={() => void scanJavaRuntimes()}
            onOpenJvmHelper={() => setJvmHelperOpen(true)}
            onPickReplacementCore={(file) => setReplacementCoreFile(file)}
            onClearReplacementCore={() => setReplacementCoreFile(null)}
          />

        </Reveal>
      ) : null}
<JvmArgHelperDialog
        open={jvmHelperOpen}
        onOpenChange={setJvmHelperOpen}
        onInsert={(args) => {
          setSettingsArgs((prev) => [...prev, ...args]);
          setJvmHelperOpen(false);
        }}
      />

<Dialog
        open={confirmAction != null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>{confirmTitle}</DialogTitle>
            <DialogDescription>{confirmContent}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmAction(null)}
            >
              {t("ui.common.cancel")}
            </Button>
            <Button
              type="button"
              variant={confirmAction === "kill" ? "destructive" : "default"}
              disabled={busy || killPrimaryDisabled}
              onClick={() => {
                if (confirmAction) void executeLifecycle(confirmAction);
              }}
            >
              {confirmPrimaryLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConsolePage>
  );
}

export default function InstanceDetailPage() {
  return (
    <Suspense fallback={null}>
      <InstanceDetailInner />
    </Suspense>
  );
}

"use client";

import type { ReactNode, RefObject } from "react";
import {
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Play,
  Power,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  PtyTerminal,
  type PtyTerminalHandle,
} from "@/features/console/components/pty-terminal";
import { renderLogLines } from "@/features/console/log-utils";
import { cn } from "@/lib/utils";

export type ConsoleViewMode = "pipe" | "pty" | "log";

/** WPF CommandPage: Row Auto / * / Auto — logger fills height and scrolls itself */
export function CommandPanel({
  t,
  mode,
  logs,
  command,
  setCommand,
  busy,
  canSend,
  canStart,
  canStop,
  canRestart,
  canKill,
  fullscreen,
  /** When false, panel may stay mounted but hidden (keep xterm / scrollback). */
  terminalActive = true,
  logPreRef,
  commandInputRef,
  consoleRootRef,
  onLogScroll,
  onSend,
  onToggleFullscreen,
  onLifecycle,
  onPtyData,
  onPtyResize,
  onPtyReady,
}: {
  t: (key: string, params?: Record<string, string | number>) => string;
  /** pipe: log + command bar; pty: xterm only; log: read-only log stream */
  mode: ConsoleViewMode;
  logs: string[];
  command: string;
  setCommand: (v: string) => void;
  busy: boolean;
  canSend: boolean;
  canStart: boolean;
  canStop: boolean;
  canRestart: boolean;
  canKill: boolean;
  fullscreen: boolean;
  terminalActive?: boolean;
  logPreRef: RefObject<HTMLPreElement | null>;
  commandInputRef: RefObject<HTMLInputElement | null>;
  consoleRootRef: RefObject<HTMLDivElement | null>;
  onLogScroll: () => void;
  onSend: () => void;
  onToggleFullscreen: () => void;
  onLifecycle: (action: "start" | "stop" | "restart" | "kill") => void;
  onPtyData?: (data: string) => void;
  onPtyResize?: (cols: number, rows: number) => void;
  onPtyReady?: (handle: PtyTerminalHandle) => void;
}) {
  const isPty = mode === "pty";
  const showCommandBar = mode === "pipe";

  return (
    <div
      ref={consoleRootRef}
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col",
        fullscreen && "fixed inset-0 z-50 h-screen bg-background p-4",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            {isPty
              ? t("shared.instance.console.pty-tip")
              : t("shared.instance.console.feedback-tip")}
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onToggleFullscreen()}
          >
            {fullscreen ? (
              <>
                <Minimize2 className="size-4" />
                {t("shared.instance.console.exit-fullscreen")}
              </>
            ) : (
              <>
                <Maximize2 className="size-4" />
                {t("shared.instance.console.enter-fullscreen")}
              </>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={t("ui.common.more")}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem
                disabled={!canStart || busy}
                onSelect={() => onLifecycle("start")}
              >
                <Play className="size-4" />
                {t("shared.instance.action.start")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!canStop || busy}
                onSelect={() => onLifecycle("stop")}
              >
                <Power className="size-4" />
                {t("shared.instance.action.stop")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canRestart || busy}
                onSelect={() => onLifecycle("restart")}
              >
                <RefreshCw className="size-4" />
                {t("shared.instance.action.restart")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={!canKill || busy}
                onSelect={() => onLifecycle("kill")}
              >
                <XCircle className="size-4" />
                {t("shared.instance.action.kill")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isPty ? (
          <PtyTerminal
            active={terminalActive}
            // Soft-gate only when offline/stopped; do not lock stdin on busy alone.
            disabled={!canSend}
            // PTY master echoes; local echo would double every keystroke.
            localEcho={false}
            className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border/60 bg-muted p-2 shadow-xs"
            onData={(data) => onPtyData?.(data)}
            onResize={(cols, rows) => onPtyResize?.(cols, rows)}
            onReady={onPtyReady}
          />
        ) : (
          <pre
            ref={logPreRef}
            onScroll={onLogScroll}
            className="mcsl-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-xl border border-border/60 bg-muted/50 p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-foreground shadow-xs"
          >
            {logs.length > 0
              ? renderLogLines(logs)
              : t("shared.instance.console.empty")}
          </pre>
        )}

        {showCommandBar ? (
          <div className="flex shrink-0 gap-2">
            <Input
              ref={commandInputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder={t("shared.instance.console.placeholder")}
              disabled={!canSend || busy}
              className="h-8"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              className="size-8 shrink-0"
              disabled={!canSend || busy || !command.trim()}
              onClick={() => onSend()}
              aria-label={t("shared.instance.console.send")}
            >
              <Send className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PanelEmpty({
  symbol,
  title,
  description,
  action,
}: {
  symbol?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center">
      {symbol ? <div className="text-3xl opacity-80">{symbol}</div> : null}
      <div className="space-y-1">
        <p className="text-base font-medium">{title}</p>
        {description ? (
          <p className="max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

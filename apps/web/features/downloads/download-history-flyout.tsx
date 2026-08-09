"use client";

import { History, Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useT } from "@/features/i18n/locale-provider";
import { useDownloads } from "@/features/downloads/download-provider";
import {
  formatDownloadSize,
  formatDownloadSpeed,
} from "@/lib/downloads/manager";
import { cn } from "@/lib/utils";

function statusLabel(t: (key: string) => string, status: string): string {
  switch (status) {
    case "running":
      return t("shared.resource-center.history.status.running");
    case "completed":
      return t("shared.resource-center.history.status.completed");
    case "failed":
      return t("shared.resource-center.history.status.failed");
    case "cancelled":
      return t("shared.resource-center.history.status.cancelled");
    case "queued":
      return t("shared.resource-center.history.status.queued");
    default:
      return status;
  }
}

/** 对齐 WPF DownloadHistoryFlyoutContent */
export function DownloadHistoryFlyout() {
  const t = useT();
  const { tasks, open, setOpen, cancel, remove, clearFinished, activeCount } =
    useDownloads();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="relative"
          aria-label={t("shared.resource-center.history.title")}
          title={t("shared.resource-center.history.title")}
        >
          <History className="size-4" />
          {activeCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {activeCount > 9 ? "9+" : activeCount}
            </span>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(36rem,85vh)] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle>{t("shared.resource-center.history.title")}</DialogTitle>
          <DialogDescription>
            {t("shared.resource-center.history.desc")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-end gap-2 border-b px-5 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => clearFinished()}
          >
            {t("shared.resource-center.history.clear")}
          </Button>
        </div>
        <div className="mcsl-scrollbar max-h-[min(28rem,70vh)] overflow-y-auto p-3">
          {tasks.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              {t("shared.resource-center.history.empty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-xl border bg-card px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {task.fileName}
                      </p>
                      {task.destinationSummary ? (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {task.destinationSummary}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {statusLabel(t, task.status)}
                        {task.status === "running"
                          ? ` · ${formatDownloadSpeed(task.bytesPerSecond)}`
                          : null}
                      </p>
                      {task.localPath ? (
                        <p
                          className="mt-1 truncate text-xs text-muted-foreground"
                          title={task.localPath}
                        >
                          {t("shared.resource-center.history.saved-path")}:{" "}
                          {task.localPath}
                        </p>
                      ) : null}
                      {task.error ? (
                        <p className="mt-1 text-xs text-destructive">
                          {task.error}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {task.status === "running" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t(
                            "shared.resource-center.history.cancel",
                          )}
                          onClick={() => cancel(task.id)}
                        >
                          <X className="size-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t(
                            "shared.resource-center.history.remove",
                          )}
                          onClick={() => remove(task.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-200",
                        task.status === "failed"
                          ? "bg-destructive"
                          : task.status === "completed"
                            ? "bg-emerald-500"
                            : "bg-primary",
                      )}
                      style={{
                        width: `${Math.min(100, Math.max(0, task.progress))}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {formatDownloadSize(task.receivedBytes)}
                      {task.totalBytes > 0
                        ? ` / ${formatDownloadSize(task.totalBytes)}`
                        : ""}
                    </span>
                    {task.status === "running" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : null}
                    {task.error ? (
                      <span className="truncate text-destructive">
                        {task.error}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

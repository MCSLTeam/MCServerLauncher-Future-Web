"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDaemon } from "@/features/nodes/daemon-provider";
import { useT } from "@/features/i18n/locale-provider";
import type { DownloadDestination } from "@/lib/downloads/manager";
import { listNodes } from "@/lib/nodes-store";
import { cn } from "@/lib/utils";

export type DownloadDestinationDialogProps = {
  open: boolean;
  fileName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (destinations: DownloadDestination[]) => void;
};

/**
 * 资源下载目的地：本机 和/或 一个/多个在线守护进程。
 * Web 与 Tauri 共用（Tauri 宿主同一套 Next 控制台）。
 */
export function DownloadDestinationDialog({
  open,
  fileName,
  onOpenChange,
  onConfirm,
}: DownloadDestinationDialogProps) {
  const t = useT();
  const daemon = useDaemon();
  const [local, setLocal] = useState(true);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  const nodes = useMemo(() => listNodes(), [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    setLocal(true);
    const online = nodes
      .filter((n) => daemon.getStatus(n.id) === "online")
      .map((n) => n.id);
    setSelectedNodeIds(online.length === 1 ? [online[0]] : []);
  }, [open, nodes, daemon]);

  const canConfirm = local || selectedNodeIds.length > 0;

  function toggleNode(id: string) {
    setSelectedNodeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function confirm() {
    const destinations: DownloadDestination[] = [];
    if (local) destinations.push({ kind: "local" });
    for (const id of selectedNodeIds) {
      const node = nodes.find((n) => n.id === id);
      destinations.push({
        kind: "daemon",
        nodeId: id,
        nodeName: node?.name ?? id,
      });
    }
    if (destinations.length === 0) return;
    onConfirm(destinations);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("shared.download.dest.title")}</DialogTitle>
          <DialogDescription>
            {t("shared.download.dest.desc", { name: fileName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3">
            <Checkbox
              checked={local}
              onCheckedChange={(v) => setLocal(v === true)}
              className="mt-0.5"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {t("shared.download.dest.local")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("shared.download.dest.local-hint")}
              </p>
            </div>
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {t("shared.download.dest.daemons")}
              </p>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setSelectedNodeIds(
                      nodes
                        .filter((n) => daemon.getStatus(n.id) === "online")
                        .map((n) => n.id),
                    )
                  }
                >
                  {t("shared.download.dest.select-online")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedNodeIds([])}
                >
                  {t("shared.download.dest.clear")}
                </Button>
              </div>
            </div>
            {nodes.length === 0 ? (
              <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                {t("shared.download.dest.no-nodes")}
              </p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-auto">
                {nodes.map((node) => {
                  const online = daemon.getStatus(node.id) === "online";
                  const checked = selectedNodeIds.includes(node.id);
                  return (
                    <li key={node.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2",
                          !online && "opacity-50",
                          checked && "border-primary/50 bg-muted/40",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={!online}
                          onCheckedChange={() => {
                            if (online) toggleNode(node.id);
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {node.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {node.host}:{node.port}
                            {online
                              ? ` · ${t("shared.nodes.status.online")}`
                              : ` · ${t("shared.nodes.status.offline")}`}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              {t("shared.download.dest.daemon-path-hint")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("ui.common.cancel")}
          </Button>
          <Button type="button" disabled={!canConfirm} onClick={confirm}>
            {t("shared.download.dest.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

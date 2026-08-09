"use client";

import { useRef, useState } from "react";
import { MoreHorizontal, Package, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PanelEmpty } from "@/features/console/components/command-panel";
import { cn } from "@/lib/utils";

export type ComponentEntry = {
  name: string;
  enabled: boolean;
  kind: "mods" | "plugins";
  title?: string;
  version?: string;
};

/** WPF ComponentManagerPage: toolbar + Pivot Mods/Plugins + row status/menu */
export function ComponentManagerPanel({
  t,
  canOperate,
  busy,
  loading,
  components,
  hasModsDir,
  hasPluginsDir,
  onRefresh,
  onToggle,
  onDelete,
  onLocate,
  onAddFiles,
}: {
  t: (key: string, params?: Record<string, string | number>) => string;
  canOperate: boolean;
  busy: boolean;
  loading: boolean;
  components: ComponentEntry[];
  hasModsDir: boolean;
  hasPluginsDir: boolean;
  onRefresh: () => void;
  onToggle: (entry: ComponentEntry) => void;
  onDelete: (entry: ComponentEntry) => void;
  onLocate: (entry: ComponentEntry) => void;
  onAddFiles: (kind: "mods" | "plugins", files: FileList | null) => void;
}) {
  const supports = hasModsDir || hasPluginsDir;
  const [tab, setTab] = useState<"mods" | "plugins">(
    hasModsDir ? "mods" : "plugins",
  );
  const fileRef = useRef<HTMLInputElement | null>(null);

  const mods = components.filter((c) => c.kind === "mods");
  const plugins = components.filter((c) => c.kind === "plugins");
  const current = tab === "mods" ? mods : plugins;
  const tabSupported = tab === "mods" ? hasModsDir : hasPluginsDir;

  if (!supports && !loading) {
    return (
      <PanelEmpty
        symbol="📦"
        title={t("shared.instance.components.unsupported-title")}
        description={t("shared.instance.components.unsupported-desc")}
      />
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-3"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (!canOperate || !tabSupported) return;
        onAddFiles(tab, e.dataTransfer.files);
      }}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!canOperate || busy || !tabSupported}
          onClick={() => fileRef.current?.click()}
        >
          <Plus className="size-4" />
          {tab === "mods"
            ? t("shared.instance.components.add-mod")
            : t("shared.instance.components.add-plugin")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".jar"
          multiple
          className="hidden"
          onChange={(e) => {
            onAddFiles(tab, e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={onRefresh}
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          {t("ui.common.refresh")}
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v === "plugins" ? "plugins" : "mods")}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="w-fit">
          <TabsTrigger value="mods" disabled={!hasModsDir}>
            {t("shared.instance.components.mods")}
          </TabsTrigger>
          <TabsTrigger value="plugins" disabled={!hasPluginsDir}>
            {t("shared.instance.components.plugins")}
          </TabsTrigger>
        </TabsList>

        {(["mods", "plugins"] as const).map((key) => (
          <TabsContent
            key={key}
            value={key}
            className="mcsl-scrollbar min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden"
          >
            {(key === "mods" ? mods : plugins).length === 0 ? (
              <PanelEmpty
                symbol="📦"
                title={t("shared.instance.components.empty-title")}
                description={
                  key === "mods"
                    ? t("shared.instance.components.empty-mods")
                    : t("shared.instance.components.empty-plugins")
                }
                action={
                  <Button
                    type="button"
                    size="sm"
                    disabled={!canOperate}
                    onClick={() => {
                      setTab(key);
                      fileRef.current?.click();
                    }}
                  >
                    <Plus className="size-4" />
                    {key === "mods"
                      ? t("shared.instance.components.add-mod")
                      : t("shared.instance.components.add-plugin")}
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-1">
                {(key === "mods" ? mods : plugins).map((entry) => {
                  const title =
                    entry.title ||
                    entry.name
                      .replace(/\.jar(\.disabled)?$/i, "")
                      .replace(/\.disabled$/i, "");
                  const desc = entry.version
                    ? `${entry.name} | v${entry.version}`
                    : entry.name;
                  return (
                    <li
                      key={`${entry.kind}-${entry.name}`}
                      className="flex h-12 items-center gap-3 rounded-xl border bg-card px-3"
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          entry.enabled
                            ? "bg-emerald-500"
                            : "bg-muted-foreground/50",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Package className="size-3.5 shrink-0 opacity-60" />
                          <p className="truncate text-sm font-semibold">
                            {title}
                          </p>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {desc}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" size="icon-sm" variant="ghost">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={busy}
                            onSelect={() => onToggle(entry)}
                          >
                            {entry.enabled
                              ? t("shared.instance.components.disable")
                              : t("shared.instance.components.enable")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onLocate(entry)}>
                            {t("shared.instance.components.locate")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={busy}
                            onSelect={() => onDelete(entry)}
                          >
                            <Trash2 className="size-4" />
                            {t("ui.common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

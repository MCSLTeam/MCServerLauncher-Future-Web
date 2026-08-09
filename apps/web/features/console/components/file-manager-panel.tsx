"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  Download,
  File as FileIcon,
  Folder,
  FolderPlus,
  MoreHorizontal,
  PanelLeft,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUnixSeconds } from "@/features/console/log-utils";
import { PanelEmpty } from "@/features/console/components/command-panel";
import { cn } from "@/lib/utils";

export type DirEntry = {
  name: string;
  kind: "dir" | "file";
  size?: number;
  modified?: number;
};

const ROW_HEIGHT = 40;
const VIRTUAL_THRESHOLD = 80;
const OVERSCAN = 12;
/** Ignore tiny drags so plain clicks still work. */
const MARQUEE_THRESHOLD_PX = 4;

type Rect = { left: number; top: number; right: number; bottom: number };

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(2)} ${units[index]}`;
}

function normalizeRect(
  a: { x: number; y: number },
  b: { x: number; y: number },
): Rect {
  return {
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    right: Math.max(a.x, b.x),
    bottom: Math.max(a.y, b.y),
  };
}

function rectsIntersect(a: Rect, b: Rect) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

type FileRowProps = {
  entry: DirEntry;
  isParent: boolean;
  selected: boolean;
  typeLabel: string;
  modifiedLabel: string;
  sizeLabel: string;
  onToggleSelect: (name: string, multi: boolean) => void;
  onSelectOnly: (name: string) => void;
  onOpen: (entry: DirEntry) => void;
};

const FileRow = memo(function FileRow({
  entry,
  isParent,
  selected,
  typeLabel,
  modifiedLabel,
  sizeLabel,
  onToggleSelect,
  onSelectOnly,
  onOpen,
}: FileRowProps) {
  return (
    <TableRow
      data-file-row={isParent ? undefined : entry.name}
      data-state={selected ? "selected" : undefined}
      className={cn("cursor-default", selected && "bg-muted/50")}
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 40px" }}
      onClick={(e) => {
        if (isParent) return;
        onToggleSelect(entry.name, e.metaKey || e.ctrlKey || e.shiftKey);
      }}
      onContextMenu={() => {
        if (isParent) return;
        if (!selected) onSelectOnly(entry.name);
      }}
      onDoubleClick={() => onOpen(entry)}
    >
      <TableCell className="font-medium">
        <span className="inline-flex items-center gap-2">
          {entry.kind === "dir" ? (
            <Folder className="size-3.5 shrink-0 opacity-70" />
          ) : (
            <FileIcon className="size-3.5 shrink-0 opacity-70" />
          )}
          <span className="truncate">{entry.name}</span>
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {modifiedLabel}
      </TableCell>
      <TableCell className="text-muted-foreground">{typeLabel}</TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {sizeLabel}
      </TableCell>
    </TableRow>
  );
});

type FileManagerPanelProps = {
  t: (key: string, params?: Record<string, string | number>) => string;
  canOperate: boolean;
  busy: boolean;
  virtualPath: string;
  fileEntries: DirEntry[];
  fileError: string | null;
  fileLoading: boolean;
  selectedNames: string[];
  setSelectedNames: (names: string[] | ((prev: string[]) => string[])) => void;
  treeDirs: string[];
  canBack: boolean;
  canForward: boolean;
  uploadProgress: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  onRefresh: () => void;
  onNavigatePath: (path: string) => void;
  onOpenEntry: (entry: DirEntry) => void;
  onTreeNavigate: (path: string) => void;
  onCreateDirectory: () => void;
  onUpload: (files: FileList | null) => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
};

/** WPF FileManagerPage: toolbar + tree 200 + splitter + GridView 4 cols */
export const FileManagerPanel = memo(function FileManagerPanel({
  t,
  canOperate,
  busy,
  virtualPath,
  fileEntries,
  fileError,
  fileLoading,
  selectedNames,
  setSelectedNames,
  treeDirs,
  canBack,
  canForward,
  uploadProgress,
  fileInputRef,
  onBack,
  onForward,
  onUp,
  onRefresh,
  onNavigatePath,
  onOpenEntry,
  onTreeNavigate,
  onCreateDirectory,
  onUpload,
  onDownload,
  onRename,
  onDelete,
}: FileManagerPanelProps) {
  const [pathDraft, setPathDraft] = useState(virtualPath);
  const [treeOpen, setTreeOpen] = useState(false);
  useEffect(() => {
    setPathDraft(virtualPath);
  }, [virtualPath]);

  const selectedSet = useMemo(() => new Set(selectedNames), [selectedNames]);

  const displayEntries = useMemo(
    () =>
      virtualPath !== "/"
        ? ([{ name: "..", kind: "dir" as const }, ...fileEntries] as DirEntry[])
        : fileEntries,
    [virtualPath, fileEntries],
  );

  const entryByName = useMemo(() => {
    const map = new Map<string, DirEntry>();
    for (const e of fileEntries) map.set(e.name, e);
    return map;
  }, [fileEntries]);

  const selected =
    selectedNames.length === 1
      ? (entryByName.get(selectedNames[0]) ?? null)
      : null;

  const selectedFiles = useMemo(
    () =>
      selectedNames
        .map((name) => entryByName.get(name))
        .filter((e): e is DirEntry => Boolean(e && e.kind === "file")),
    [selectedNames, entryByName],
  );
  const canDownload = selectedFiles.length > 0;

  const folderLabel = t("shared.instance.files.type.folder");
  const fileLabel = t("shared.instance.files.type.file");

  const labelsByKey = useMemo(() => {
    const map = new Map<
      string,
      { type: string; modified: string; size: string }
    >();
    for (const entry of displayEntries) {
      const isParent = entry.name === "..";
      map.set(`${entry.kind}:${entry.name}`, {
        type: isParent ? "—" : entry.kind === "dir" ? folderLabel : fileLabel,
        modified:
          isParent || !entry.modified ? "—" : formatUnixSeconds(entry.modified),
        size:
          isParent || entry.kind === "dir" ? "—" : formatBytes(entry.size ?? 0),
      });
    }
    return map;
  }, [displayEntries, folderLabel, fileLabel]);

  const toggleSelect = useCallback(
    (name: string, multi: boolean) => {
      setSelectedNames((prev) => {
        if (multi) {
          return prev.includes(name)
            ? prev.filter((n) => n !== name)
            : [...prev, name];
        }
        return prev.length === 1 && prev[0] === name ? [] : [name];
      });
    },
    [setSelectedNames],
  );

  const selectOnly = useCallback(
    (name: string) => {
      setSelectedNames([name]);
    },
    [setSelectedNames],
  );

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(480);
  const useVirtual = displayEntries.length >= VIRTUAL_THRESHOLD;

  const [marquee, setMarquee] = useState<Rect | null>(null);
  const marqueeRef = useRef<{
    origin: { x: number; y: number };
    additive: boolean;
    base: Set<string>;
    active: boolean;
    pointerId: number;
  } | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !useVirtual) return;
    const ro = new ResizeObserver(() => {
      setViewportH(el.clientHeight || 480);
    });
    ro.observe(el);
    setViewportH(el.clientHeight || 480);
    return () => ro.disconnect();
  }, [useVirtual, fileError]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
  }, []);

  const virtualSlice = useMemo(() => {
    if (!useVirtual) {
      return {
        start: 0,
        end: displayEntries.length,
        padTop: 0,
        padBottom: 0,
      };
    }
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const visible = Math.ceil(viewportH / ROW_HEIGHT) + OVERSCAN * 2;
    const end = Math.min(displayEntries.length, start + visible);
    return {
      start,
      end,
      padTop: start * ROW_HEIGHT,
      padBottom: Math.max(0, (displayEntries.length - end) * ROW_HEIGHT),
    };
  }, [useVirtual, scrollTop, viewportH, displayEntries.length]);

  const visibleEntries = useMemo(
    () => displayEntries.slice(virtualSlice.start, virtualSlice.end),
    [displayEntries, virtualSlice.start, virtualSlice.end],
  );

  const submitPath = useCallback(() => {
    onNavigatePath(pathDraft || "/");
  }, [onNavigatePath, pathDraft]);

  const navigateTree = useCallback(
    (path: string) => {
      onTreeNavigate(path);
      setTreeOpen(false);
    },
    [onTreeNavigate],
  );

  const treeNav = (
    <div className="mcsl-scrollbar h-full min-h-0 overflow-auto p-1.5">
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
          virtualPath === "/"
            ? "bg-primary/10 font-medium"
            : "hover:bg-muted/60",
        )}
        onClick={() => navigateTree("/")}
      >
        <Folder className="size-3.5 shrink-0 opacity-70" />
        <span className="truncate">/</span>
      </button>
      {treeDirs.map((dir) => {
        const path = `/${dir}`;
        const active =
          virtualPath === path || virtualPath.startsWith(`${path}/`);
        return (
          <button
            key={dir}
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
              active ? "bg-primary/10 font-medium" : "hover:bg-muted/60",
            )}
            onClick={() => navigateTree(path)}
          >
            <Folder className="size-3.5 shrink-0 opacity-70" />
            <span className="truncate">{dir}</span>
          </button>
        );
      })}
    </div>
  );

  const applyMarqueeSelection = useCallback(
    (box: Rect, additive: boolean, base: Set<string>) => {
      const root = scrollRef.current;
      if (!root) return;
      const hit = new Set<string>();
      const rows = root.querySelectorAll<HTMLElement>("[data-file-row]");
      for (const row of rows) {
        const name = row.dataset.fileRow;
        if (!name) continue;
        const r = row.getBoundingClientRect();
        const rowRect: Rect = {
          left: r.left,
          top: r.top,
          right: r.right,
          bottom: r.bottom,
        };
        if (rectsIntersect(box, rowRect)) hit.add(name);
      }
      if (additive) {
        const next = new Set(base);
        for (const name of hit) next.add(name);
        setSelectedNames([...next]);
      } else {
        setSelectedNames([...hit]);
      }
    },
    [setSelectedNames],
  );

  const endMarquee = useCallback((pointerId?: number) => {
    const session = marqueeRef.current;
    if (!session) return;
    if (pointerId !== undefined && session.pointerId !== pointerId) return;
    marqueeRef.current = null;
    setMarquee(null);
    try {
      scrollRef.current?.releasePointerCapture(session.pointerId);
    } catch {
      // ignore
    }
  }, []);

  const onListPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, [role='menuitem']")) {
        return;
      }
      const root = scrollRef.current;
      if (!root) return;

      const additive = e.metaKey || e.ctrlKey || e.shiftKey;
      marqueeRef.current = {
        origin: { x: e.clientX, y: e.clientY },
        additive,
        base: additive ? new Set(selectedNames) : new Set(),
        active: false,
        pointerId: e.pointerId,
      };

      const onMove = (ev: PointerEvent) => {
        const session = marqueeRef.current;
        if (!session || session.pointerId !== ev.pointerId) return;
        const dx = ev.clientX - session.origin.x;
        const dy = ev.clientY - session.origin.y;
        if (!session.active && Math.hypot(dx, dy) < MARQUEE_THRESHOLD_PX) {
          return;
        }
        if (!session.active) {
          session.active = true;
          try {
            root.setPointerCapture(ev.pointerId);
          } catch {
            // ignore
          }
          document.body.style.userSelect = "none";
        }
        ev.preventDefault();
        const box = normalizeRect(session.origin, {
          x: ev.clientX,
          y: ev.clientY,
        });
        setMarquee(box);
        applyMarqueeSelection(box, session.additive, session.base);
      };

      const onUp = (ev: PointerEvent) => {
        const session = marqueeRef.current;
        if (!session || session.pointerId !== ev.pointerId) return;
        const wasActive = session.active;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        document.body.style.userSelect = "";
        if (wasActive) {
          const box = normalizeRect(session.origin, {
            x: ev.clientX,
            y: ev.clientY,
          });
          applyMarqueeSelection(box, session.additive, session.base);
          const swallowClick = (clickEv: MouseEvent) => {
            clickEv.preventDefault();
            clickEv.stopPropagation();
            window.removeEventListener("click", swallowClick, true);
          };
          window.addEventListener("click", swallowClick, true);
          window.setTimeout(
            () => window.removeEventListener("click", swallowClick, true),
            0,
          );
        } else if (
          !additive &&
          !(ev.target as HTMLElement | null)?.closest("[data-file-row]")
        ) {
          setSelectedNames([]);
        }
        endMarquee(ev.pointerId);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [applyMarqueeSelection, endMarquee, selectedNames, setSelectedNames],
  );

  const marqueeStyle = useMemo(() => {
    if (!marquee || !scrollRef.current) return null;
    const root = scrollRef.current.getBoundingClientRect();
    return {
      left: marquee.left - root.left + scrollRef.current.scrollLeft,
      top: marquee.top - root.top + scrollRef.current.scrollTop,
      width: marquee.right - marquee.left,
      height: marquee.bottom - marquee.top,
    };
  }, [marquee]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          className="md:hidden"
          onClick={() => setTreeOpen(true)}
          aria-label={t("shared.instance.files.tree-menu")}
          title={t("shared.instance.files.tree-menu")}
        >
          <PanelLeft className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={!canBack || busy}
          onClick={onBack}
          aria-label={t("shared.instance.files.back")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={!canForward || busy}
          onClick={onForward}
          aria-label={t("shared.instance.files.forward")}
        >
          <ArrowRight className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={virtualPath === "/" || busy}
          onClick={onUp}
          aria-label={t("shared.instance.files.up")}
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={busy || !canOperate}
          onClick={onRefresh}
          aria-label={t("ui.common.refresh")}
        >
          <RefreshCw className={cn("size-4", fileLoading && "animate-spin")} />
        </Button>
        <Input
          value={pathDraft}
          onChange={(e) => setPathDraft(e.target.value)}
          className="h-9 min-w-48 flex-1 font-mono text-sm"
          disabled={!canOperate}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitPath();
            }
          }}
        />
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={!canOperate || busy}
          onClick={onCreateDirectory}
          title={t("shared.instance.files.mkdir")}
        >
          <FolderPlus className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={!canOperate || busy}
          onClick={() => fileInputRef.current?.click()}
          title={t("shared.instance.files.upload")}
        >
          <Upload className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={!canDownload || busy || !canOperate}
          onClick={onDownload}
          title={t("shared.instance.files.download")}
          aria-label={t("shared.instance.files.download")}
        >
          <Download className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={!selectedNames.length || busy || !canOperate}
          onClick={onDelete}
          title={t("ui.common.delete")}
          aria-label={t("ui.common.delete")}
        >
          <Trash2 className="size-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => {
            onUpload(e.target.files);
            e.target.value = "";
          }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="icon-sm" variant="outline">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={!selected}
              onSelect={() => selected && onOpenEntry(selected)}
            >
              {t("shared.instance.files.open")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!canDownload || busy}
              onSelect={onDownload}
            >
              <Download className="size-4" />
              {t("shared.instance.files.download")}
              {selectedFiles.length > 1 ? ` (${selectedFiles.length})` : ""}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canOperate || busy}
              onSelect={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              {t("shared.instance.files.upload")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!selected || busy} onSelect={onRename}>
              <Pencil className="size-4" />
              {t("shared.instance.files.rename")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!selectedNames.length || busy}
              onSelect={onDelete}
            >
              <Trash2 className="size-4" />
              {t("ui.common.delete")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!canOperate}
              onSelect={onCreateDirectory}
            >
              <FolderPlus className="size-4" />
              {t("shared.instance.files.mkdir")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onRefresh}>
              <RefreshCw className="size-4" />
              {t("ui.common.refresh")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {uploadProgress ? (
        <p className="shrink-0 text-xs text-muted-foreground">
          {uploadProgress}
        </p>
      ) : null}

      {fileError ? (
        <PanelEmpty
          symbol="⚠"
          title={t("shared.instance.files.error")}
          description={fileError}
          action={
            <Button type="button" size="sm" onClick={onRefresh}>
              {t("ui.common.refresh")}
            </Button>
          }
        />
      ) : (
        <>
          <Sheet open={treeOpen} onOpenChange={setTreeOpen}>
            <SheetContent
              side="left"
              className="w-[min(18rem,calc(100%-2rem))] gap-0 p-0"
            >
              <SheetHeader className="shrink-0">
                <SheetTitle>{t("shared.instance.files.tree-menu")}</SheetTitle>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-hidden">{treeNav}</div>
            </SheetContent>
          </Sheet>

          {/* Single card: tree rail + list, no outer gap/padding between panes. */}
          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border bg-card">
            <aside className="hidden h-full w-50 shrink-0 overflow-hidden border-r md:block">
              {treeNav}
            </aside>

            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div
                  ref={scrollRef}
                  onScroll={useVirtual ? onScroll : undefined}
                  onPointerDown={onListPointerDown}
                  className="mcsl-scrollbar relative min-h-0 min-w-0 flex-1 overflow-auto select-none"
                >
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow>
                        <TableHead className="w-[40%]">
                          {t("shared.instance.files.col.name")}
                        </TableHead>
                        <TableHead className="w-[22%]">
                          {t("shared.instance.files.col.modified")}
                        </TableHead>
                        <TableHead className="w-[18%]">
                          {t("shared.instance.files.col.type")}
                        </TableHead>
                        <TableHead className="w-[20%]">
                          {t("shared.instance.files.col.size")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayEntries.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="h-24 text-center text-muted-foreground"
                          >
                            {fileLoading
                              ? t("ui.common.loading")
                              : t("shared.instance.files.empty")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {useVirtual && virtualSlice.padTop > 0 ? (
                            <TableRow
                              aria-hidden
                              className="border-0 hover:bg-transparent"
                            >
                              <TableCell
                                colSpan={4}
                                className="p-0"
                                style={{ height: virtualSlice.padTop }}
                              />
                            </TableRow>
                          ) : null}
                          {visibleEntries.map((entry) => {
                            const isParent = entry.name === "..";
                            const key = `${entry.kind}:${entry.name}`;
                            const labels = labelsByKey.get(key) ?? {
                              type: "—",
                              modified: "—",
                              size: "—",
                            };
                            return (
                              <FileRow
                                key={key}
                                entry={entry}
                                isParent={isParent}
                                selected={
                                  !isParent && selectedSet.has(entry.name)
                                }
                                typeLabel={labels.type}
                                modifiedLabel={labels.modified}
                                sizeLabel={labels.size}
                                onToggleSelect={toggleSelect}
                                onSelectOnly={selectOnly}
                                onOpen={onOpenEntry}
                              />
                            );
                          })}
                          {useVirtual && virtualSlice.padBottom > 0 ? (
                            <TableRow
                              aria-hidden
                              className="border-0 hover:bg-transparent"
                            >
                              <TableCell
                                colSpan={4}
                                className="p-0"
                                style={{ height: virtualSlice.padBottom }}
                              />
                            </TableRow>
                          ) : null}
                        </>
                      )}
                    </TableBody>
                  </Table>
                  {marqueeStyle ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute z-20 border border-primary/70 bg-primary/15"
                      style={{
                        left: marqueeStyle.left,
                        top: marqueeStyle.top,
                        width: marqueeStyle.width,
                        height: marqueeStyle.height,
                      }}
                    />
                  ) : null}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem
                  disabled={!selected && selectedNames.length === 0}
                  onSelect={() => {
                    const entry =
                      selected ?? entryByName.get(selectedNames[0] ?? "");
                    if (entry) onOpenEntry(entry);
                  }}
                >
                  {t("shared.instance.files.open")}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  disabled={!canDownload || busy || !canOperate}
                  onSelect={onDownload}
                >
                  <Download className="size-4" />
                  {t("shared.instance.files.download")}
                  {selectedFiles.length > 1 ? ` (${selectedFiles.length})` : ""}
                </ContextMenuItem>
                <ContextMenuItem
                  disabled={!canOperate || busy}
                  onSelect={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-4" />
                  {t("shared.instance.files.upload")}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  disabled={!selected || busy || !canOperate}
                  onSelect={onRename}
                >
                  <Pencil className="size-4" />
                  {t("shared.instance.files.rename")}
                </ContextMenuItem>
                <ContextMenuItem
                  variant="destructive"
                  disabled={!selectedNames.length || busy || !canOperate}
                  onSelect={onDelete}
                >
                  <Trash2 className="size-4" />
                  {t("ui.common.delete")}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  disabled={!canOperate || busy}
                  onSelect={onCreateDirectory}
                >
                  <FolderPlus className="size-4" />
                  {t("shared.instance.files.mkdir")}
                </ContextMenuItem>
                <ContextMenuItem disabled={busy} onSelect={onRefresh}>
                  <RefreshCw className="size-4" />
                  {t("ui.common.refresh")}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </>
      )}
    </div>
  );
});

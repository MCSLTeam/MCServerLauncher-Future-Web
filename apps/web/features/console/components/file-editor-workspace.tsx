"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFeedback } from "@/components/ui-feedback";
import { useLocale, useT } from "@/features/i18n/locale-provider";
import { useDaemon } from "@/features/nodes/daemon-provider";
import { useTheme } from "@/features/theme/theme-provider";
import {
  ensureMonacoReady,
  MONACO_THEME_DARK,
  MONACO_THEME_LIGHT,
  refreshMcslMonacoThemes,
} from "@/lib/monaco/setup";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => null,
});

const LARGE_FILE_BYTES = 5 * 1024 * 1024;

const TEXT_EXT =
  /\.(txt|md|log|json|ya?ml|toml|ini|cfg|conf|properties|xml|html?|css|js|mjs|cjs|ts|tsx|jsx|sh|bat|ps1|lang|mcmeta|gitignore|env|service|desktop|properties|yml)$/i;

export function isLikelyTextFile(name: string, size?: number) {
  if (size != null && size > LARGE_FILE_BYTES * 2) return false;
  if (TEXT_EXT.test(name)) return true;
  const base = name.split("/").pop() ?? name;
  return (
    !base.includes(".") ||
    /^(eula|server|ops|whitelist|banned|usercache|commands|spigot|bukkit|paper|purpur)/i.test(
      base,
    )
  );
}

export function languageFromFileName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".json") || lower.endsWith(".mcmeta")) return "json";
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "yaml";
  if (lower.endsWith(".xml") || lower.endsWith(".html") || lower.endsWith(".htm"))
    return "html";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript";
  if (
    lower.endsWith(".js") ||
    lower.endsWith(".jsx") ||
    lower.endsWith(".mjs") ||
    lower.endsWith(".cjs")
  )
    return "javascript";
  if (lower.endsWith(".md")) return "markdown";
  if (lower.endsWith(".sh") || lower.endsWith(".bash")) return "shell";
  if (lower.endsWith(".ps1")) return "powershell";
  if (lower.endsWith(".bat") || lower.endsWith(".cmd")) return "bat";
  if (
    lower.endsWith(".toml") ||
    lower.endsWith(".ini") ||
    lower.endsWith(".cfg") ||
    lower.endsWith(".conf") ||
    lower.endsWith(".properties")
  )
    return "ini";
  if (lower.endsWith(".log") || lower.endsWith(".txt")) return "plaintext";
  return "plaintext";
}

function isDarkDocument() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function FileEditorWorkspace({
  nodeId,
  instanceId,
  filePath,
  fileName,
  fileSize,
}: {
  nodeId: string;
  instanceId: string;
  filePath: string;
  fileName: string;
  fileSize?: number;
}) {
  const t = useT();
  const { confirm } = useFeedback();
  const { locale } = useLocale();
  const { mode } = useTheme();
  const { getStatus, runWithClient, uploadFile } = useDaemon();
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  const contentRef = useRef("");
  const baselineRef = useRef("");
  const cursorRaf = useRef(0);

  const [content, setContent] = useState("");
  const [baseline, setBaseline] = useState("");
  const [loading, setLoading] = useState(true);
  const [monacoReady, setMonacoReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [monacoTheme, setMonacoTheme] = useState<string>(MONACO_THEME_LIGHT);

  const online = nodeId !== "" && getStatus(nodeId) === "online";
  const dirty = content !== baseline;
  const language = useMemo(() => languageFromFileName(fileName), [fileName]);
  const largeWarn = (fileSize ?? 0) > LARGE_FILE_BYTES;

  const editorOptions = useMemo(
    () => ({
      fontSize,
      wordWrap: wordWrap ? ("on" as const) : ("off" as const),
      minimap: { enabled: minimap },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderLineHighlight: "line" as const,
      tabSize: 2,
      padding: { top: 8, bottom: 8 },
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      smoothScrolling: true,
      cursorBlinking: "smooth" as const,
      roundedSelection: true,
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        useShadows: false,
      },
    }),
    [fontSize, wordWrap, minimap],
  );

  // Warm Monaco ASAP in parallel with file download (locale for NLS).
  useEffect(() => {
    let cancelled = false;
    void ensureMonacoReady(locale).then((monaco) => {
      if (cancelled) return;
      refreshMcslMonacoThemes(monaco);
      setMonacoReady(true);
      setMonacoTheme(isDarkDocument() ? MONACO_THEME_DARK : MONACO_THEME_LIGHT);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    const apply = () => {
      void ensureMonacoReady(locale).then((monaco) => {
        refreshMcslMonacoThemes(monaco);
        const next = isDarkDocument() ? MONACO_THEME_DARK : MONACO_THEME_LIGHT;
        setMonacoTheme(next);
        monaco.editor.setTheme(next);
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [mode, locale]);

  useEffect(() => {
    document.title = `${fileName || t("shared.instance.files.editor-title")} · MCSL`;
  }, [fileName, t]);

  const loadFile = useCallback(async () => {
    if (!nodeId || !filePath) {
      setError(t("shared.instance.files.editor-load-failed"));
      setLoading(false);
      return;
    }
    if (!online) {
      setError(t("shared.instance.console.need-connection"));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    // Parallel: download file while Monaco continues loading.
    const [result] = await Promise.all([
      runWithClient(nodeId, (client) => client.downloadFile(filePath)),
      ensureMonacoReady(locale).then(() => null),
    ]);
    if (!result.ok) {
      setLoading(false);
      setError(
        result.message ?? t("shared.instance.files.editor-load-failed"),
      );
      return;
    }
    try {
      const text = await result.data.text();
      contentRef.current = text;
      baselineRef.current = text;
      setContent(text);
      setBaseline(text);
      setError(null);
      const ed = editorRef.current;
      if (ed) {
        const model = ed.getModel();
        if (model && model.getValue() !== text) {
          model.setValue(text);
        }
      }
    } catch {
      setError(t("shared.instance.files.editor-load-failed"));
    } finally {
      setLoading(false);
    }
  }, [nodeId, filePath, online, runWithClient, t, locale]);

  useEffect(() => {
    void loadFile();
  }, [loadFile]);

  const saveFile = useCallback(async () => {
    if (!nodeId || !filePath || saving || loading) return;
    setSaving(true);
    setError(null);
    const current = contentRef.current;
    const blob = new Blob([current], { type: "text/plain;charset=utf-8" });
    const file = new File([blob], fileName || "file.txt", {
      type: "text/plain",
    });
    const result = await uploadFile(nodeId, file, filePath);
    setSaving(false);
    if (!result.ok) {
      setError(
        result.message ?? t("shared.instance.files.editor-save-failed"),
      );
      return;
    }
    baselineRef.current = current;
    setBaseline(current);
  }, [nodeId, filePath, fileName, saving, loading, uploadFile, t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving && !loading && !error) {
          void saveFile();
        }
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setFontSize((v) => Math.min(28, v + 1));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault();
        setFontSize((v) => Math.max(10, v - 1));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault();
        setFontSize(14);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, saving, loading, error, saveFile]);

  async function requestClose() {
    if (dirty) {
      const ok = await confirm({
        description: t("shared.instance.files.editor-unsaved"),
        destructive: true,
        confirmLabel: t("ui.common.confirm"),
        cancelLabel: t("ui.common.cancel"),
      });
      if (!ok) return;
    }
    window.close();
  }

  function insertTimeDate() {
    const ed = editorRef.current;
    if (!ed) return;
    const text = new Date().toLocaleString();
    const selection = ed.getSelection();
    if (!selection) {
      ed.trigger("keyboard", "type", { text });
      return;
    }
    ed.executeEdits("insert-time", [
      {
        range: selection,
        text,
        forceMoveMarkers: true,
      },
    ]);
  }

  const showEditor = monacoReady && !error;
  const showOverlay = loading || !monacoReady;

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/40 px-4 py-2.5">
        <h1 className="truncate text-sm font-medium">
          {t("shared.instance.files.editor-title")}
          {fileName ? (
            <span className="ml-2 font-mono text-muted-foreground">
              {fileName}
            </span>
          ) : null}
        </h1>
        {dirty ? (
          <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
            {t("shared.instance.files.editor-dirty")}
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-border bg-card/20 px-2 py-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
            >
              {t("shared.instance.files.editor-menu-file")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-44">
            <DropdownMenuItem
              disabled={loading || !!error || saving || !dirty || !online}
              onSelect={() => void saveFile()}
            >
              <Save className="size-4" />
              {t("ui.common.save")}
              <span className="ml-auto text-xs text-muted-foreground">
                Ctrl+S
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={loading || saving || !online}
              onSelect={() => void loadFile()}
            >
              {t("shared.instance.files.editor-reload")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              {t("shared.instance.files.editor-encoding")}: UTF-8
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={requestClose}>
              {t("shared.instance.files.editor-exit")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
            >
              {t("shared.instance.files.editor-menu-edit")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-40">
            <DropdownMenuItem
              onSelect={() => editorRef.current?.trigger("menu", "undo", null)}
            >
              {t("shared.instance.files.editor-undo")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => editorRef.current?.trigger("menu", "redo", null)}
            >
              {t("shared.instance.files.editor-redo")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() =>
                editorRef.current?.trigger(
                  "menu",
                  "editor.action.clipboardCutAction",
                  null,
                )
              }
            >
              {t("shared.instance.files.editor-cut")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                editorRef.current?.trigger(
                  "menu",
                  "editor.action.clipboardCopyAction",
                  null,
                )
              }
            >
              {t("shared.instance.files.editor-copy")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                editorRef.current?.trigger(
                  "menu",
                  "editor.action.clipboardPasteAction",
                  null,
                )
              }
            >
              {t("shared.instance.files.editor-paste")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() =>
                editorRef.current?.trigger(
                  "menu",
                  "editor.action.selectAll",
                  null,
                )
              }
            >
              {t("shared.instance.files.editor-select-all")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={insertTimeDate}>
              {t("shared.instance.files.editor-time-date")}
              <span className="ml-auto text-xs text-muted-foreground">F5</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
            >
              {t("shared.instance.files.editor-menu-format")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuCheckboxItem
              checked={wordWrap}
              onCheckedChange={(v) => setWordWrap(Boolean(v))}
            >
              {t("shared.instance.files.editor-word-wrap")}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
            >
              {t("shared.instance.files.editor-menu-view")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-44">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                {t("shared.instance.files.editor-zoom")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onSelect={() => setFontSize((v) => Math.min(28, v + 1))}
                >
                  {t("shared.instance.files.editor-zoom-in")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setFontSize((v) => Math.max(10, v - 1))}
                >
                  {t("shared.instance.files.editor-zoom-out")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setFontSize(14)}>
                  {t("shared.instance.files.editor-zoom-reset")}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuCheckboxItem
              checked={showStatusBar}
              onCheckedChange={(v) => setShowStatusBar(Boolean(v))}
            >
              {t("shared.instance.files.editor-status-bar")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={minimap}
              onCheckedChange={(v) => setMinimap(Boolean(v))}
            >
              {t("shared.instance.files.editor-minimap")}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            className="h-7"
            disabled={loading || !!error || saving || !dirty || !online}
            onClick={() => void saveFile()}
          >
            <Save className="size-3.5" />
            {saving ? t("ui.common.loading") : t("ui.common.save")}
          </Button>
        </div>
      </div>

      {largeWarn ? (
        <p className="shrink-0 border-b border-border bg-amber-500/10 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-200">
          {t("shared.instance.files.editor-large-warn")}
        </p>
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-col bg-background">
        {error ? (
          <div className="m-4 space-y-3">
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void loadFile()}
            >
              {t("shared.instance.files.editor-reload")}
            </Button>
          </div>
        ) : null}

        {showEditor ? (
          <div
            className={cn(
              "monaco-shadcn min-h-0 flex-1 overflow-hidden",
              error && "hidden",
            )}
          >
            <MonacoEditor
              height="100%"
              language={language}
              theme={monacoTheme}
              defaultValue={content}
              onChange={(value) => {
                const next = value ?? "";
                contentRef.current = next;
                setContent(next);
              }}
              onMount={(ed, monaco) => {
                editorRef.current = ed;
                refreshMcslMonacoThemes(monaco);
                monaco.editor.setTheme(
                  isDarkDocument() ? MONACO_THEME_DARK : MONACO_THEME_LIGHT,
                );
                // If file finished loading before mount, push content into model.
                if (contentRef.current && ed.getValue() !== contentRef.current) {
                  ed.setValue(contentRef.current);
                }
                ed.onDidChangeCursorPosition((e) => {
                  if (cursorRaf.current) return;
                  cursorRaf.current = window.requestAnimationFrame(() => {
                    cursorRaf.current = 0;
                    setCursor({
                      line: e.position.lineNumber,
                      col: e.position.column,
                    });
                  });
                });
              }}
              options={editorOptions}
              loading={null}
            />
          </div>
        ) : null}

        {showOverlay && !error ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-[1px]">
            <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              {!monacoReady
                ? t("shared.instance.files.editor-loading-monaco")
                : t("ui.common.loading")}
            </p>
          </div>
        ) : null}
      </div>

      {showStatusBar ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card/30 px-3 py-1.5 text-[11px] text-muted-foreground">
          <span className="min-w-0 truncate font-mono" title={filePath}>
            {filePath || fileName}
          </span>
          <span className="shrink-0 tabular-nums">
            {t("shared.instance.files.editor-cursor", {
              line: cursor.line,
              col: cursor.col,
            })}
            <span className="mx-2 opacity-40">|</span>
            {language}
            <span className="mx-2 opacity-40">|</span>
            UTF-8
            <span className="mx-2 opacity-40">|</span>
            {dirty
              ? t("shared.instance.files.editor-dirty")
              : t("shared.instance.files.editor-clean")}
            {instanceId ? (
              <>
                <span className="mx-2 opacity-40">|</span>
                {instanceId}
              </>
            ) : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}

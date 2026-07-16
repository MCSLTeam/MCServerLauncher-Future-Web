"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { FileEditorWorkspace } from "@/features/console/components/file-editor-workspace";
import { useT } from "@/features/i18n/locale-provider";

function FileEditorPageInner() {
  const t = useT();
  const search = useSearchParams();
  const nodeId = search.get("node")?.trim() || "";
  const instanceId = search.get("id")?.trim() || "";
  const filePath = search.get("path")?.trim() || "";
  const fileName =
    search.get("name")?.trim() ||
    filePath.split("/").filter(Boolean).pop() ||
    "";
  const sizeRaw = search.get("size");
  const fileSize =
    sizeRaw != null && sizeRaw !== "" && Number.isFinite(Number(sizeRaw))
      ? Number(sizeRaw)
      : undefined;

  if (!nodeId || !filePath) {
    return (
      <div className="flex h-dvh items-center justify-center p-6 text-sm text-muted-foreground">
        {t("shared.instance.files.editor-load-failed")}
      </div>
    );
  }

  return (
    <FileEditorWorkspace
      nodeId={nodeId}
      instanceId={instanceId}
      filePath={filePath}
      fileName={fileName}
      fileSize={fileSize}
    />
  );
}

export default function FileEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">
          …
        </div>
      }
    >
      <FileEditorPageInner />
    </Suspense>
  );
}

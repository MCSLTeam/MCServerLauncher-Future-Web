"use client";

import { invokeTauri, isTauriRuntime } from "@/lib/tauri-runtime";

/**
 * 对齐 WPF BuildSystemWindowTitle：
 * `{ConsoleTitle} - 实例 [{name}] - 节点 [{node}]`
 */
export function buildInstanceConsoleWindowTitle(
  t: (key: string, params?: Record<string, string | number>) => string,
  instanceName: string,
  nodeName: string,
) {
  const name = instanceName.trim() || "—";
  const node = nodeName.trim() || "—";
  return `${t("shared.instance.console.title")} - ${t(
    "shared.instance.console.title.instance",
    { name },
  )} - ${t("shared.instance.console.title.node", { name: node })}`;
}

export function instanceDetailPath(
  instanceId: string,
  nodeId: string,
  options?: { windowMode?: boolean },
) {
  const params = new URLSearchParams({
    id: instanceId,
    node: nodeId,
  });
  if (options?.windowMode) {
    params.set("view", "window");
  }
  return `/instances/detail/?${params.toString()}`;
}

/**
 * 对齐 WPF Instance.InitializeNewInstanceConsole：
 * Tauri 开独立子窗口；Web 返回 false 由调用方路由内打开。
 */
export async function openInstanceConsole(options: {
  instanceId: string;
  nodeId: string;
  title?: string;
}): Promise<{ openedAsWindow: boolean }> {
  if (!isTauriRuntime()) {
    return { openedAsWindow: false };
  }
  await invokeTauri("open_instance_console", {
    instanceId: options.instanceId,
    nodeId: options.nodeId,
    title: options.title ?? null,
  });
  return { openedAsWindow: true };
}

export function fileEditorPath(options: {
  instanceId: string;
  nodeId: string;
  filePath: string;
  fileName: string;
  fileSize?: number;
}) {
  const params = new URLSearchParams({
    id: options.instanceId,
    node: options.nodeId,
    path: options.filePath,
    name: options.fileName,
    view: "window",
  });
  if (options.fileSize != null && Number.isFinite(options.fileSize)) {
    params.set("size", String(options.fileSize));
  }
  return `/instances/file-editor/?${params.toString()}`;
}

/**
 * 对齐 WPF FileEditorWindow：独立窗口 + Monaco。
 * Tauri 开 Webview 子窗口；浏览器用 window.open。
 */
export async function openFileEditorWindow(options: {
  instanceId: string;
  nodeId: string;
  filePath: string;
  fileName: string;
  fileSize?: number;
  title?: string;
}): Promise<{ openedAsWindow: boolean }> {
  const path = fileEditorPath(options);
  if (isTauriRuntime()) {
    await invokeTauri("open_file_editor", {
      instanceId: options.instanceId,
      nodeId: options.nodeId,
      filePath: options.filePath,
      fileName: options.fileName,
      fileSize: options.fileSize ?? null,
      title: options.title ?? options.fileName ?? null,
    });
    return { openedAsWindow: true };
  }

  const features =
    "popup=yes,width=1100,height=760,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes";
  const label = `mcsl-file-editor-${options.instanceId}-${options.filePath}`.slice(
    0,
    96,
  );
  const opened = window.open(path, label, features);
  if (opened) {
    try {
      opened.focus();
    } catch {
      /* ignore */
    }
    return { openedAsWindow: true };
  }
  // 弹窗被拦截时退到当前标签
  window.location.assign(path);
  return { openedAsWindow: false };
}

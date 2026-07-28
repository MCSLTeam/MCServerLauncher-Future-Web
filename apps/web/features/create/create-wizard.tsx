"use client";

import { FileUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Reveal } from "@/components/motion/reveal";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  ConsolePage,
  ConsolePageHeader,
} from "@/components/templates/console-surface";
import { Badge } from "@/components/ui/badge";
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { JvmArgHelperDialog } from "@/features/create/components/jvm-arg-helper-dialog";
import { StepCard } from "@/features/create/components/step-card";
import { useT } from "@/features/i18n/locale-provider";
import { useDaemon } from "@/features/nodes/daemon-provider";
import {
  filterNeoForgeVersionsForMc,
  listFabricLoaderVersions,
  listFabricMinecraftVersions,
  listForgeBuilds,
  listForgeMinecraftVersions,
  listNeoForgeData,
  listQuiltLoaderVersions,
  listQuiltMinecraftVersions,
} from "@/lib/create/install-source";
import {
  buildArchiveLikeSetting,
  buildFabricSetting,
  buildForgeSetting,
  buildMcJavaSetting,
  buildNeoForgeSetting,
  buildQuiltSetting,
} from "@/lib/create/settings-builders";
import type {
  CreateCategory,
  CreateCoreType,
  JavaInfo,
} from "@/lib/create/types";
import {
  CREATE_CATEGORIES,
  getTypesForCategory,
  isCreateTypeSubmittable,
} from "@/lib/create/types";
import {
  parseJvmArgs,
  tryValidateInstanceName,
  tryValidateJavaPath,
  tryValidateLoaderVersion,
  tryValidateLocalJarFile,
} from "@/lib/create/validation";
import { hydrateNodes, listNodes, nodeAddress } from "@/lib/nodes-store";
import type { SavedNode } from "@/lib/types";
import { cn } from "@/lib/utils";

function LabeledField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
    </Field>
  );
}

type NavStep = "node" | "category" | "type" | "settings";

/**
 * 对齐 WPF：
 * - PreCreate：分类/类型卡片导航
 * - Provider 页：纵向 step cards（核心/加载器、Java、JVM 参数、名称）
 * - JVM 助手 / 创建确认：Dialog
 */
export function CreateWizard() {
  const t = useT();
  const router = useRouter();
  const daemon = useDaemon();

  const [nodes, setNodes] = useState<SavedNode[]>([]);
  const [nav, setNav] = useState<NavStep>("node");
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [category, setCategory] = useState<CreateCategory | null>(null);
  const [coreType, setCoreType] = useState<CreateCoreType>("mcje");

  const [name, setName] = useState("");
  const [javaPath, setJavaPath] = useState("");
  const [javaList, setJavaList] = useState<JavaInfo[]>([]);
  const [javaLoading, setJavaLoading] = useState(false);
  /** JVM 参数列表（对齐 WPF ArgsListView） */
  const [jvmArgItems, setJvmArgItems] = useState<string[]>([""]);
  const [jvmHelperOpen, setJvmHelperOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [coreFile, setCoreFile] = useState<File | null>(null);
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const coreFileInputRef = useRef<HTMLInputElement>(null);
  const archiveFileInputRef = useRef<HTMLInputElement>(null);
  const [runCommand, setRunCommand] = useState("");

  const [useMirror, setUseMirror] = useState(true);
  const [onlyStable, setOnlyStable] = useState(true);
  const [mcVersions, setMcVersions] = useState<string[]>([]);
  const [loaderVersions, setLoaderVersions] = useState<string[]>([]);
  const [mcVersion, setMcVersion] = useState("");
  const [loaderVersion, setLoaderVersion] = useState("");
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [neoAll, setNeoAll] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void hydrateNodes().then((items) => {
      if (!cancelled) setNodes(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === nodeId) ?? null,
    [nodes, nodeId],
  );
  const nodeOnline = nodeId ? daemon.getStatus(nodeId) === "online" : false;

  const needsLoader =
    coreType === "forge" ||
    coreType === "neoforge" ||
    coreType === "fabric" ||
    coreType === "quilt";
  const needsJar = coreType === "mcje";
  const needsJvm =
    coreType === "mcje" ||
    coreType === "forge" ||
    coreType === "neoforge" ||
    coreType === "fabric" ||
    coreType === "quilt";
  const needsArchive =
    coreType === "mcbe" || coreType === "terraria" || coreType === "universal";

  const jvmArgsText = useMemo(
    () => jvmArgItems.map((s) => s.trim()).filter(Boolean).join(" "),
    [jvmArgItems],
  );

  const stepCoreFinished = useMemo(() => {
    if (needsJar) return Boolean(coreFile);
    if (needsLoader) return Boolean(mcVersion && loaderVersion);
    if (needsArchive) {
      if (coreType === "universal") {
        return Boolean(runCommand.trim() || archiveFile);
      }
      return Boolean(archiveFile);
    }
    return true;
  }, [
    archiveFile,
    coreFile,
    coreType,
    loaderVersion,
    mcVersion,
    needsArchive,
    needsJar,
    needsLoader,
    runCommand,
  ]);

  const stepJavaFinished = useMemo(() => {
    if (!needsJvm) return true;
    return tryValidateJavaPath(javaPath).ok;
  }, [javaPath, needsJvm]);

  const stepJvmFinished = true; // WPF：JVM 参数可选，恒完成
  const stepNameFinished = tryValidateInstanceName(name).ok;

  const canFinish =
    isCreateTypeSubmittable(coreType) &&
    stepCoreFinished &&
    stepJavaFinished &&
    stepJvmFinished &&
    stepNameFinished &&
    !submitting;

  const loadJava = useCallback(
    async (id: string) => {
      setJavaLoading(true);
      try {
        const result = await daemon.getJavaList(id);
        if (result.ok && result.javaList) {
          setJavaList(result.javaList);
          if (!javaPath && result.javaList[0]?.path) {
            setJavaPath(result.javaList[0].path);
          }
        }
      } finally {
        setJavaLoading(false);
      }
    },
    [daemon, javaPath],
  );

  useEffect(() => {
    if (nav === "settings" && nodeId && needsJvm) {
      void loadJava(nodeId);
    }
  }, [nav, nodeId, needsJvm, loadJava]);

  const loadVersions = useCallback(async () => {
    if (!needsLoader) return;
    setVersionsLoading(true);
    setError(null);
    try {
      if (coreType === "forge") {
        const mcs = await listForgeMinecraftVersions(useMirror);
        setMcVersions(mcs);
        if (!mcVersion && mcs[0]) setMcVersion(mcs[0]);
      } else if (coreType === "fabric") {
        const mcs = await listFabricMinecraftVersions(useMirror, onlyStable);
        setMcVersions(mcs.map((v) => v.version));
        if (!mcVersion && mcs[0]) setMcVersion(mcs[0].version);
        const loaders = await listFabricLoaderVersions(useMirror, onlyStable);
        setLoaderVersions(loaders.map((v) => v.version));
        if (!loaderVersion && loaders[0]) setLoaderVersion(loaders[0].version);
      } else if (coreType === "neoforge") {
        const data = await listNeoForgeData(useMirror);
        setMcVersions(data.minecraftVersions);
        setNeoAll(data.neoForgeVersions);
        if (!mcVersion && data.minecraftVersions[0]) {
          setMcVersion(data.minecraftVersions[0]);
        }
      } else if (coreType === "quilt") {
        const mcs = await listQuiltMinecraftVersions(useMirror, onlyStable);
        setMcVersions(mcs.map((v) => v.version));
        if (!mcVersion && mcs[0]) setMcVersion(mcs[0].version);
        const loaders = await listQuiltLoaderVersions(useMirror);
        setLoaderVersions(loaders);
        if (!loaderVersion && loaders[0]) setLoaderVersion(loaders[0]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setVersionsLoading(false);
    }
  }, [
    coreType,
    loaderVersion,
    mcVersion,
    needsLoader,
    onlyStable,
    useMirror,
  ]);

  useEffect(() => {
    if (nav === "settings" && needsLoader) {
      void loadVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav, coreType, useMirror, onlyStable]);

  useEffect(() => {
    if (coreType !== "forge" || !mcVersion) return;
    let cancelled = false;
    void (async () => {
      try {
        const builds = await listForgeBuilds(mcVersion, useMirror);
        if (cancelled) return;
        setLoaderVersions(builds);
        if (builds[0]) setLoaderVersion(builds[0]);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coreType, mcVersion, useMirror]);

  useEffect(() => {
    if (coreType !== "neoforge" || !mcVersion) return;
    const filtered = filterNeoForgeVersionsForMc(mcVersion, neoAll);
    setLoaderVersions(filtered);
    if (filtered[0]) setLoaderVersion(filtered[0]);
  }, [coreType, mcVersion, neoAll]);

  function insertJvmHelperArgs(args: string[]) {
    setJvmArgItems((prev) => {
      const filled = prev.map((s) => s.trim()).filter(Boolean);
      return [...filled, ...args, ""];
    });
  }

  async function doCreate() {
    setError(null);
    setMessage(null);
    if (!selectedNode || !nodeId) {
      setError(t("shared.create.need-node.title"));
      return;
    }
    const nameCheck = tryValidateInstanceName(name);
    if (!nameCheck.ok) {
      setError(nameCheck.error);
      return;
    }
    if (!isCreateTypeSubmittable(coreType)) {
      setError(t("shared.create.validation.not-ready"));
      return;
    }

    setSubmitting(true);
    setUploadProgress(null);
    try {
      if (!nodeOnline) {
        const connected = await daemon.connectNode(nodeId);
        if (!connected.ok) {
          throw new Error(
            connected.message || t("shared.create.submit.blocked"),
          );
        }
      }

      const args = parseJvmArgs(jvmArgsText);

      if (needsJvm) {
        const javaCheck = tryValidateJavaPath(javaPath);
        if (!javaCheck.ok) throw new Error(javaCheck.error);
      }

      if (needsLoader) {
        const loaderCheck = tryValidateLoaderVersion(mcVersion, loaderVersion);
        if (!loaderCheck.ok) throw new Error(loaderCheck.error);
      }

      if (needsJar) {
        const jarCheck = tryValidateLocalJarFile(coreFile);
        if (!jarCheck.ok) throw new Error(jarCheck.error);
      }

      let setting;
      if (coreType === "mcje" && coreFile) {
        const dst = `caches/downloads/${coreFile.name}`;
        setMessage(t("shared.create.status.uploading"));
        const upload = await daemon.uploadFile(
          nodeId,
          coreFile,
          dst,
          (p) =>
            setUploadProgress(
              p.total > 0 ? Math.round((p.loaded / p.total) * 100) : 0,
            ),
        );
        if (!upload.ok || !upload.path) {
          throw new Error(
            upload.message || t("shared.create.status.upload-failed"),
          );
        }
        setting = buildMcJavaSetting({
          name: name.trim(),
          javaPath: javaPath.trim(),
          arguments: args,
          source: upload.path,
          targetFileName: coreFile.name,
        });
      } else if (coreType === "forge") {
        setting = buildForgeSetting({
          name: name.trim(),
          javaPath: javaPath.trim(),
          arguments: args,
          mcVersion,
          forgeVersion: loaderVersion,
          useMirror,
        });
      } else if (coreType === "fabric") {
        setting = buildFabricSetting({
          name: name.trim(),
          javaPath: javaPath.trim(),
          arguments: args,
          mcVersion,
          fabricVersion: loaderVersion,
          useMirror,
        });
      } else if (coreType === "neoforge") {
        setting = buildNeoForgeSetting({
          name: name.trim(),
          javaPath: javaPath.trim(),
          arguments: args,
          mcVersion,
          neoForgeVersion: loaderVersion,
          useMirror,
        });
      } else if (coreType === "quilt") {
        setting = buildQuiltSetting({
          name: name.trim(),
          javaPath: javaPath.trim(),
          arguments: args,
          mcVersion,
          quiltVersion: loaderVersion,
          useMirror,
        });
      } else if (needsArchive) {
        if (!archiveFile && coreType !== "universal") {
          throw new Error(t("shared.create.validation.archive"));
        }
        if (coreType === "universal" && !runCommand.trim() && !archiveFile) {
          throw new Error(t("shared.create.validation.run-or-file"));
        }
        let source = "";
        let targetFileName = runCommand.trim() || "run.sh";
        if (archiveFile) {
          const dst = `caches/downloads/${archiveFile.name}`;
          setMessage(t("shared.create.status.uploading"));
          const upload = await daemon.uploadFile(
            nodeId,
            archiveFile,
            dst,
            (p) =>
              setUploadProgress(
                p.total > 0 ? Math.round((p.loaded / p.total) * 100) : 0,
              ),
          );
          if (!upload.ok || !upload.path) {
            throw new Error(
              upload.message || t("shared.create.status.upload-failed"),
            );
          }
          source = upload.path;
          targetFileName = archiveFile.name;
        } else {
          source = runCommand.trim();
        }
        setting = buildArchiveLikeSetting({
          name: name.trim(),
          javaPath: javaPath.trim(),
          arguments: args.length ? args : parseJvmArgs(runCommand),
          type: coreType,
          source,
          targetFileName,
          targetType:
            coreType === "terraria"
              ? "script"
              : coreType === "universal"
                ? "executable"
                : "archive",
        });
      } else {
        throw new Error(t("shared.create.validation.unsupported"));
      }

      setMessage(t("shared.create.status.creating"));
      const created = await daemon.addInstance(nodeId, setting);
      if (!created.ok) {
        throw new Error(created.message || t("shared.create.status.failed"));
      }
      setMessage(t("shared.create.status.success"));
      window.setTimeout(() => {
        router.push("/instances/");
      }, 800);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setMessage(null);
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
      setConfirmOpen(false);
    }
  }

  if (nodes.length === 0) {
    return (
      <ConsolePage className="min-h-0 flex-1">
        <Reveal>
          <ConsolePageHeader
            title={t("shared.create.title")}
            subtitle={t("shared.create.subtitle")}
          />
        </Reveal>
        <Reveal
          className="mcsl-scrollbar min-h-0 flex-1 overflow-y-auto"
          delay={0.04}
        >
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{t("shared.create.need-node.title")}</EmptyTitle>
              <EmptyDescription>
                {t("shared.create.need-node.desc")}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/nodes/">{t("shared.nodes.title")}</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </Reveal>
      </ConsolePage>
    );
  }

  const navSteps: { key: NavStep; label: string }[] = [
    { key: "node", label: t("shared.create.daemon.title") },
    { key: "category", label: t("shared.create.category.title") },
    { key: "type", label: t("shared.create.type.title") },
    { key: "settings", label: t("shared.create.settings.title") },
  ];

  return (
    <ConsolePage className="min-h-0 flex-1">
      <Reveal>
        <ConsolePageHeader
          title={t("shared.create.title")}
          subtitle={t("shared.create.subtitle")}
        />
      </Reveal>

      <Reveal delay={0.04}>
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          {navSteps.map((item, index) => (
            <Badge
              key={item.key}
              variant={nav === item.key ? "default" : "secondary"}
            >
              {index + 1}. {item.label}
            </Badge>
          ))}
        </div>
      </Reveal>

      {error ? (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-3 text-sm text-muted-foreground" role="status">
          {message}
          {uploadProgress != null ? ` (${uploadProgress}%)` : null}
        </p>
      ) : null}

      {/* —— 选 Daemon（对齐 SelectDaemon dialog 内容，以卡片列表呈现） —— */}
      {nav === "node" ? (
        <Reveal
          className="mcsl-scrollbar min-h-0 flex-1 overflow-y-auto pr-1"
          delay={0.06}
        >
          <div className="flex flex-col gap-3">
            {nodes.map((node) => {
              const status = daemon.getStatus(node.id);
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => {
                    setNodeId(node.id);
                    setNav("category");
                    setError(null);
                    void daemon.connectNode(node.id);
                  }}
                  className={cn(
                    "rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40",
                    nodeId === node.id && "border-primary bg-muted/30",
                  )}
                >
                  <span className="font-medium">{node.name}</span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {nodeAddress(node)} · {t(`shared.nodes.status.${status}`)}
                  </p>
                </button>
              );
            })}
          </div>
        </Reveal>
      ) : null}

      {/* —— 分类卡片 —— */}
      {nav === "category" ? (
        <Reveal
          className="mcsl-scrollbar min-h-0 flex-1 overflow-y-auto pr-1"
          delay={0.06}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {CREATE_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!item.enabled}
                onClick={() => {
                  if (!item.enabled) return;
                  setCategory(item.id);
                  setError(null);
                  if (item.id === "minecraft" || item.id === "frp") {
                    const firstEnabled =
                      getTypesForCategory(item.id).find((x) => x.enabled)?.id ??
                      getTypesForCategory(item.id)[0]?.id;
                    if (firstEnabled) setCoreType(firstEnabled);
                    setNav("type");
                    return;
                  }
                  if (item.id === "terraria") {
                    setCoreType("terraria");
                    setNav("settings");
                    return;
                  }
                  if (item.id === "other") {
                    setCoreType("universal");
                    setNav("settings");
                  }
                }}
                className={cn(
                  "rounded-xl border bg-card p-5 text-left transition-colors",
                  item.enabled
                    ? "hover:border-primary/40 hover:bg-muted/20"
                    : "cursor-not-allowed opacity-55",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{t(item.labelKey)}</h3>
                  {!item.enabled ? (
                    <Badge variant="secondary">
                      {t("shared.create.badge.not-ready")}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(item.descKey)}
                </p>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNav("node")}
            >
              {t("shared.create.back")}
            </Button>
          </div>
        </Reveal>
      ) : null}

      {/* —— 类型卡片 —— */}
      {nav === "type" && category ? (
        <Reveal
          className="mcsl-scrollbar min-h-0 flex-1 overflow-y-auto pr-1"
          delay={0.06}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {getTypesForCategory(category).map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!item.enabled}
                onClick={() => {
                  if (!item.enabled) return;
                  setCoreType(item.id);
                  setMcVersion("");
                  setLoaderVersion("");
                  setLoaderVersions([]);
                  setMcVersions([]);
                  setNav("settings");
                }}
                className={cn(
                  "rounded-xl border bg-card p-4 text-left transition-colors",
                  item.enabled
                    ? "hover:border-primary/40"
                    : "cursor-not-allowed opacity-55",
                  coreType === item.id && item.enabled && "border-primary",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{t(item.labelKey)}</span>
                  {!item.enabled ? (
                    <Badge variant="secondary">
                      {t("shared.create.badge.not-ready")}
                    </Badge>
                  ) : !item.submittable ? (
                    <Badge variant="secondary">
                      {t("shared.create.badge.partial")}
                    </Badge>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNav("category")}
            >
              {t("shared.create.back")}
            </Button>
          </div>
        </Reveal>
      ) : null}

      {/* —— Provider：纵向 step cards —— */}
      {nav === "settings" ? (
        <Reveal
          className="mcsl-scrollbar min-h-0 flex-1 overflow-y-auto pr-1"
          delay={0.06}
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {t(`shared.create.type.${coreType}`)}
              {selectedNode ? ` · ${selectedNode.name}` : null}
            </p>

            {/* Step: 核心 / 加载器 / 归档 */}
            <StepCard
              title={
                needsLoader
                  ? t("shared.create.step.loader.title")
                  : needsJar
                    ? t("shared.create.step.core.title")
                    : needsArchive
                      ? t("shared.create.step.archive.title")
                      : t("shared.create.step.core.title")
              }
              description={
                needsLoader
                  ? t("shared.create.step.loader.desc")
                  : needsJar
                    ? t("shared.create.step.core.desc")
                    : t("shared.create.step.archive.desc")
              }
              finished={stepCoreFinished}
            >
              {needsJar ? (
                <LabeledField
                  label={t("shared.create.field.core-jar.label")}
                  htmlFor="core-jar"
                >
                  <input
                    ref={coreFileInputRef}
                    id="core-jar"
                    type="file"
                    accept=".jar,application/java-archive"
                    className="hidden"
                    onChange={(e) => setCoreFile(e.target.files?.[0] ?? null)}
                  />
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => coreFileInputRef.current?.click()}
                    >
                      <FileUp className="size-4" />
                      {t("shared.create.field.choose-file")}
                    </Button>
                    <span
                      className="min-w-0 truncate text-sm text-muted-foreground"
                      title={coreFile?.name}
                    >
                      {coreFile?.name ?? t("shared.create.field.file-none")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("shared.create.field.core-jar.hint")}{" "}
                    <Link
                      href="/resource-center/"
                      className="underline underline-offset-2"
                    >
                      {t("shared.resource-center.wpf-title")}
                    </Link>
                  </p>
                </LabeledField>
              ) : null}

              {needsArchive ? (
                <>
                  <LabeledField
                    label={t("shared.create.field.archive")}
                    htmlFor="archive"
                  >
                    <input
                      ref={archiveFileInputRef}
                      id="archive"
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        setArchiveFile(e.target.files?.[0] ?? null)
                      }
                    />
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => archiveFileInputRef.current?.click()}
                      >
                        <FileUp className="size-4" />
                        {t("shared.create.field.choose-file")}
                      </Button>
                      <span
                        className="min-w-0 truncate text-sm text-muted-foreground"
                        title={archiveFile?.name}
                      >
                        {archiveFile?.name ??
                          t("shared.create.field.file-none")}
                      </span>
                    </div>
                  </LabeledField>
                  {coreType === "universal" ? (
                    <LabeledField
                      label={t("shared.create.run-command.label")}
                      htmlFor="run-cmd"
                    >
                      <Textarea
                        id="run-cmd"
                        value={runCommand}
                        onChange={(e) => setRunCommand(e.target.value)}
                        rows={3}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("shared.create.run-command.desc")}
                      </p>
                    </LabeledField>
                  ) : null}
                </>
              ) : null}

              {needsLoader ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <LabeledField label={t("shared.create.field.mc-version")}>
                    <Select
                      value={mcVersion}
                      onValueChange={setMcVersion}
                      disabled={versionsLoading || mcVersions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            versionsLoading
                              ? t("shared.create.status.loading-versions")
                              : t("shared.create.field.select")
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {mcVersions.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </LabeledField>
                  <LabeledField label={t("shared.create.field.loader-version")}>
                    <Select
                      value={loaderVersion}
                      onValueChange={setLoaderVersion}
                      disabled={
                        versionsLoading || loaderVersions.length === 0
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("shared.create.field.select")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {loaderVersions.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </LabeledField>
                  <label className="flex items-center gap-2 text-sm md:col-span-2">
                    <Checkbox
                      checked={useMirror}
                      onCheckedChange={(v) => setUseMirror(Boolean(v))}
                    />
                    {t("shared.create.field.use-mirror")}
                  </label>
                  {(coreType === "fabric" || coreType === "quilt") && (
                    <label className="flex items-center gap-2 text-sm md:col-span-2">
                      <Checkbox
                        checked={onlyStable}
                        onCheckedChange={(v) => setOnlyStable(Boolean(v))}
                      />
                      {t("shared.create.field.only-stable")}
                    </label>
                  )}
                </div>
              ) : null}
            </StepCard>

            {/* Step: Java */}
            {needsJvm ? (
              <StepCard
                title={t("shared.create.step.java.title")}
                description={t("shared.create.step.java.desc")}
                finished={stepJavaFinished}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => nodeId && void loadJava(nodeId)}
                  >
                    {t("shared.create.field.java.refresh")}
                  </Button>
                }
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select
                    value={javaPath || undefined}
                    onValueChange={setJavaPath}
                    disabled={javaLoading}
                  >
                    <SelectTrigger className="sm:max-w-md">
                      <SelectValue
                        placeholder={
                          javaLoading
                            ? t("shared.create.status.loading-java")
                            : t("shared.create.field.java.select")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {javaList.map((item) => (
                        <SelectItem key={item.path} value={item.path}>
                          {`(${item.version}, ${item.architecture}) ${item.path}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={javaPath}
                    onChange={(e) => setJavaPath(e.target.value)}
                    placeholder={t("shared.create.field.java.manual")}
                  />
                </div>
              </StepCard>
            ) : null}

            {/* Step: JVM 参数（助手为 Dialog） */}
            {needsJvm ? (
              <StepCard
                title={t("shared.create.step.jvm.title")}
                description={t("shared.create.step.jvm.desc")}
                finished={stepJvmFinished}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setJvmHelperOpen(true)}
                  >
                    {t("shared.create.jvm-helper.title")}
                  </Button>
                }
              >
                <div className="flex flex-col gap-2">
                  {jvmArgItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const next = [...jvmArgItems];
                          next[index] = e.target.value;
                          setJvmArgItems(next);
                        }}
                        placeholder="-Xms1024M"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={jvmArgItems.length <= 1}
                        onClick={() =>
                          setJvmArgItems((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                      >
                        {t("shared.create.jvm-arg.remove")}
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => setJvmArgItems((prev) => [...prev, ""])}
                  >
                    {t("shared.create.jvm-arg.add")}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {t("shared.create.step.jvm.no-jar-tip")}
                  </p>
                </div>
              </StepCard>
            ) : null}

            {/* Step: 实例名称 */}
            <StepCard
              title={t("shared.create.step.name.title")}
              description={t("shared.create.step.name.desc")}
              finished={stepNameFinished}
            >
              <LabeledField
                label={t("shared.create.field.name.label")}
                htmlFor="instance-name"
              >
                <Input
                  id="instance-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("shared.create.field.name.placeholder")}
                />
              </LabeledField>
            </StepCard>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setNav(
                    category === "minecraft" || category === "frp"
                      ? "type"
                      : "category",
                  )
                }
              >
                {t("shared.create.back")}
              </Button>
              <Button
                type="button"
                disabled={!canFinish}
                onClick={() => setConfirmOpen(true)}
              >
                {submitting
                  ? t("shared.create.status.creating")
                  : t("shared.create.finish")}
              </Button>
            </div>
          </div>
        </Reveal>
      ) : null}

      <JvmArgHelperDialog
        open={jvmHelperOpen}
        onOpenChange={setJvmHelperOpen}
        onInsert={insertJvmHelperArgs}
      />

      {/* 创建确认 Dialog（对齐 WPF CreateInstanceConfirmation） */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("shared.create.confirm.title")}</DialogTitle>
            <DialogDescription>
              {t("shared.create.confirm.desc", {
                name: name.trim() || "—",
                type: t(`shared.create.type.${coreType}`),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              {t("shared.create.confirm.cancel")}
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={() => void doCreate()}
            >
              {submitting
                ? t("shared.create.status.creating")
                : t("shared.create.confirm.ok")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConsolePage>
  );
}

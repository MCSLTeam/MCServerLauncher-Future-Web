"use client";

import {
  Download,
  ExternalLink,
  Puzzle,
  RefreshCw,
  Server,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import { ConsolePage } from "@/components/templates/console-surface";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DownloadDestinationDialog } from "@/features/downloads/download-destination-dialog";
import { ClientExtensionCenter } from "@/features/plugins/ui-runtime/client-extension-center";
import { useDownloads } from "@/features/downloads/download-provider";
import type { DownloadDestination } from "@/lib/downloads/manager";
import { useT } from "@/features/i18n/locale-provider";
import {
  loadResourceProviderId,
  RESOURCE_PROVIDERS,
  type ResourceCore,
  type ResourceFile,
  type ResourceProviderId,
} from "@/lib/resource-providers";
import { formatMinecraftVersion } from "@/lib/minecraft-version";
import { cn } from "@/lib/utils";

function tagName(tag: string | undefined, t: (key: string) => string) {
  if (!tag) return "";
  const key = `shared.resource-center.tag.${tag}`;
  const label = t(key);
  return label === key ? tag : label;
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ResourceCenterPage() {
  const t = useT();
  const downloads = useDownloads();
  const [providerId] = useState<ResourceProviderId>(loadResourceProviderId);
  const [cores, setCores] = useState<ResourceCore[]>([]);
  const [currentCoreId, setCurrentCoreId] = useState("");
  const [versions, setVersions] = useState<string[]>([]);
  const [currentVersion, setCurrentVersion] = useState("");
  const [files, setFiles] = useState<ResourceFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<ResourceFile | null>(null);
  const [destOpen, setDestOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [surface, setSurface] = useState("server-cores");

  const provider = useMemo(
    () =>
      RESOURCE_PROVIDERS.find((item) => item.id === providerId) ??
      RESOURCE_PROVIDERS[0],
    [providerId],
  );
  const currentCore = cores.find((core) => core.id === currentCoreId);

  const loadFiles = useCallback(
    async (core: ResourceCore, version?: string) => {
      setLoading(true);
      setError(null);
      setFiles([]);
      try {
        setFiles(await provider.listFiles(core, version));
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : t("shared.resource-center.provider.error"),
        );
      } finally {
        setLoading(false);
      }
    },
    [provider, t],
  );

  const chooseCore = useCallback(
    async (core: ResourceCore) => {
      setCurrentCoreId(core.id);
      setCurrentVersion("");
      setVersions([]);
      setFiles([]);
      setLoading(true);
      setError(null);
      try {
        if (provider.id === "FastMirror" || provider.id === "MCSLSync") {
          const nextVersions = provider.listVersions
            ? await provider.listVersions(core)
            : [];
          setVersions(nextVersions);
          const first = nextVersions[0] ?? "";
          setCurrentVersion(first);
          if (first) setFiles(await provider.listFiles(core, first));
        } else {
          setFiles(await provider.listFiles(core));
        }
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : t("shared.resource-center.provider.error"),
        );
      } finally {
        setLoading(false);
      }
    },
    [provider, t],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCores([]);
    setFiles([]);
    setVersions([]);
    setCurrentCoreId("");
    setCurrentVersion("");
    try {
      const nextCores = await provider.listCores();
      setCores(nextCores);
      if (nextCores[0]) await chooseCore(nextCores[0]);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t("shared.resource-center.provider.error"),
      );
    } finally {
      setLoading(false);
    }
  }, [chooseCore, provider, t]);

  useEffect(() => {
    const task = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(task);
  }, [refresh]);

  async function downloadFile(file: ResourceFile) {
    setDownloading(file.name);
    setError(null);
    try {
      if (!currentCore) {
        throw new Error(t("shared.resource-center.provider.error"));
      }
      const target = await provider.resolveDownload(currentCore, file);
      setPendingFile(file);
      setPendingUrl(target.url);
      setDestOpen(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t("shared.resource-center.provider.error"),
      );
    } finally {
      setDownloading(null);
    }
  }

  async function onConfirmDestinations(destinations: DownloadDestination[]) {
    if (!pendingFile || !pendingUrl) return;
    setDownloading(pendingFile.name);
    setError(null);
    try {
      await downloads.startDownload(pendingUrl, pendingFile.name, {
        destinations,
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t("shared.resource-center.provider.error"),
      );
    } finally {
      setDownloading(null);
      setPendingFile(null);
      setPendingUrl(null);
    }
  }

  return (
    <ConsolePage className="min-h-0 flex-1 gap-0">
      <Tabs
        value={surface}
        onValueChange={setSurface}
        className="min-h-0 flex-1 gap-0"
      >
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-3">
              <TabsList>
                <TabsTrigger value="server-cores">
                  <Server className="size-4" />
                  {t("shared.resource-center.cores")}
                </TabsTrigger>
                <TabsTrigger value="extensions">
                  <Puzzle className="size-4" />
                  扩展 / 插件
                </TabsTrigger>
              </TabsList>
              <p className="truncate text-sm text-muted-foreground">
                {surface === "server-cores"
                  ? t("shared.resource-center.wpf-tip", {
                      provider: t(provider.displayNameKey),
                    })
                  : "安装、恢复和管理本机已校验的 .mpx 扩展包。"}
              </p>
            </div>
            {surface === "server-cores" ? (
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => void refresh()}
                >
                  <RefreshCw
                    className={cn("size-4", loading && "animate-spin")}
                  />
                  {t("shared.nodes.refresh")}
                </Button>
              </div>
            ) : null}
          </div>
        </Reveal>

        <TabsContent value="server-cores" className="min-h-0 flex-1">
          <Reveal className="flex min-h-0 flex-1 flex-col" delay={0.03}>
            <div className="relative mt-5 grid min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-2.5">
              <aside
                className={cn(
                  "flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card",
                  provider.sidebarWidth === "wide"
                    ? "w-[12.5rem]"
                    : "w-[9.375rem]",
                )}
              >
                <div className="px-4 pt-3.5 text-center text-sm text-muted-foreground">
                  {t("shared.resource-center.cores")}
                </div>
                <RadioGroup
                  className="mcsl-scrollbar mt-2 min-h-0 flex-1 gap-1 overflow-y-auto px-2.5 pb-3.5"
                  value={currentCoreId}
                  onValueChange={(id) => {
                    const core = cores.find((item) => item.id === id);
                    if (core) void chooseCore(core);
                  }}
                >
                  {cores.map((core) => (
                    <label
                      key={core.id}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                        currentCoreId === core.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/60",
                        core.recommended &&
                          currentCoreId !== core.id &&
                          "bg-gradient-to-r from-amber-500 to-yellow-400 text-white",
                      )}
                    >
                      <RadioGroupItem value={core.id} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{core.name}</span>
                        {core.tag ? (
                          <span className="mt-0.5 block text-xs opacity-75">
                            {tagName(core.tag, t)}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </aside>

              <section className="flex min-h-0 min-w-0 flex-col rounded-xl border bg-card p-2.5">
                {currentCore ? (
                  <>
                    {provider.id === "FastMirror" ||
                    provider.id === "MCSLSync" ? (
                      <div className="flex gap-2.5">
                        <Select
                          value={currentVersion}
                          onValueChange={(version) => {
                            setCurrentVersion(version);
                            void loadFiles(currentCore, version);
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue
                              placeholder={t(
                                "shared.resource-center.minecraft-version",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {versions.map((version) => (
                              <SelectItem key={version} value={version}>
                                {formatMinecraftVersion(
                                  version,
                                  "minecraft-prefixed",
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {provider.id === "FastMirror" ? (
                          <Button
                            asChild
                            variant="outline"
                            disabled={!currentCore.homepage}
                          >
                            <a
                              href={currentCore.homepage || "#"}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="size-4" />
                              {t("shared.resource-center.open-homepage")}
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mb-2.5 flex items-center gap-2.5">
                        {provider.id === "PolarsMirror" && currentCore.icon ? (
                          // 图标 URL 只来自固定白名单 Provider 返回值。
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={currentCore.icon}
                            alt=""
                            width={55}
                            height={55}
                            className="size-[55px] shrink-0 rounded-lg object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold">
                            {currentCore.name}
                          </h3>
                          {currentCore.description ? (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {currentCore.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    )}

                    <div className="mcsl-scrollbar mt-2.5 min-h-0 flex-1 space-y-2 overflow-y-auto">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            {file.minecraftVersion ? (
                              <div className="text-sm">
                                {t("shared.resource-center.minecraft-version")}:{" "}
                                {file.minecraftVersion}
                              </div>
                            ) : null}
                            {file.buildVersion ? (
                              <div className="text-sm text-muted-foreground">
                                {t("shared.resource-center.build-version")}:{" "}
                                {file.buildVersion}
                              </div>
                            ) : null}
                            {!file.minecraftVersion && !file.buildVersion ? (
                              <div className="truncate text-sm">
                                {file.name}
                              </div>
                            ) : null}
                            {file.size ? (
                              <div className="text-xs text-muted-foreground">
                                {formatSize(file.size)}
                              </div>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            title={t("shared.resource-center.download")}
                            disabled={downloading === file.id}
                            onClick={() => void downloadFile(file)}
                          >
                            <Download className="size-4" />
                          </Button>
                        </div>
                      ))}
                      {!loading && files.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                          {t("shared.resource-center.no-files")}
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : null}
                {error ? (
                  <p className="p-4 text-sm text-destructive">{error}</p>
                ) : null}
              </section>
            </div>
          </Reveal>
        </TabsContent>

        <TabsContent value="extensions" className="min-h-0 flex-1 pt-5">
          <ClientExtensionCenter />
        </TabsContent>
      </Tabs>
      <DownloadDestinationDialog
        open={destOpen}
        fileName={pendingFile?.name ?? ""}
        onOpenChange={(open) => {
          setDestOpen(open);
          if (!open) {
            setPendingFile(null);
            setPendingUrl(null);
          }
        }}
        onConfirm={(destinations) => {
          void onConfirmDestinations(destinations);
        }}
      />
    </ConsolePage>
  );
}

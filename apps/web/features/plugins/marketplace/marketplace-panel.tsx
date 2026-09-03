"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  CheckCircle2,
  Download,
  ExternalLink,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ConsolePanel,
  ConsolePanelHeader,
} from "@/components/templates/console-surface";
import { cn } from "@/lib/utils";
import {
  RegistryClient,
  RegistryClientError,
  getRegistryBaseUrl,
  resolveDependencies,
  setRegistryBaseUrl,
  type RegistryPluginDetail,
  type RegistryPluginSummary,
  type RegistryUpdateInfo,
} from "./registry-client";
import type { ClientExtensionCacheEntry } from "../ui-runtime/client-extension-manager";

export interface MarketplaceInstallRequest {
  readonly id: string;
  readonly version: string;
  readonly bytes: Uint8Array;
  readonly dependencies: readonly { id: string; version: string; bytes: Uint8Array }[];
}

export interface MarketplacePanelProps {
  readonly installed: readonly ClientExtensionCacheEntry[];
  readonly onInstall: (request: MarketplaceInstallRequest) => Promise<void>;
  readonly onUpdateInstalled: () => void;
}

interface PluginListItem extends RegistryPluginSummary {
  readonly categoryLabel: string;
}

const PAGE_SIZE = 12;
const CATEGORY_LABELS: Record<string, string> = {
  "server-utility": "Server Utility",
  "server-core": "Server Core",
  monitoring: "Monitoring",
  backup: "Backup",
  network: "Network",
  automation: "Automation",
  theming: "Theming",
  language: "Language",
  other: "Other",
};

export function MarketplacePanel({
  installed,
  onInstall,
  onUpdateInstalled,
}: MarketplacePanelProps) {
  const client = useMemo(() => new RegistryClient(), []);
  const [baseUrl, setBaseUrl] = useState(() => getRegistryBaseUrl());
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<"updated" | "downloads" | "name" | "created">("updated");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ total: number; plugins: PluginListItem[] } | null>(null);
  const [categories, setCategories] = useState<readonly { id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<RegistryPluginDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installMessage, setInstallMessage] = useState<{ kind: "success" | "error"; title: string; details: string } | null>(null);
  const [updates, setUpdates] = useState<Readonly<Record<string, RegistryUpdateInfo>>>({});
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState(baseUrl);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const installedIds = useMemo(() => new Set(installed.map((entry) => entry.id)), [installed]);

  useEffect(() => {
    client
      .categories()
      .then((items) => setCategories(items))
      .catch(() => setCategories([]));
  }, [client, baseUrl]);

  useEffect(() => {
    if (!baseUrl) return;
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      client
        .listPlugins({ q, category, sort, page, pageSize: PAGE_SIZE })
        .then((items) => {
          setResult({
            total: items.total,
            plugins: items.plugins.map((plugin) => ({
              ...plugin,
              categoryLabel: (plugin.categories[0] && CATEGORY_LABELS[plugin.categories[0]]) ?? "Other",
            })),
          });
        })
        .catch((err: unknown) => setError(describeError(err)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [client, baseUrl, q, category, sort, page]);

  const checkUpdates = useCallback(async () => {
    if (installed.length === 0) return;
    setCheckingUpdates(true);
    try {
      const results = await Promise.all(
        installed.map(async (entry) => {
          const info = await client.checkForUpdate(entry.id, entry.version);
          return [entry.id, info] as const;
        }),
      );
      const next: Record<string, RegistryUpdateInfo> = {};
      for (const [id, info] of results) {
        if (info) next[id] = info;
      }
      setUpdates(next);
    } finally {
      setCheckingUpdates(false);
    }
  }, [client, installed]);

  useEffect(() => {
    checkUpdates();
  }, [checkUpdates]);

  async function openDetail(id: string) {
    setError(null);
    setInstallMessage(null);
    try {
      const detail = await client.getPlugin(id);
      setSelected(detail);
    } catch (err) {
      setError(describeError(err));
    }
  }

  async function installVersion(id: string, version: string, name: string) {
    setInstallingId(id);
    setInstallMessage(null);
    try {
      const { bytes } = await client.downloadVersion(id, version);
      const resolution = await resolveDependencies({
        package: { package: { id, version }, dependencies: { extensions: [] } },
        installed: installedIds,
        fetchDependency: async (dependency) => {
          const fetched = await client.downloadVersion(dependency.id, dependency.version);
          return fetched;
        },
      });
      if (!resolution.ok) {
        setInstallMessage({ kind: "error", title: "Dependencies could not be resolved.", details: resolution.message });
        return;
      }
      await onInstall({
        id,
        version,
        bytes,
        dependencies: resolution.installOrder.map((entry) => ({
          id: entry.id,
          version: entry.version,
          bytes: entry.bytes,
        })),
      });
      setInstallMessage({ kind: "success", title: `Installed ${name} ${version}.`, details: "The package passed offline validation and was added to the client cache." });
      await checkUpdates();
      onUpdateInstalled();
    } catch (err) {
      setInstallMessage({ kind: "error", title: "Install failed.", details: describeError(err) });
    } finally {
      setInstallingId(null);
    }
  }

  async function updateInstalled(id: string, name: string) {
    const info = updates[id];
    if (!info?.latestVersion) return;
    await installVersion(id, info.latestVersion, name);
  }

  function saveUrl() {
    const normalized = urlDraft.trim().replace(/\/+$/, "");
    if (normalized) {
      setRegistryBaseUrl(normalized);
      setBaseUrl(normalized);
    }
    setEditingUrl(false);
    setSelected(null);
    setResult(null);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));

  return (
    <ConsolePanel>
      <ConsolePanelHeader
        title="Extension marketplace"
        description="Browse the MCSL Plugin Registry. Packages are validated offline before anything is written to the client cache."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditingUrl((value) => !value)}
          >
            <Settings2 className="size-4" />
            Registry
          </Button>
        }
      />

      {editingUrl ? (
        <div className="mb-3 flex gap-2">
          <input
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            placeholder="http://127.0.0.1:8741"
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <Button type="button" size="sm" onClick={saveUrl}>
            Save
          </Button>
        </div>
      ) : null}

      {Object.keys(updates).length > 0 ? (
        <div className="mb-3 space-y-1.5 rounded-lg border border-amber-800/50 bg-amber-950/20 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
              <TriangleAlert className="size-3.5" />
              Updates available
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={checkUpdates} disabled={checkingUpdates}>
              <RefreshCw className={cn("size-3.5", checkingUpdates && "animate-spin")} />
              Re-check
            </Button>
          </div>
          {Object.entries(updates)
            .filter(([, info]) => info.updateAvailable)
            .map(([id, info]) => (
              <div key={id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-mono text-amber-200">
                  {id} {info.currentVersion} → {info.latestVersion}
                </span>
                <Button type="button" variant="secondary" size="sm" disabled={installingId === id} onClick={() => updateInstalled(id, id)}>
                  <Download className="size-3.5" />
                  Update
                </Button>
              </div>
            ))}
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            placeholder="Search extensions…"
            className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as "updated" | "downloads" | "name" | "created");
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none"
        >
          <option value="updated">Recently updated</option>
          <option value="downloads">Most downloaded</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-3">
          <ShieldAlert className="size-4" />
          <AlertTitle>Registry unavailable</AlertTitle>
          <AlertDescription>
            {error} The client cache and local .mpx install keep working offline.
          </AlertDescription>
        </Alert>
      ) : null}

      {installMessage ? (
        <Alert variant={installMessage.kind === "error" ? "destructive" : "default"} className="mb-3">
          {installMessage.kind === "success" ? <CheckCircle2 className="size-4" /> : <TriangleAlert className="size-4" />}
          <AlertTitle>{installMessage.title}</AlertTitle>
          {installMessage.details ? <AlertDescription>{installMessage.details}</AlertDescription> : null}
        </Alert>
      ) : null}

      {selected ? (
        <PluginDetail
          detail={selected}
          installed={installedIds.has(selected.id)}
          installing={installingId === selected.id}
          onBack={() => setSelected(null)}
          onInstall={(version) => installVersion(selected.id, version, selected.displayName)}
        />
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <RefreshCw className="size-4 animate-spin" />
          Loading registry…
        </div>
      ) : !result || result.plugins.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No extensions found{q ? " for this search" : ""}. Try another query or{" "}
          <a href="/publish" className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer">
            publish one
          </a>.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {result.plugins.map((plugin) => (
              <button
                key={plugin.id}
                type="button"
                onClick={() => openDetail(plugin.id)}
                className="group rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/60"
              >
                <div className="flex items-start gap-2.5">
                  {plugin.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={plugin.iconUrl} alt="" className="size-9 shrink-0 rounded-lg border border-border object-cover" />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
                      {plugin.displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                        {plugin.displayName}
                      </span>
                      {installedIds.has(plugin.id) ? <Badge variant="secondary">installed</Badge> : null}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{plugin.summary}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {plugin.targets.client ? <Badge variant="outline">client</Badge> : null}
                      {plugin.targets.daemon ? <Badge variant="outline">daemon</Badge> : null}
                      <Badge variant="outline">{plugin.categoryLabel}</Badge>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <span>
              Page {page} / {totalPages} · {result.total} results
            </span>
            <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        </>
      )}
    </ConsolePanel>
  );
}

function PluginDetail({
  detail,
  installed,
  installing,
  onBack,
  onInstall,
}: {
  readonly detail: RegistryPluginDetail;
  readonly installed: boolean;
  readonly installing: boolean;
  readonly onBack: () => void;
  readonly onInstall: (version: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{detail.displayName}</h3>
            {installed ? <Badge variant="secondary">installed</Badge> : null}
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {detail.id} · by {detail.publisher.slug}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
      </div>

      {detail.description ? (
        <p className="whitespace-pre-line text-sm text-muted-foreground">{detail.description}</p>
      ) : null}

      <div className="flex flex-wrap gap-1">
        {detail.targets.client ? <Badge variant="outline">client</Badge> : null}
        {detail.targets.daemon ? <Badge variant="outline">daemon</Badge> : null}
        {detail.categories.map((category) => (
          <Badge key={category} variant="outline">
            {CATEGORY_LABELS[category] ?? category}
          </Badge>
        ))}
        {detail.license ? <Badge variant="outline">{detail.license}</Badge> : null}
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        {detail.versions.map((version) => (
          <div key={version.version} className="flex items-center gap-3 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-foreground">{version.version}</span>
                {version.signed ? <Badge variant="outline">signed</Badge> : null}
              </div>
              {version.changelog ? (
                <p className="line-clamp-1 text-xs text-muted-foreground">{version.changelog}</p>
              ) : null}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatCount(version.downloadCount)} dl
            </span>
            <Button
              type="button"
              size="sm"
              disabled={installing || (installed && detail.latestVersion === version.version)}
              onClick={() => onInstall(version.version)}
            >
              <ArrowDownToLine className="size-3.5" />
              {installed && detail.latestVersion === version.version ? "Installed" : installing ? "Installing…" : "Install"}
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {detail.homepage ? (
          <a href={detail.homepage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
            <ExternalLink className="size-3" /> Homepage
          </a>
        ) : null}
        {detail.repository ? (
          <a href={detail.repository} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
            <Wrench className="size-3" /> Repository
          </a>
        ) : null}
        <span>{detail.downloads.toLocaleString()} total downloads</span>
      </div>
    </div>
  );
}

function describeError(error: unknown): string {
  if (error instanceof RegistryClientError) {
    return error.statusCode === 0
      ? `${error.code}: ${error.message}`
      : `${error.code} (HTTP ${error.statusCode})`;
  }
  return error instanceof Error ? error.message : String(error);
}

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

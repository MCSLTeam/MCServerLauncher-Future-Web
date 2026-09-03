/**
 * Remote registry client for the Web console.
 *
 * Talks to the MCSL Plugin Registry public API (see
 * `MCSL-Plugin-Registry/docs/API.md`). The base URL is user-configurable and
 * persisted in localStorage so a registry deployment is not hard-coded.
 *
 * All registry calls are treated as *remote advisory*: the local package
 * validator + install review remain the authority before anything is written
 * to the client cache.
 */

import type { ValidatedMpxPackage } from "../ui-runtime/mpx-validator.ts";

export const REGISTRY_URL_STORAGE_KEY = "mcsl.registry.url";
export const DEFAULT_REGISTRY_URL = "http://127.0.0.1:8741";

export function getRegistryBaseUrl(): string {
  try {
    return localStorage.getItem(REGISTRY_URL_STORAGE_KEY) ?? DEFAULT_REGISTRY_URL;
  } catch {
    return DEFAULT_REGISTRY_URL;
  }
}

export function setRegistryBaseUrl(url: string): void {
  try {
    localStorage.setItem(REGISTRY_URL_STORAGE_KEY, url.replace(/\/+$/, ""));
  } catch {
    // storage unavailable — ignore
  }
}

export interface RegistryPluginSummary {
  readonly id: string;
  readonly displayName: string;
  readonly summary: string;
  readonly publisher: { readonly id: string; readonly slug: string };
  readonly categories: readonly string[];
  readonly keywords: readonly string[];
  readonly targets: { readonly client: boolean; readonly daemon: boolean };
  readonly license: string | null;
  readonly latestVersion: string | null;
  readonly publishedAt: string;
  readonly updatedAt: string;
  readonly downloads: number;
  readonly iconUrl: string | null;
}

export interface RegistryVersionSummary {
  readonly version: string;
  readonly releasedAt: string;
  readonly changelog: string | null;
  readonly sha256: string;
  readonly sizeBytes: number;
  readonly downloadCount: number;
  readonly targets: { readonly client: boolean; readonly daemon: boolean };
  readonly runtime: { readonly ui?: string; readonly daemonApi?: string; readonly javascript?: string } | null;
  readonly signed: boolean;
  readonly downloadUrl: string;
}

export interface RegistryPluginDetail extends RegistryPluginSummary {
  readonly description: string;
  readonly homepage: string | null;
  readonly repository: string | null;
  readonly versions: readonly RegistryVersionSummary[];
}

export interface RegistryListQuery {
  readonly q?: string;
  readonly category?: string;
  readonly target?: "client" | "daemon";
  readonly publisher?: string;
  readonly sort?: "updated" | "downloads" | "name" | "created";
  readonly order?: "asc" | "desc";
  readonly page?: number;
  readonly pageSize?: number;
}

export interface RegistryListResult {
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly sort: string;
  readonly order: string;
  readonly plugins: readonly RegistryPluginSummary[];
}

export interface RegistryCategory {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface RegistryUpdateInfo {
  readonly updateAvailable: boolean;
  readonly currentVersion: string | null;
  readonly latestVersion: string | null;
  readonly latestPublishedAt: string | null;
  readonly changelog: string | null;
  readonly downloadUrl: string | null;
}

export class RegistryClientError extends Error {
  readonly statusCode: number;
  readonly code: string;
  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "RegistryClientError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface RegistryClientOptions {
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
}

export class RegistryClient {
  readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: RegistryClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? getRegistryBaseUrl()).replace(/\/+$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });
      if (response.status >= 400) {
        let code = "registry_error";
        let message = `Registry request failed with HTTP ${response.status}.`;
        try {
          const body = (await response.json()) as { error?: string; message?: string };
          code = body.error ?? code;
          message = body.message ?? message;
        } catch {
          // non-JSON error body
        }
        throw new RegistryClientError(response.status, code, message);
      }
      return response;
    } catch (error) {
      if (error instanceof RegistryClientError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new RegistryClientError(0, "registry_timeout", "Registry request timed out.");
      }
      throw new RegistryClientError(
        0,
        "registry_unreachable",
        error instanceof Error ? error.message : "Registry is unreachable.",
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async health(): Promise<{ status: string; plugins: number }> {
    const response = await this.request("/api/v1/health");
    return (await response.json()) as { status: string; plugins: number };
  }

  async categories(): Promise<readonly RegistryCategory[]> {
    const response = await this.request("/api/v1/categories");
    const body = (await response.json()) as { categories: RegistryCategory[] };
    return body.categories;
  }

  async listPlugins(query: RegistryListQuery = {}): Promise<RegistryListResult> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    const response = await this.request(`/api/v1/plugins?${params.toString()}`);
    return (await response.json()) as RegistryListResult;
  }

  async getPlugin(id: string): Promise<RegistryPluginDetail> {
    const response = await this.request(`/api/v1/plugins/${encodeURIComponent(id)}`);
    return (await response.json()) as RegistryPluginDetail;
  }

  async downloadVersion(id: string, version: string): Promise<{ bytes: Uint8Array; sha256: string }> {
    const response = await this.request(
      `/api/v1/plugins/${encodeURIComponent(id)}/versions/${encodeURIComponent(version)}/download`,
    );
    const sha256 = response.headers.get("x-mcsl-sha256") ?? "";
    return { bytes: new Uint8Array(await response.arrayBuffer()), sha256 };
  }

  /**
   * Update discovery: compare an installed version against the registry's
   * latest published version via the dedicated `/updates` endpoint (same
   * contract the WPF client uses).
   */
  async checkForUpdate(id: string, installedVersion: string): Promise<RegistryUpdateInfo | null> {
    let response: Response;
    try {
      response = await this.request(
        `/api/v1/plugins/${encodeURIComponent(id)}/updates?from=${encodeURIComponent(installedVersion)}`,
      );
    } catch {
      return null;
    }
    try {
      const body = (await response.json()) as {
        updateAvailable: boolean;
        currentVersion: string | null;
        latestVersion: string | null;
        latestPublishedAt: string | null;
        changelog: string | null;
        downloadUrl: string | null;
      };
      return body;
    } catch {
      return null;
    }
  }
}

/**
 * Resolve the transitive `dependencies.extensions` closure for a package.
 *
 * Pure helper: takes the packages already validated locally plus a fetch
 * callback for dependency manifests, and returns an ordered install list
 * (dependencies first). Cycles, missing dependencies and conflicts are
 * reported instead of silently resolved.
 */
export interface ExtensionDependency {
  readonly id: string;
  readonly version: string;
}

export interface DependencyResolutionInput {
  readonly package: Pick<ValidatedMpxPackage["manifest"], "dependencies"> & {
    readonly package: { readonly id: string; readonly version: string };
  };
  readonly installed: ReadonlySet<string>;
  readonly fetchDependency: (
    dependency: ExtensionDependency,
  ) => Promise<{ bytes: Uint8Array; sha256: string } | null>;
}

export type DependencyResolutionResult =
  | {
      readonly ok: true;
      readonly installOrder: readonly { id: string; version: string; bytes: Uint8Array; sha256: string }[];
      readonly alreadyInstalled: readonly string[];
    }
  | { readonly ok: false; readonly code: string; readonly message: string };

const DEPENDENCY_VERSION = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

export async function resolveDependencies(
  input: DependencyResolutionInput,
): Promise<DependencyResolutionResult> {
  const requested = input.package.dependencies?.extensions ?? [];
  if (requested.length === 0) {
    return { ok: true, installOrder: [], alreadyInstalled: [] };
  }

  const installOrder: { id: string; version: string; bytes: Uint8Array; sha256: string }[] = [];
  const alreadyInstalled: string[] = [];
  // id -> resolved version; used for conflict detection across the graph.
  const resolvedVersions = new Map<string, string>();
  const visiting = new Set<string>();
  const visited = new Set<string>([input.package.package.id]);
  let failure: { ok: false; code: string; message: string } | undefined;

  function fail(code: string, message: string): boolean {
    failure = { ok: false, code, message };
    return false;
  }

  async function visit(dependency: ExtensionDependency): Promise<boolean> {
    if (visited.has(dependency.id)) {
      const existing = resolvedVersions.get(dependency.id);
      if (existing !== undefined && existing !== dependency.version) {
        return fail(
          "dependency_version_conflict",
          `Plugin '${dependency.id}' is required at both '${existing}' and '${dependency.version}'.`,
        );
      }
      return true;
    }
    if (visiting.has(dependency.id)) {
      // Cycle: the dependency is already being resolved further up the graph.
      return true;
    }
    if (!DEPENDENCY_VERSION.test(dependency.version)) {
      return fail(
        "dependency_version_invalid",
        `Dependency '${dependency.id}' has invalid version '${dependency.version}'.`,
      );
    }
    if (input.installed.has(dependency.id)) {
      alreadyInstalled.push(dependency.id);
      visited.add(dependency.id);
      resolvedVersions.set(dependency.id, dependency.version);
      return true;
    }

    visiting.add(dependency.id);
    const fetched = await input.fetchDependency(dependency);
    if (!fetched) {
      return fail(
        "dependency_unavailable",
        `Dependency '${dependency.id}@${dependency.version}' is not available on the registry.`,
      );
    }

    // Walk transitive edges first so the final order is dependencies-first.
    const { extractMpxPackageFiles } = await import("../ui-runtime/mpx-validator.ts");
    const extracted = await extractMpxPackageFiles(fetched.bytes, ["manifest.json"]);
    const manifestBytes = extracted.ok ? extracted.files.get("manifest.json") : undefined;
    let transitiveDeps: readonly ExtensionDependency[] = [];
    if (!extracted.ok || !manifestBytes) {
      visiting.delete(dependency.id);
      return fail(
        "dependency_invalid",
        `Dependency '${dependency.id}@${dependency.version}' does not contain a valid manifest.`,
      );
    }
    try {
      const manifest = JSON.parse(new TextDecoder().decode(manifestBytes)) as {
        dependencies?: { extensions?: readonly ExtensionDependency[] };
      };
      transitiveDeps = manifest.dependencies?.extensions ?? [];
    } catch {
      visiting.delete(dependency.id);
      return fail(
        "dependency_invalid",
        `Dependency '${dependency.id}@${dependency.version}' has an unreadable manifest.`,
      );
    }

    for (const transitive of transitiveDeps) {
      if (!visited.has(transitive.id) && !visiting.has(transitive.id)) {
        const ok = await visit(transitive);
        if (!ok) {
          visiting.delete(dependency.id);
          return false;
        }
      } else {
        const existing = resolvedVersions.get(transitive.id);
        if (existing !== undefined && existing !== transitive.version) {
          visiting.delete(dependency.id);
          return fail(
            "dependency_version_conflict",
            `Plugin '${transitive.id}' is required at both '${existing}' and '${transitive.version}'.`,
          );
        }
      }
    }

    visiting.delete(dependency.id);
    visited.add(dependency.id);
    resolvedVersions.set(dependency.id, dependency.version);
    installOrder.push({ id: dependency.id, version: dependency.version, ...fetched });
    return true;
  }

  for (const dependency of requested) {
    const ok = await visit(dependency);
    if (!ok) return failure!;
  }

  return { ok: true, installOrder, alreadyInstalled };
}

export function semverCompare(a: string, b: string): number {
  const parse = (value: string): readonly number[] =>
    value
      .replace(/[+-].*$/, "")
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);
  const left = parse(a);
  const right = parse(b);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

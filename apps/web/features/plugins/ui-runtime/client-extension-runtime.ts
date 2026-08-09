import type {
  ClientExtensionCacheEntry,
  ClientExtensionPayloadStore,
} from "./client-extension-manager.ts";
import { sha256Hex } from "../../../lib/daemon/binary.ts";
import {
  applyExtensionStateEnvelope,
  dispatchPluginUiCommand,
  type ExtensionEventEnvelope,
  type ExtensionJsonValue,
  type ExtensionProtocolEnvelope,
  type ExtensionProtocolParseResult,
  type ExtensionProtocolRpcTransport,
  type ExtensionStateSnapshot,
} from "./extension-protocol.ts";
import type {
  MpxManifestFileRef,
  MpxManifestResourceRef,
  MpxManifestScriptRef,
} from "./mpx-validator.ts";
import type { PluginUiEvent } from "./web-renderer.tsx";

export type ClientExtensionResourceKind =
  | "ui"
  | "theme"
  | "script"
  | "resource";

export interface ClientExtensionResourceMetadata {
  readonly kind: ClientExtensionResourceKind;
  readonly path: string;
  readonly sha256: string;
  readonly mime?: string;
  readonly bytes?: number;
}

export type ClientExtensionResourceReference =
  | { readonly kind: "url"; readonly url: string }
  | { readonly kind: "storage"; readonly storageRef: string };

export type ClientExtensionResourceResolveResult =
  | {
      readonly ok: true;
      readonly resource: ClientExtensionResourceMetadata;
      readonly reference: ClientExtensionResourceReference;
    }
  | { readonly ok: false; readonly code: string; readonly message: string };

export interface ClientExtensionResourceResolver {
  resolveUrl?(
    entry: ClientExtensionCacheEntry,
    resource: ClientExtensionResourceMetadata,
  ): string | undefined;
  resolveStorageRef?(
    entry: ClientExtensionCacheEntry,
    resource: ClientExtensionResourceMetadata,
  ): string | undefined;
}

export function listClientExtensionResources(
  entry: ClientExtensionCacheEntry,
): readonly ClientExtensionResourceMetadata[] {
  const resources = new Map<string, ClientExtensionResourceMetadata>();
  const client = entry.deploymentPlan.client;
  addFile(resources, "ui", client?.ui);
  addFile(resources, "theme", client?.theme);
  addFile(resources, "script", client?.script);
  for (const resource of entry.resources) addResource(resources, resource);
  return [...resources.values()].sort((left, right) =>
    left.path.localeCompare(right.path),
  );
}

export function resolveClientExtensionResource(
  entry: ClientExtensionCacheEntry,
  packagePath: string,
  resolver: ClientExtensionResourceResolver = {},
): ClientExtensionResourceResolveResult {
  const resource = listClientExtensionResources(entry).find(
    (candidate) => candidate.path === packagePath,
  );
  if (resource === undefined) {
    return {
      ok: false,
      code: "resource_undeclared",
      message: `Resource '${packagePath}' is not declared by extension '${entry.id}'.`,
    };
  }

  const url = resolver.resolveUrl?.(entry, resource);
  if (url !== undefined) {
    if (!isBrowserSafeResourceUrl(url)) {
      return {
        ok: false,
        code: "resource_url_unsafe",
        message: `Resource '${packagePath}' resolved to an unsafe URL.`,
      };
    }

    return { ok: true, resource, reference: { kind: "url", url } };
  }

  const storageRef = resolver.resolveStorageRef?.(entry, resource);
  if (storageRef !== undefined && storageRef.length > 0) {
    return { ok: true, resource, reference: { kind: "storage", storageRef } };
  }

  return {
    ok: false,
    code: "resource_unavailable",
    message: `Resource '${packagePath}' is declared but has no active URL or storage reference.`,
  };
}

export async function resolveClientExtensionObjectUrl(
  entry: ClientExtensionCacheEntry,
  packagePath: string,
  payloadStore: ClientExtensionPayloadStore,
): Promise<ClientExtensionResourceResolveResult> {
  const resource = listClientExtensionResources(entry).find(
    (candidate) => candidate.path === packagePath,
  );
  if (resource === undefined) {
    return {
      ok: false,
      code: "resource_undeclared",
      message: `Resource '${packagePath}' is not declared by extension '${entry.id}'.`,
    };
  }

  const cached = entry.cachedPayloads?.find(
    (payload) => payload.path === packagePath,
  );
  if (cached === undefined) {
    return {
      ok: false,
      code: "resource_unavailable",
      message: `Resource '${packagePath}' has no cached payload entry.`,
    };
  }

  const bytes = await payloadStore.readFile(cached.storageRef);
  if (bytes === undefined) {
    return {
      ok: false,
      code: "resource_missing",
      message: `Cached resource '${packagePath}' is missing from storage.`,
    };
  }

  if ((await sha256Hex(bytes)) !== cached.sha256) {
    return {
      ok: false,
      code: "resource_hash_mismatch",
      message: `Cached resource '${packagePath}' failed hash verification.`,
    };
  }

  if (typeof URL.createObjectURL !== "function") {
    return {
      ok: false,
      code: "resource_url_unavailable",
      message:
        "This runtime cannot create object URLs for cached extension payloads.",
    };
  }

  const payload = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(payload).set(bytes);
  const url = URL.createObjectURL(
    new Blob([payload], {
      type: cached.mime ?? resource.mime ?? "application/octet-stream",
    }),
  );
  return resolveClientExtensionResource(entry, packagePath, {
    resolveUrl: () => url,
  });
}

export function createClientExtensionState(
  entry: ClientExtensionCacheEntry,
  initialState: Record<string, ExtensionJsonValue> = {},
  revision = 0,
): ExtensionStateSnapshot {
  return {
    plugin: entry.id,
    revision,
    state: { ...initialState },
  };
}

export function applyClientExtensionStateEnvelope(
  entry: ClientExtensionCacheEntry,
  snapshot: ExtensionStateSnapshot,
  envelope: ExtensionProtocolEnvelope,
): ExtensionStateSnapshot & { readonly applied: boolean } {
  if (snapshot.plugin !== entry.id) {
    return { ...snapshot, applied: false };
  }

  return applyExtensionStateEnvelope(snapshot, envelope);
}

export type ClientExtensionEventDispatchResult =
  | { readonly dispatched: true }
  | { readonly dispatched: false; readonly diagnostics: readonly string[] };

export type ClientExtensionEventHandler = (
  event: ExtensionEventEnvelope,
) => void | Promise<void>;

export async function dispatchClientExtensionEvent(
  entry: ClientExtensionCacheEntry,
  envelope: ExtensionProtocolEnvelope,
  handler: ClientExtensionEventHandler,
): Promise<ClientExtensionEventDispatchResult> {
  if (envelope.type !== "event") {
    return { dispatched: false, diagnostics: ["envelope is not an event"] };
  }
  if (envelope.plugin !== entry.id) {
    return {
      dispatched: false,
      diagnostics: ["event plugin does not match installed extension"],
    };
  }
  if (!(entry.manifest.permissions.events ?? []).includes(envelope.name)) {
    return {
      dispatched: false,
      diagnostics: [
        `event '${envelope.name}' is not declared by installed extension '${entry.id}'`,
      ],
    };
  }

  try {
    await handler(envelope);
    return { dispatched: true };
  } catch (error) {
    return {
      dispatched: false,
      diagnostics: [
        error instanceof Error ? error.message : "event handler failed",
      ],
    };
  }
}

export async function dispatchClientExtensionCommand(
  entry: ClientExtensionCacheEntry,
  transport: ExtensionProtocolRpcTransport,
  event: PluginUiEvent,
  requestId?: string,
): Promise<ExtensionProtocolParseResult> {
  if (event.command === undefined) {
    return { ok: false, diagnostics: ["ui event has no command binding"] };
  }

  if (!isDeclaredDaemonCommand(entry, event.command.command)) {
    return {
      ok: false,
      diagnostics: [
        `command '${event.command.command}' is not declared by installed extension '${entry.id}'`,
      ],
    };
  }

  return dispatchPluginUiCommand(transport, entry.id, event, requestId);
}

export function createPreviewExtensionTransport(
  entry: ClientExtensionCacheEntry,
): ExtensionProtocolRpcTransport {
  return {
    async request<T>(_method: string, params: Record<string, unknown>) {
      const envelope = isRecord(params.envelope) ? params.envelope : undefined;
      return {
        envelope: {
          protocol: "mcsl.extension.v1",
          type: "response",
          id: typeof envelope?.id === "string" ? envelope.id : "preview",
          plugin: entry.id,
          result: { accepted: true },
        },
      } as T;
    },
  };
}

function isDeclaredDaemonCommand(
  entry: ClientExtensionCacheEntry,
  command: string,
): boolean {
  return entry.commands.some(
    (declared) => declared.id === command && declared.target === "daemon",
  );
}

function addFile(
  resources: Map<string, ClientExtensionResourceMetadata>,
  kind: ClientExtensionResourceKind,
  file: MpxManifestFileRef | MpxManifestScriptRef | undefined,
): void {
  if (file === undefined) return;
  resources.set(file.path, { kind, path: file.path, sha256: file.sha256 });
}

function addResource(
  resources: Map<string, ClientExtensionResourceMetadata>,
  resource: MpxManifestResourceRef,
): void {
  resources.set(resource.path, {
    kind: "resource",
    path: resource.path,
    sha256: resource.sha256,
    mime: resource.mime,
    bytes: resource.bytes,
  });
}

function isBrowserSafeResourceUrl(value: string): boolean {
  try {
    const parsed = new URL(value, "https://mcsl.invalid");
    if (
      parsed.protocol === "blob:" ||
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    ) {
      return true;
    }
    if (parsed.protocol === "data:") {
      return /^data:image\/(png|jpeg|webp);/i.test(value);
    }
    return false;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, ExtensionJsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

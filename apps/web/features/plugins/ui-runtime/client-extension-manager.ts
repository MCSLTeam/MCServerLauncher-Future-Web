import { sha256Hex } from "../../../lib/daemon/binary.ts";
import {
  extractMpxPackageFiles,
  isDependencyVersionSatisfied,
  type MpxDeploymentPlan,
  type MpxManifest,
  type MpxManifestCommand,
  type MpxManifestExtensionDependency,
  type MpxManifestFileRef,
  type MpxManifestResourceRef,
  type MpxManifestScriptRef,
  type MpxManifestUpdatePolicy,
  type MpxPackageSignatureTrust,
  type ValidatedMpxPackage,
} from "./mpx-validator.ts";
import type { PluginUiSchema } from "./schema.ts";
import type { PluginThemeRuntime } from "./theme-runtime.ts";

export interface ClientExtensionCachedPayload {
  readonly path: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly storageRef: string;
  readonly mime?: string;
}

export interface ClientExtensionCacheEntry {
  readonly id: string;
  readonly version: string;
  readonly manifest: MpxManifest;
  readonly deploymentPlan: MpxDeploymentPlan;
  readonly uiSchema?: PluginUiSchema;
  readonly theme?: PluginThemeRuntime;
  readonly resources: readonly MpxManifestResourceRef[];
  readonly commands: readonly MpxManifestCommand[];
  readonly dependencies?: readonly MpxManifestExtensionDependency[];
  readonly updates?: Required<MpxManifestUpdatePolicy>;
  readonly fileDigests: Readonly<Record<string, string>>;
  readonly signature?: MpxPackageSignatureTrust;
  readonly cachedPayloads?: readonly ClientExtensionCachedPayload[];
}

export interface ClientExtensionCacheStore {
  readEntries(): Promise<readonly ClientExtensionCacheEntry[]>;
  writeEntry(entry: ClientExtensionCacheEntry): Promise<void>;
  deleteEntry(id: string): Promise<void>;
}

export interface ClientExtensionPayloadStore {
  writeFile(
    extensionId: string,
    path: string,
    bytes: Uint8Array,
    metadata: Omit<
      ClientExtensionCachedPayload,
      "path" | "storageRef" | "bytes"
    >,
  ): Promise<ClientExtensionCachedPayload>;
  readFile(storageRef: string): Promise<Uint8Array | undefined>;
  deleteExtension(extensionId: string): Promise<void>;
}

export interface ClientExtensionKeyValueStorage {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class LocalStorageClientExtensionCacheStore implements ClientExtensionCacheStore {
  readonly #storage: ClientExtensionKeyValueStorage;
  readonly #keyPrefix: string;

  constructor(
    storage: ClientExtensionKeyValueStorage = globalThis.localStorage,
    keyPrefix = "mcsl.client-extension.",
  ) {
    this.#storage = storage;
    this.#keyPrefix = keyPrefix;
  }

  async readEntries(): Promise<readonly ClientExtensionCacheEntry[]> {
    const entries: ClientExtensionCacheEntry[] = [];
    for (let index = 0; index < this.#storage.length; index++) {
      const key = this.#storage.key(index);
      if (key === null || !key.startsWith(this.#keyPrefix)) continue;
      const value = this.#storage.getItem(key);
      if (value === null) continue;
      try {
        const entry = JSON.parse(value) as unknown;
        if (isClientExtensionCacheEntry(entry)) entries.push(entry);
      } catch {
        continue;
      }
    }

    return entries.sort((left, right) => left.id.localeCompare(right.id));
  }

  async writeEntry(entry: ClientExtensionCacheEntry): Promise<void> {
    this.#storage.setItem(this.storageKey(entry.id), JSON.stringify(entry));
  }

  async deleteEntry(id: string): Promise<void> {
    this.#storage.removeItem(this.storageKey(id));
  }

  private storageKey(id: string): string {
    return `${this.#keyPrefix}${id}`;
  }
}

export class MemoryClientExtensionCacheStore implements ClientExtensionCacheStore {
  readonly #entries = new Map<string, ClientExtensionCacheEntry>();

  async readEntries(): Promise<readonly ClientExtensionCacheEntry[]> {
    return [...this.#entries.values()].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
  }

  async writeEntry(entry: ClientExtensionCacheEntry): Promise<void> {
    this.#entries.set(
      entry.id,
      JSON.parse(JSON.stringify(entry)) as ClientExtensionCacheEntry,
    );
  }

  async deleteEntry(id: string): Promise<void> {
    this.#entries.delete(id);
  }
}

export class MemoryClientExtensionPayloadStore implements ClientExtensionPayloadStore {
  readonly #files = new Map<
    string,
    { readonly extensionId: string; readonly bytes: Uint8Array }
  >();

  async writeFile(
    extensionId: string,
    path: string,
    bytes: Uint8Array,
    metadata: Omit<
      ClientExtensionCachedPayload,
      "path" | "storageRef" | "bytes"
    >,
  ): Promise<ClientExtensionCachedPayload> {
    const storageRef = memoryStorageRef(extensionId, path);
    this.#files.set(storageRef, {
      extensionId,
      bytes: new Uint8Array(bytes),
    });
    return {
      path,
      sha256: metadata.sha256,
      bytes: bytes.byteLength,
      storageRef,
      ...(metadata.mime === undefined ? {} : { mime: metadata.mime }),
    };
  }

  async readFile(storageRef: string): Promise<Uint8Array | undefined> {
    const record = this.#files.get(storageRef);
    return record === undefined ? undefined : new Uint8Array(record.bytes);
  }

  async deleteExtension(extensionId: string): Promise<void> {
    for (const [storageRef, record] of this.#files) {
      if (record.extensionId === extensionId) this.#files.delete(storageRef);
    }
  }
}

export class IndexedDbClientExtensionPayloadStore implements ClientExtensionPayloadStore {
  readonly #databaseName: string;
  readonly #storeName: string;

  constructor(
    databaseName = "mcsl-client-extension-cache",
    storeName = "payloads",
  ) {
    this.#databaseName = databaseName;
    this.#storeName = storeName;
  }

  async writeFile(
    extensionId: string,
    path: string,
    bytes: Uint8Array,
    metadata: Omit<
      ClientExtensionCachedPayload,
      "path" | "storageRef" | "bytes"
    >,
  ): Promise<ClientExtensionCachedPayload> {
    const storageRef = indexedDbStorageRef(extensionId, path);
    const db = await this.openDatabase();
    try {
      const transaction = db.transaction(this.#storeName, "readwrite");
      const store = transaction.objectStore(this.#storeName);
      const payload = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(payload).set(bytes);
      store.put({
        storageRef,
        extensionId,
        path,
        sha256: metadata.sha256,
        mime: metadata.mime,
        bytes: payload,
      });
      await transactionDone(transaction);
    } finally {
      db.close();
    }

    return {
      path,
      sha256: metadata.sha256,
      bytes: bytes.byteLength,
      storageRef,
      ...(metadata.mime === undefined ? {} : { mime: metadata.mime }),
    };
  }

  async readFile(storageRef: string): Promise<Uint8Array | undefined> {
    const db = await this.openDatabase();
    try {
      const transaction = db.transaction(this.#storeName, "readonly");
      const store = transaction.objectStore(this.#storeName);
      const record = await requestResult<IndexedDbPayloadRecord | undefined>(
        store.get(storageRef),
      );
      await transactionDone(transaction);
      if (record?.bytes === undefined) return undefined;
      return new Uint8Array(record.bytes);
    } finally {
      db.close();
    }
  }

  async deleteExtension(extensionId: string): Promise<void> {
    const db = await this.openDatabase();
    try {
      const transaction = db.transaction(this.#storeName, "readwrite");
      const index = transaction
        .objectStore(this.#storeName)
        .index("extensionId");
      await deleteCursorMatches(
        index.openCursor(IDBKeyRange.only(extensionId)),
      );
      await transactionDone(transaction);
    } finally {
      db.close();
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.#databaseName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        const store = db.objectStoreNames.contains(this.#storeName)
          ? request.transaction!.objectStore(this.#storeName)
          : db.createObjectStore(this.#storeName, { keyPath: "storageRef" });
        if (!store.indexNames.contains("extensionId")) {
          store.createIndex("extensionId", "extensionId", { unique: false });
        }
      };
      request.onerror = () =>
        reject(request.error ?? new Error("IndexedDB open failed."));
      request.onsuccess = () => resolve(request.result);
    });
  }
}

type IndexedDbPayloadRecord = {
  readonly storageRef: string;
  readonly extensionId: string;
  readonly path: string;
  readonly sha256: string;
  readonly mime?: string;
  readonly bytes: ArrayBuffer;
};

export type ClientExtensionInstallResult =
  | { readonly ok: true; readonly entry: ClientExtensionCacheEntry }
  | { readonly ok: false; readonly code: string; readonly message: string };

export type ClientExtensionManifestDriftLevel = "low" | "medium" | "high";

export interface ClientExtensionManifestDrift {
  readonly level: ClientExtensionManifestDriftLevel;
  readonly title: string;
  readonly details: string;
}

export class ClientExtensionManager {
  readonly #entries = new Map<string, ClientExtensionCacheEntry>();
  readonly #store?: ClientExtensionCacheStore;
  readonly #payloadStore?: ClientExtensionPayloadStore;

  constructor(
    store?: ClientExtensionCacheStore,
    payloadStore?: ClientExtensionPayloadStore,
  ) {
    this.#store = store;
    this.#payloadStore = payloadStore;
  }

  install(validatedPackage: ValidatedMpxPackage): ClientExtensionInstallResult {
    const dependencyFailure = this.validateDependencies(validatedPackage);
    if (dependencyFailure !== undefined) return dependencyFailure;

    const result = createClientExtensionEntry(validatedPackage, []);
    if (!result.ok) return result;
    this.#entries.set(result.entry.id, result.entry);
    return result;
  }

  async installPersisted(
    validatedPackage: ValidatedMpxPackage,
    packageBytes?: ArrayBuffer | ArrayBufferView,
  ): Promise<ClientExtensionInstallResult> {
    let cachedPayloads: readonly ClientExtensionCachedPayload[] = [];
    const dependencyFailure = this.validateDependencies(validatedPackage);
    if (dependencyFailure !== undefined) return dependencyFailure;

    if (packageBytes !== undefined) {
      if (this.#payloadStore === undefined) {
        return {
          ok: false,
          code: "payload_store_missing",
          message:
            "Persisting package payload bytes requires a client extension payload store.",
        };
      }

      const cached = await this.cachePayloads(validatedPackage, packageBytes);
      if (!cached.ok) return cached;
      cachedPayloads = cached.payloads;
    }

    const result = createClientExtensionEntry(validatedPackage, cachedPayloads);
    if (result.ok) {
      this.#entries.set(result.entry.id, result.entry);
      await this.#store?.writeEntry(result.entry);
    }
    return result;
  }

  async restore(): Promise<void> {
    const entries = await this.#store?.readEntries();
    if (entries === undefined) return;
    this.#entries.clear();
    for (const entry of entries) {
      if (await this.isRestorable(entry)) this.#entries.set(entry.id, entry);
    }
  }

  get(id: string): ClientExtensionCacheEntry | undefined {
    return this.#entries.get(id);
  }

  uninstall(id: string): boolean {
    return this.#entries.delete(id);
  }

  async uninstallPersisted(id: string): Promise<boolean> {
    const removed = this.uninstall(id);
    if (removed) {
      await this.#store?.deleteEntry(id);
      await this.#payloadStore?.deleteExtension(id);
    }
    return removed;
  }

  list(): readonly ClientExtensionCacheEntry[] {
    return [...this.#entries.values()].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
  }

  private async cachePayloads(
    validatedPackage: ValidatedMpxPackage,
    packageBytes: ArrayBuffer | ArrayBufferView,
  ): Promise<
    | {
        readonly ok: true;
        readonly payloads: readonly ClientExtensionCachedPayload[];
      }
    | { readonly ok: false; readonly code: string; readonly message: string }
  > {
    const payloadStore = this.#payloadStore;
    if (payloadStore === undefined) {
      return {
        ok: false,
        code: "payload_store_missing",
        message:
          "Persisting package payload bytes requires a client extension payload store.",
      };
    }

    if (!hasInstallableTarget(validatedPackage.deploymentPlan)) {
      return {
        ok: false,
        code: "deployment_target_missing",
        message:
          "Package has no installable client or daemon deployment target.",
      };
    }

    const refs = packagePayloadRefs(validatedPackage.deploymentPlan);
    const extracted = await extractMpxPackageFiles(
      packageBytes,
      refs.map((ref) => ref.path),
    );
    if (!extracted.ok) {
      return {
        ok: false,
        code: "payload_extract_failed",
        message: extracted.diagnostics
          .map((diagnostic) => diagnostic.message)
          .join("; "),
      };
    }

    await payloadStore.deleteExtension(validatedPackage.manifest.package.id);
    const cached: ClientExtensionCachedPayload[] = [];
    for (const ref of refs) {
      const bytes = extracted.files.get(ref.path);
      if (bytes === undefined) {
        return {
          ok: false,
          code: "payload_missing",
          message: `Payload file '${ref.path}' is missing from the package.`,
        };
      }
      const actual = await sha256Hex(bytes);
      if (actual !== ref.sha256) {
        return {
          ok: false,
          code: "payload_hash_mismatch",
          message: `Payload file '${ref.path}' does not match its manifest digest.`,
        };
      }

      cached.push(
        await payloadStore.writeFile(
          validatedPackage.manifest.package.id,
          ref.path,
          bytes,
          {
            sha256: ref.sha256,
            ...(ref.mime === undefined ? {} : { mime: ref.mime }),
          },
        ),
      );
    }

    return { ok: true, payloads: cached };
  }

  private validateDependencies(
    validatedPackage: ValidatedMpxPackage,
  ): ClientExtensionInstallResult | undefined {
    for (const dependency of validatedPackage.dependencies) {
      const installed = this.#entries.get(dependency.id);
      if (installed === undefined) {
        return {
          ok: false,
          code: "dependency_missing",
          message: `Extension '${validatedPackage.manifest.package.id}' requires '${dependency.id}' ${dependency.version}.`,
        };
      }
      if (
        !isDependencyVersionSatisfied(dependency.version, installed.version)
      ) {
        return {
          ok: false,
          code: "dependency_version_unsupported",
          message: `Extension '${validatedPackage.manifest.package.id}' requires '${dependency.id}' ${dependency.version}, but installed version is ${installed.version}.`,
        };
      }
    }
    return undefined;
  }

  private async isRestorable(
    entry: ClientExtensionCacheEntry,
  ): Promise<boolean> {
    if (!hasInstallableTarget(entry.deploymentPlan)) return false;
    if (entry.deploymentPlan.daemon?.plugin !== undefined) {
      const cachedDaemonPayload = entry.cachedPayloads?.some(
        (payload) => payload.path === entry.deploymentPlan.daemon?.plugin?.path,
      );
      if (!cachedDaemonPayload) return false;
    }
    if ((entry.cachedPayloads?.length ?? 0) === 0) return true;
    if (this.#payloadStore === undefined) return false;

    for (const payload of entry.cachedPayloads ?? []) {
      const bytes = await this.#payloadStore.readFile(payload.storageRef);
      if (bytes === undefined) return false;
      if ((await sha256Hex(bytes)) !== payload.sha256) return false;
    }

    return true;
  }
}

export function buildClientExtensionManifestDrift(
  installed: ClientExtensionCacheEntry | undefined,
  nextPackage: ValidatedMpxPackage,
): readonly ClientExtensionManifestDrift[] {
  if (installed === undefined) return [];

  const findings: ClientExtensionManifestDrift[] = [];
  if (installed.version !== nextPackage.manifest.package.version) {
    findings.push({
      level: "low",
      title: "Version change",
      details: `${installed.version} -> ${nextPackage.manifest.package.version}`,
    });
  }

  addStringSetDrift(findings, {
    title: "Host permissions",
    previous: installed.manifest.permissions.host ?? [],
    next: nextPackage.manifest.permissions.host ?? [],
    addedLevel: (value) => (value.startsWith("daemon.") ? "medium" : "low"),
  });
  addStringSetDrift(findings, {
    title: "Event permissions",
    previous: installed.manifest.permissions.events ?? [],
    next: nextPackage.manifest.permissions.events ?? [],
    addedLevel: () => "medium",
  });
  addStringSetDrift(findings, {
    title: "Extension points",
    previous: extensionPointKeys(
      installed.deploymentPlan.daemon?.extensionPoints,
    ),
    next: extensionPointKeys(
      nextPackage.deploymentPlan.daemon?.extensionPoints,
    ),
    addedLevel: (value) =>
      value.startsWith("override:override.process.launcher")
        ? "high"
        : "medium",
  });
  addStringSetDrift(findings, {
    title: "Daemon commands",
    previous: installed.commands.map((command) => command.id),
    next: nextPackage.commands.map((command) => command.id),
    addedLevel: () => "medium",
  });
  addStringSetDrift(findings, {
    title: "Extension dependencies",
    previous: installed.dependencies?.map(dependencyKey) ?? [],
    next: nextPackage.dependencies.map(dependencyKey),
    addedLevel: () => "medium",
  });

  const previousDaemon = installed.deploymentPlan.daemon?.plugin;
  const nextDaemon = nextPackage.deploymentPlan.daemon?.plugin;
  if (fileRefKey(previousDaemon) !== fileRefKey(nextDaemon)) {
    findings.push({
      level:
        previousDaemon === undefined || nextDaemon === undefined
          ? "high"
          : "medium",
      title: "Daemon payload",
      details: `${fileRefKey(previousDaemon) ?? "none"} -> ${fileRefKey(nextDaemon) ?? "none"}`,
    });
  }

  const previousSignature = signatureKey(installed.signature);
  const nextSignature = signatureKey(nextPackage.signature);
  if (previousSignature !== nextSignature) {
    findings.push({
      level:
        installed.signature !== undefined && nextPackage.signature === undefined
          ? "high"
          : "medium",
      title: "Signature trust",
      details: `${previousSignature ?? "unsigned"} -> ${nextSignature ?? "unsigned"}`,
    });
  }

  return findings;
}

function createClientExtensionEntry(
  validatedPackage: ValidatedMpxPackage,
  cachedPayloads: readonly ClientExtensionCachedPayload[],
): ClientExtensionInstallResult {
  if (!hasInstallableTarget(validatedPackage.deploymentPlan)) {
    return {
      ok: false,
      code: "deployment_target_missing",
      message: "Package has no installable client or daemon deployment target.",
    };
  }

  return {
    ok: true,
    entry: {
      id: validatedPackage.manifest.package.id,
      version: validatedPackage.manifest.package.version,
      manifest: validatedPackage.manifest,
      deploymentPlan: validatedPackage.deploymentPlan,
      uiSchema: validatedPackage.uiSchema,
      theme: validatedPackage.theme,
      resources: validatedPackage.deploymentPlan.client?.resources ?? [],
      commands: validatedPackage.commands,
      dependencies: validatedPackage.dependencies,
      ...(validatedPackage.updates === undefined
        ? {}
        : { updates: validatedPackage.updates }),
      fileDigests: validatedPackage.fileDigests,
      ...(validatedPackage.signature === undefined
        ? {}
        : { signature: validatedPackage.signature }),
      ...(cachedPayloads.length === 0 ? {} : { cachedPayloads }),
    },
  };
}

function hasInstallableTarget(deploymentPlan: MpxDeploymentPlan): boolean {
  return (
    deploymentPlan.scopes.includes("client") ||
    deploymentPlan.daemon?.plugin !== undefined
  );
}

function packagePayloadRefs(
  deploymentPlan: MpxDeploymentPlan,
): readonly ClientPayloadRef[] {
  const refs: ClientPayloadRef[] = [];
  addClientPayloadRefs(refs, deploymentPlan.client);
  addFileRef(refs, deploymentPlan.daemon?.plugin, "application/zip");
  return refs;
}

function addClientPayloadRefs(
  refs: ClientPayloadRef[],
  client: MpxDeploymentPlan["client"],
): void {
  if (client === undefined) return;
  addFileRef(refs, client.ui, undefined);
  addFileRef(refs, client.theme, "application/json");
  addFileRef(refs, client.script, "text/javascript");
  for (const resource of client.resources) {
    refs.push({
      path: resource.path,
      sha256: resource.sha256,
      mime: resource.mime,
    });
  }
}

interface ClientPayloadRef {
  readonly path: string;
  readonly sha256: string;
  readonly mime?: string;
}

function addFileRef(
  refs: ClientPayloadRef[],
  file: MpxManifestFileRef | MpxManifestScriptRef | undefined,
  mime: string | undefined,
): void {
  if (file === undefined) return;
  refs.push({
    path: file.path,
    sha256: file.sha256,
    ...(mime === undefined ? {} : { mime }),
  });
}

function addStringSetDrift(
  findings: ClientExtensionManifestDrift[],
  options: {
    readonly title: string;
    readonly previous: readonly string[];
    readonly next: readonly string[];
    readonly addedLevel: (value: string) => ClientExtensionManifestDriftLevel;
  },
): void {
  const previous = new Set(options.previous);
  const next = new Set(options.next);
  const added = [...next].filter((value) => !previous.has(value)).sort();
  const removed = [...previous].filter((value) => !next.has(value)).sort();
  if (added.length === 0 && removed.length === 0) return;

  findings.push({
    level:
      added.length === 0 ? "low" : highestLevel(added.map(options.addedLevel)),
    title: options.title,
    details: [
      added.length === 0 ? "" : `Added: ${added.join(", ")}.`,
      removed.length === 0 ? "" : `Removed: ${removed.join(", ")}.`,
    ]
      .filter(Boolean)
      .join(" "),
  });
}

function highestLevel(
  levels: readonly ClientExtensionManifestDriftLevel[],
): ClientExtensionManifestDriftLevel {
  if (levels.includes("high")) return "high";
  if (levels.includes("medium")) return "medium";
  return "low";
}

function extensionPointKeys(
  points:
    | readonly {
        readonly kind: string;
        readonly id: string;
        readonly target?: string;
      }[]
    | undefined,
): readonly string[] {
  return (points ?? [])
    .map(
      (point) =>
        `${point.kind}:${point.id}${point.target === undefined ? "" : `:${point.target}`}`,
    )
    .sort();
}

function dependencyKey(dependency: MpxManifestExtensionDependency): string {
  return `${dependency.id} ${dependency.version}`;
}

function fileRefKey(file: MpxManifestFileRef | undefined): string | undefined {
  return file === undefined ? undefined : `${file.path}@${file.sha256}`;
}

function signatureKey(
  signature: MpxPackageSignatureTrust | undefined,
): string | undefined {
  return signature === undefined
    ? undefined
    : `${signature.publisher}/${signature.keyId}/${signature.publicKeySha256}`;
}

function memoryStorageRef(extensionId: string, path: string): string {
  return `memory:${extensionId}:${path}`;
}

function indexedDbStorageRef(extensionId: string, path: string): string {
  return `${extensionId}:${path}`;
}

function isClientExtensionCacheEntry(
  value: unknown,
): value is ClientExtensionCacheEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.version === "string" &&
    isRecord(value.manifest) &&
    isRecord(value.deploymentPlan) &&
    Array.isArray(value.deploymentPlan.scopes) &&
    (value.dependencies === undefined || Array.isArray(value.dependencies)) &&
    isRecord(value.fileDigests) &&
    (value.signature === undefined || isRecord(value.signature)) &&
    (value.cachedPayloads === undefined || Array.isArray(value.cachedPayloads))
  );
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed."));
    request.onsuccess = () => resolve(request.result);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
  });
}

function deleteCursorMatches(
  request: IDBRequest<IDBCursorWithValue | null>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB cursor failed."));
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor === null) {
        resolve();
        return;
      }
      cursor.delete();
      cursor.continue();
    };
  });
}

export type ExtensionScopeKind = "client-only" | "server-only" | "both";

export function resolveExtensionScopeKind(
  entry: Pick<ClientExtensionCacheEntry, "deploymentPlan">,
): ExtensionScopeKind {
  const scopes = entry.deploymentPlan.scopes;
  const hasClient = scopes.includes("client");
  const hasServer =
    scopes.includes("daemon") ||
    entry.deploymentPlan.daemon?.plugin !== undefined;
  if (hasClient && hasServer) return "both";
  if (hasClient) return "client-only";
  return "server-only";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

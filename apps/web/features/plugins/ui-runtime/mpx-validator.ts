import { sha256Hex } from "../../../lib/daemon/binary.ts";
import { PLUGIN_HOST_CAPABILITIES, PLUGIN_HOST_EVENTS } from "./host-api.ts";
import { parsePluginRuntimeUiSchema, type PluginUiSchema } from "./schema.ts";
import {
  parsePluginRuntimeTheme,
  type PluginThemeRuntime,
} from "./theme-runtime.ts";

const ZIP_LOCAL_FILE_HEADER = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const ZIP_UTF8_FLAG = 0x0800;
const ZIP_ENCRYPTED_FLAG = 0x0001;
const ZIP_METHOD_STORED = 0;
const ZIP_METHOD_DEFLATE = 8;

const DEFAULT_LIMITS = {
  maxPackageBytes: 10 * 1024 * 1024,
  maxFiles: 64,
  maxPathLength: 180,
  maxSingleFileBytes: 2 * 1024 * 1024,
  maxUiBytes: 256 * 1024,
  maxBundleBytes: 1024 * 1024,
  maxResourceBytes: 2 * 1024 * 1024,
  maxPrivateStorageBytes: 2 * 1024 * 1024,
};

const SAFE_MVP_HOST_CAPABILITIES = new Set<string>(PLUGIN_HOST_CAPABILITIES);

const ALLOWED_EVENT_CAPABILITIES = new Set<string>(PLUGIN_HOST_EVENTS);

const ALLOWED_EXTENSION_POINT_KINDS = new Set([
  "provider",
  "registry",
  "pipeline",
  "hook",
  "override",
  "ui",
  "event",
  "command",
]);

const ALLOWED_EXTENSION_POINT_IDS = new Set([
  "provider.java",
  "provider.serverCore",
  "provider.backup",
  "provider.processLauncher",
  "registry.template",
  "registry.serverCore",
  "registry.icon",
  "registry.formatter",
  "registry.command",
  "pipeline.instance.create",
  "hook.instance.lifecycle",
  "override.process.launcher",
  "ui.panel",
  "event.daemon",
  "command.daemon",
]);

const ALLOWED_RESOURCE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const SIGNATURE_DIRECTORY = "signatures/";
const SIGNATURE_MANIFEST_PATH = "signatures/manifest.json";
const SIGNATURE_ALGORITHM = "ecdsa-p256-sha256";
const SIGNATURE_PAYLOAD_ALGORITHM = "sha256";
const SIGNATURE_INPUT_HEADER = "MCSL-MPX-SIGNATURE-v1";
const textEncoder = new TextEncoder();
const HEX_SHA256 = /^[a-f0-9]{64}$/;
const PACKAGE_ID = /^[a-z0-9][a-z0-9.-]{2,127}$/;
const SEMVER_LIKE = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const COMMAND_ID = /^[A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*$/;

type MpxPackageLimits = typeof DEFAULT_LIMITS;

export interface MpxTrustedPublisher {
  readonly publisher: string;
  readonly keyId: string;
  readonly publicKeySubjectPublicKeyInfo: ArrayBuffer | ArrayBufferView;
}

export interface MpxPackageSignatureTrust {
  readonly publisher: string;
  readonly keyId: string;
  readonly publicKeySha256: string;
  readonly signedAt?: string;
}

export interface MpxPackageValidatorOptions {
  readonly limits?: Partial<MpxPackageLimits>;
  readonly allowedHostCapabilities?: ReadonlySet<string>;
  readonly trustedPublishers?: readonly MpxTrustedPublisher[];
}

export interface MpxPackageDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface MpxManifestFileRef {
  readonly path: string;
  readonly sha256: string;
}

export interface MpxManifestScriptRef extends MpxManifestFileRef {
  readonly module?: string;
}

export interface MpxManifestResourceRef extends MpxManifestFileRef {
  readonly mime: string;
  readonly bytes: number;
}

export interface MpxManifest {
  readonly schema: string;
  readonly package: {
    readonly id: string;
    readonly version: string;
    readonly publisher?: string;
    readonly displayName?: string;
  };
  readonly runtime?: {
    readonly ui?: string;
    readonly daemonApi?: string;
    readonly javascript?: string;
  };
  readonly targets?: {
    readonly client?: {
      readonly ui?: MpxManifestFileRef;
      readonly theme?: MpxManifestFileRef;
    };
    readonly daemon?: {
      readonly plugin?: MpxManifestFileRef;
    };
  };
  readonly entry?: {
    readonly ui?: MpxManifestFileRef;
    readonly script?: MpxManifestScriptRef;
  };
  readonly permissions: {
    readonly host?: readonly string[];
    readonly events?: readonly string[];
    readonly network?: readonly string[];
    readonly storage?: { readonly privateBytes?: number };
  };
  readonly resources?: readonly MpxManifestResourceRef[];
  readonly extensionPoints?: readonly MpxManifestExtensionPoint[];
  readonly commands?: readonly MpxManifestCommand[];
  readonly integrity: {
    readonly algorithm: "sha256";
    readonly signed?: boolean;
  };
}

export interface MpxManifestExtensionPoint {
  readonly kind: string;
  readonly id: string;
  readonly target?: "client" | "daemon";
}

export interface MpxManifestCommand {
  readonly id: string;
  readonly title?: string;
  readonly description?: string;
  readonly target?: "daemon";
}

export interface MpxDeploymentPlan {
  readonly scopes: readonly ("client" | "daemon")[];
  readonly client?: {
    readonly ui?: MpxManifestFileRef;
    readonly theme?: MpxManifestFileRef;
    readonly script?: MpxManifestScriptRef;
    readonly resources: readonly MpxManifestResourceRef[];
  };
  readonly daemon?: {
    readonly plugin?: MpxManifestFileRef;
    readonly extensionPoints: readonly MpxManifestExtensionPoint[];
    readonly commands: readonly MpxManifestCommand[];
  };
}

export interface ValidatedMpxPackage {
  readonly manifest: MpxManifest;
  readonly uiSchema?: PluginUiSchema;
  readonly theme?: PluginThemeRuntime;
  readonly deploymentPlan: MpxDeploymentPlan;
  readonly commands: readonly MpxManifestCommand[];
  readonly fileDigests: Readonly<Record<string, string>>;
  readonly totalUncompressedBytes: number;
  readonly signature?: MpxPackageSignatureTrust;
}

export type MpxPackageValidationResult =
  | { readonly ok: true; readonly package: ValidatedMpxPackage }
  | {
      readonly ok: false;
      readonly diagnostics: readonly MpxPackageDiagnostic[];
    };

export type MpxPackageFileExtractionResult =
  | { readonly ok: true; readonly files: ReadonlyMap<string, Uint8Array> }
  | {
      readonly ok: false;
      readonly diagnostics: readonly MpxPackageDiagnostic[];
    };

interface ZipEntryMetadata {
  readonly path: string;
  readonly compressionMethod: number;
  readonly compressedSize: number;
  readonly uncompressedSize: number;
  readonly localHeaderOffset: number;
}

interface ZipEntry extends ZipEntryMetadata {
  readonly bytes: Uint8Array;
}

export async function extractMpxPackageFiles(
  packageBytes: ArrayBuffer | ArrayBufferView,
  paths: Iterable<string>,
  options: MpxPackageValidatorOptions = {},
): Promise<MpxPackageFileExtractionResult> {
  const limits = { ...DEFAULT_LIMITS, ...options.limits };
  const diagnostics: MpxPackageDiagnostic[] = [];
  const bytes = toBytes(packageBytes);
  const zip = await readZipEntries(bytes, limits, diagnostics);
  if (!zip) return { ok: false, diagnostics };

  const files = new Map<string, Uint8Array>();
  for (const path of new Set(paths)) {
    const entry = zip.get(path);
    if (entry === undefined) {
      diagnostics.push(
        diagnostic(
          "payload_missing",
          path,
          `Payload file '${path}' is missing from the package.`,
        ),
      );
      continue;
    }

    files.set(path, new Uint8Array(entry.bytes));
  }

  if (diagnostics.length > 0) return { ok: false, diagnostics };
  return { ok: true, files };
}

export async function validateMpxPackage(
  packageBytes: ArrayBuffer | ArrayBufferView,
  options: MpxPackageValidatorOptions = {},
): Promise<MpxPackageValidationResult> {
  const limits = { ...DEFAULT_LIMITS, ...options.limits };
  const allowedHostCapabilities =
    options.allowedHostCapabilities ?? SAFE_MVP_HOST_CAPABILITIES;
  const diagnostics: MpxPackageDiagnostic[] = [];
  const bytes = toBytes(packageBytes);

  if (bytes.byteLength > limits.maxPackageBytes) {
    diagnostics.push(
      diagnostic(
        "package_too_large",
        "$",
        `Package exceeds ${limits.maxPackageBytes} bytes.`,
      ),
    );
    return { ok: false, diagnostics };
  }

  const zip = await readZipEntries(bytes, limits, diagnostics);
  if (!zip) return { ok: false, diagnostics };

  const manifestEntry = zip.get("manifest.json");
  if (!manifestEntry) {
    diagnostics.push(
      diagnostic(
        "manifest_missing",
        "manifest.json",
        "manifest.json is required.",
      ),
    );
    return { ok: false, diagnostics };
  }

  const manifest = parseManifest(manifestEntry, diagnostics);
  if (!manifest) return { ok: false, diagnostics };

  validateManifest(manifest, allowedHostCapabilities, limits, diagnostics);
  rejectUnexpectedSignatureEntries(zip.keys(), manifest, diagnostics);
  const signature = await validatePackageSignature(
    zip,
    manifest,
    options.trustedPublishers ?? [],
    diagnostics,
  );
  if (diagnostics.length > 0) return { ok: false, diagnostics };

  const declaredCommands = collectDeclaredCommands(manifest);

  const declared = collectDeclaredFiles(manifest, diagnostics);
  if (diagnostics.length > 0) return { ok: false, diagnostics };

  for (const path of zip.keys()) {
    if (path === "manifest.json" || path.startsWith("signatures/")) continue;
    if (!declared.has(path)) {
      diagnostics.push(
        diagnostic(
          "file_undeclared",
          path,
          "Payload files must be declared in manifest entry or resources.",
        ),
      );
    }
  }

  const uiRef = selectClientUiRef(manifest);
  const themeRef = selectClientThemeRef(manifest);
  const scriptRef = selectScriptRef(manifest);
  const daemonPluginRef = selectDaemonPluginRef(manifest);
  const fileDigests: Record<string, string> = {};
  if (uiRef !== undefined) {
    await validatePayloadFile(
      zip,
      uiRef.ref,
      uiRef.path,
      limits.maxUiBytes,
      fileDigests,
      diagnostics,
    );
  }
  let theme: PluginThemeRuntime | undefined;
  if (themeRef !== undefined) {
    await validatePayloadFile(
      zip,
      themeRef.ref,
      themeRef.path,
      limits.maxUiBytes,
      fileDigests,
      diagnostics,
    );
    const themeEntry = zip.get(themeRef.ref.path);
    if (themeEntry !== undefined) {
      const parsedTheme = parsePluginRuntimeTheme(decodeUtf8(themeEntry.bytes));
      if (!parsedTheme.ok) {
        diagnostics.push(
          ...parsedTheme.diagnostics.map((diagnostic) => ({
            code: diagnostic.code,
            path: `${themeRef.path}${diagnostic.path.slice(1)}`,
            message: diagnostic.message,
          })),
        );
      } else {
        theme = parsedTheme.theme;
      }
    }
  }
  if (scriptRef !== undefined) {
    await validatePayloadFile(
      zip,
      scriptRef.ref,
      scriptRef.path,
      limits.maxBundleBytes,
      fileDigests,
      diagnostics,
    );
  }

  if (daemonPluginRef !== undefined) {
    await validatePayloadFile(
      zip,
      daemonPluginRef.ref,
      daemonPluginRef.path,
      limits.maxSingleFileBytes,
      fileDigests,
      diagnostics,
    );
  }

  for (const [index, resource] of (manifest.resources ?? []).entries()) {
    await validatePayloadFile(
      zip,
      resource,
      `$.resources[${index}]`,
      Math.min(resource.bytes, limits.maxResourceBytes),
      fileDigests,
      diagnostics,
    );
  }

  let uiSchema: PluginUiSchema | undefined;
  if (uiRef !== undefined) {
    const uiEntry = zip.get(uiRef.ref.path);
    if (uiEntry) {
      const parsed = parsePluginRuntimeUiSchema(decodeUtf8(uiEntry.bytes));
      if (parsed.ok) {
        uiSchema = parsed.schema;
        validateUiCommandBindings(uiSchema, declaredCommands, diagnostics);
      } else {
        for (const issue of parsed.diagnostics) {
          diagnostics.push(
            diagnostic(
              `ui_${issue.code}`,
              `${uiRef.path}:${issue.path}`,
              issue.message,
            ),
          );
        }
      }
    }
  }

  if (diagnostics.length > 0) return { ok: false, diagnostics };

  const deploymentPlan = buildDeploymentPlan(
    manifest,
    uiRef,
    themeRef,
    scriptRef,
    daemonPluginRef,
  );

  return {
    ok: true,
    package: {
      manifest,
      uiSchema,
      theme,
      deploymentPlan,
      commands: manifest.commands ?? [],
      fileDigests,
      totalUncompressedBytes: Array.from(zip.values()).reduce(
        (total, entry) => total + entry.uncompressedSize,
        0,
      ),
      ...(signature === undefined ? {} : { signature }),
    },
  };
}

function parseManifest(
  entry: ZipEntry,
  diagnostics: MpxPackageDiagnostic[],
): MpxManifest | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeUtf8(entry.bytes));
  } catch (error) {
    diagnostics.push(
      diagnostic(
        "manifest_parse_failed",
        "manifest.json",
        error instanceof Error
          ? error.message
          : "manifest.json is not valid JSON.",
      ),
    );
    return null;
  }

  if (!isRecord(parsed)) {
    diagnostics.push(
      diagnostic(
        "manifest_invalid",
        "manifest.json",
        "Manifest must be an object.",
      ),
    );
    return null;
  }

  return parsed as unknown as MpxManifest;
}

function validateManifest(
  manifest: MpxManifest,
  allowedHostCapabilities: ReadonlySet<string>,
  limits: MpxPackageLimits,
  diagnostics: MpxPackageDiagnostic[],
): void {
  if (!isRecord(manifest.package)) {
    diagnostics.push(
      diagnostic(
        "manifest_package_missing",
        "$.package",
        "package is required.",
      ),
    );
    return;
  }

  if (
    typeof manifest.package.id !== "string" ||
    !PACKAGE_ID.test(manifest.package.id)
  ) {
    diagnostics.push(
      diagnostic(
        "package_id_invalid",
        "$.package.id",
        "Package id is invalid.",
      ),
    );
  }

  if (
    typeof manifest.package.version !== "string" ||
    !SEMVER_LIKE.test(manifest.package.version)
  ) {
    diagnostics.push(
      diagnostic(
        "package_version_invalid",
        "$.package.version",
        "Package version must be semver-like.",
      ),
    );
  }

  const uiRef = selectClientUiRef(manifest);
  const themeRef = selectClientThemeRef(manifest);
  const daemonPluginRef = selectDaemonPluginRef(manifest);

  if (uiRef !== undefined && typeof manifest.runtime?.ui !== "string") {
    diagnostics.push(
      diagnostic(
        "runtime_ui_missing",
        "$.runtime.ui",
        "runtime.ui is required when targets.client.ui is declared.",
      ),
    );
  }

  const targets = manifest.targets;
  if (targets !== undefined) {
    if (!isRecord(targets)) {
      diagnostics.push(
        diagnostic(
          "targets_invalid",
          "$.targets",
          "targets must be an object.",
        ),
      );
    } else {
      validateKnownKeys(
        targets,
        "$.targets",
        ["client", "daemon"],
        diagnostics,
      );
      if (targets.client !== undefined) {
        if (!isRecord(targets.client)) {
          diagnostics.push(
            diagnostic(
              "target_client_invalid",
              "$.targets.client",
              "targets.client must be an object.",
            ),
          );
        } else {
          validateKnownKeys(
            targets.client,
            "$.targets.client",
            ["ui", "theme"],
            diagnostics,
          );
          if (targets.client.ui !== undefined) {
            validateManifestFileRef(
              targets.client.ui,
              "$.targets.client.ui",
              diagnostics,
            );
          }
          if (targets.client.theme !== undefined) {
            validateManifestFileRef(
              targets.client.theme,
              "$.targets.client.theme",
              diagnostics,
            );
          }
        }
      }
      if (targets.daemon !== undefined) {
        if (!isRecord(targets.daemon)) {
          diagnostics.push(
            diagnostic(
              "target_daemon_invalid",
              "$.targets.daemon",
              "targets.daemon must be an object.",
            ),
          );
        } else {
          validateKnownKeys(
            targets.daemon,
            "$.targets.daemon",
            ["plugin"],
            diagnostics,
          );
          if (targets.daemon.plugin !== undefined) {
            validateManifestFileRef(
              targets.daemon.plugin,
              "$.targets.daemon.plugin",
              diagnostics,
            );
            validateDaemonBundleRef(
              targets.daemon.plugin,
              "$.targets.daemon.plugin",
              diagnostics,
            );
          }
        }
      }
    }
  }

  if (manifest.entry !== undefined) {
    if (!isRecord(manifest.entry)) {
      diagnostics.push(
        diagnostic("entry_invalid", "$.entry", "entry must be an object."),
      );
    } else {
      if (manifest.entry.ui !== undefined) {
        validateManifestFileRef(manifest.entry.ui, "$.entry.ui", diagnostics);
      }
      if (manifest.entry.script !== undefined) {
        validateManifestFileRef(
          manifest.entry.script,
          "$.entry.script",
          diagnostics,
        );
      }
      if (
        manifest.entry.script?.module !== undefined &&
        manifest.entry.script.module !== "esm"
      ) {
        diagnostics.push(
          diagnostic(
            "script_module_invalid",
            "$.entry.script.module",
            "Only ESM plugin bundles are allowed.",
          ),
        );
      }
    }
  }

  if (
    uiRef === undefined &&
    themeRef === undefined &&
    daemonPluginRef === undefined &&
    !(
      manifest.targets?.client !== undefined &&
      (manifest.resources ?? []).length > 0
    )
  ) {
    diagnostics.push(
      diagnostic(
        "target_missing",
        "$.targets",
        "Extension package must declare at least one supported client or daemon target.",
      ),
    );
  }

  validateExtensionPoints(manifest.extensionPoints, diagnostics);
  validateCommands(manifest, daemonPluginRef, diagnostics);
  validatePluginExtensionEvents(manifest, daemonPluginRef, diagnostics);

  if (manifest.integrity?.algorithm !== "sha256") {
    diagnostics.push(
      diagnostic(
        "integrity_algorithm_invalid",
        "$.integrity.algorithm",
        "Only sha256 package integrity is supported.",
      ),
    );
  }

  const hostCapabilities = manifest.permissions?.host ?? [];
  if (!Array.isArray(hostCapabilities)) {
    diagnostics.push(
      diagnostic(
        "host_permissions_invalid",
        "$.permissions.host",
        "host permissions must be an array.",
      ),
    );
  } else {
    const seen = new Set<string>();
    hostCapabilities.forEach((capability, index) => {
      const path = `$.permissions.host[${index}]`;
      if (typeof capability !== "string") {
        diagnostics.push(
          diagnostic(
            "capability_invalid",
            path,
            "Capability must be a string.",
          ),
        );
        return;
      }
      if (seen.has(capability)) {
        diagnostics.push(
          diagnostic("capability_duplicate", path, "Capability is duplicated."),
        );
      }
      seen.add(capability);
      if (!allowedHostCapabilities.has(capability)) {
        diagnostics.push(
          diagnostic(
            "capability_unknown_or_unsupported",
            path,
            `Capability '${capability}' is not allowed by the Web MVP host.`,
          ),
        );
      }
    });
  }

  const events = manifest.permissions?.events ?? [];
  if (!Array.isArray(events)) {
    diagnostics.push(
      diagnostic(
        "event_permissions_invalid",
        "$.permissions.events",
        "events must be an array.",
      ),
    );
  } else {
    const packageId =
      isRecord(manifest.package) && typeof manifest.package.id === "string"
        ? manifest.package.id
        : "";
    events.forEach((event, index) => {
      if (
        typeof event !== "string" ||
        !isAllowedEventPermission(event, packageId)
      ) {
        diagnostics.push(
          diagnostic(
            "event_permission_unknown",
            `$.permissions.events[${index}]`,
            "Event permission is not in the allowlist.",
          ),
        );
      }
    });
  }

  if ((manifest.permissions?.network ?? []).length > 0) {
    diagnostics.push(
      diagnostic(
        "network_permissions_unsupported",
        "$.permissions.network",
        "Network access is disabled for Web MVP plugins.",
      ),
    );
  }

  const privateBytes = manifest.permissions?.storage?.privateBytes;
  if (
    privateBytes !== undefined &&
    (!Number.isInteger(privateBytes) ||
      privateBytes < 0 ||
      privateBytes > limits.maxPrivateStorageBytes)
  ) {
    diagnostics.push(
      diagnostic(
        "storage_quota_invalid",
        "$.permissions.storage.privateBytes",
        `Private storage quota must be between 0 and ${limits.maxPrivateStorageBytes}.`,
      ),
    );
  }

  if (manifest.resources !== undefined) {
    if (!Array.isArray(manifest.resources)) {
      diagnostics.push(
        diagnostic(
          "resources_invalid",
          "$.resources",
          "resources must be an array.",
        ),
      );
    } else {
      manifest.resources.forEach((resource, index) => {
        const path = `$.resources[${index}]`;
        validateManifestFileRef(resource, path, diagnostics);
        if (!ALLOWED_RESOURCE_MIME.has(resource.mime)) {
          diagnostics.push(
            diagnostic(
              "resource_mime_invalid",
              `${path}.mime`,
              "Resource MIME is not allowed.",
            ),
          );
        }
        if (
          !Number.isInteger(resource.bytes) ||
          resource.bytes < 0 ||
          resource.bytes > limits.maxResourceBytes
        ) {
          diagnostics.push(
            diagnostic(
              "resource_size_invalid",
              `${path}.bytes`,
              `Resource bytes must be between 0 and ${limits.maxResourceBytes}.`,
            ),
          );
        }
      });
    }
  }
}

function validateKnownKeys(
  value: Record<string, unknown>,
  path: string,
  allowed: readonly string[],
  diagnostics: MpxPackageDiagnostic[],
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      diagnostics.push(
        diagnostic(
          "target_unknown",
          `${path}.${key}`,
          `Target property '${key}' is not supported by this package validator.`,
        ),
      );
    }
  }
}

function selectClientUiRef(
  manifest: MpxManifest,
): { readonly ref: MpxManifestFileRef; readonly path: string } | undefined {
  if (manifest.targets?.client?.ui !== undefined) {
    return { ref: manifest.targets.client.ui, path: "$.targets.client.ui" };
  }
  if (manifest.entry?.ui !== undefined) {
    return { ref: manifest.entry.ui, path: "$.entry.ui" };
  }
  return undefined;
}

function selectClientThemeRef(
  manifest: MpxManifest,
): { readonly ref: MpxManifestFileRef; readonly path: string } | undefined {
  if (manifest.targets?.client?.theme !== undefined) {
    return {
      ref: manifest.targets.client.theme,
      path: "$.targets.client.theme",
    };
  }
  return undefined;
}

function selectScriptRef(
  manifest: MpxManifest,
): { readonly ref: MpxManifestScriptRef; readonly path: string } | undefined {
  return manifest.entry?.script === undefined
    ? undefined
    : { ref: manifest.entry.script, path: "$.entry.script" };
}

function selectDaemonPluginRef(
  manifest: MpxManifest,
): { readonly ref: MpxManifestFileRef; readonly path: string } | undefined {
  return manifest.targets?.daemon?.plugin === undefined
    ? undefined
    : { ref: manifest.targets.daemon.plugin, path: "$.targets.daemon.plugin" };
}

function buildDeploymentPlan(
  manifest: MpxManifest,
  uiRef:
    | { readonly ref: MpxManifestFileRef; readonly path: string }
    | undefined,
  themeRef:
    | { readonly ref: MpxManifestFileRef; readonly path: string }
    | undefined,
  scriptRef:
    | { readonly ref: MpxManifestScriptRef; readonly path: string }
    | undefined,
  daemonPluginRef:
    | { readonly ref: MpxManifestFileRef; readonly path: string }
    | undefined,
): MpxDeploymentPlan {
  const scopes: ("client" | "daemon")[] = [];
  const hasClientResources =
    manifest.targets?.client !== undefined &&
    (manifest.resources ?? []).length > 0;
  const client =
    uiRef !== undefined ||
    themeRef !== undefined ||
    scriptRef !== undefined ||
    hasClientResources
      ? {
          ...(uiRef === undefined ? {} : { ui: uiRef.ref }),
          ...(themeRef === undefined ? {} : { theme: themeRef.ref }),
          ...(scriptRef === undefined ? {} : { script: scriptRef.ref }),
          resources: manifest.resources ?? [],
        }
      : undefined;
  const daemon =
    daemonPluginRef !== undefined
      ? {
          plugin: daemonPluginRef.ref,
          extensionPoints: manifest.extensionPoints ?? [],
          commands: manifest.commands ?? [],
        }
      : undefined;

  if (client !== undefined) scopes.push("client");
  if (daemon !== undefined) scopes.push("daemon");

  return {
    scopes,
    ...(client === undefined ? {} : { client }),
    ...(daemon === undefined ? {} : { daemon }),
  };
}

interface MpxSignatureManifest {
  readonly schema?: string;
  readonly algorithm?: string;
  readonly publisher?: string;
  readonly packageId?: string;
  readonly packageVersion?: string;
  readonly keyId?: string;
  readonly publicKeySha256?: string;
  readonly signedAt?: string;
  readonly payload?: {
    readonly algorithm?: string;
    readonly entries?: readonly MpxSignatureEntry[];
  };
  readonly signature?: string;
}

interface MpxSignatureEntry {
  readonly path?: string;
  readonly sha256?: string;
}

async function validatePackageSignature(
  zip: ReadonlyMap<string, ZipEntry>,
  manifest: MpxManifest,
  trustedPublishers: readonly MpxTrustedPublisher[],
  diagnostics: MpxPackageDiagnostic[],
): Promise<MpxPackageSignatureTrust | undefined> {
  if (manifest.integrity?.signed !== true) return undefined;

  const signatureEntry = zip.get(SIGNATURE_MANIFEST_PATH);
  if (signatureEntry === undefined) {
    diagnostics.push(
      diagnostic(
        "signature_manifest_missing",
        SIGNATURE_MANIFEST_PATH,
        "Signed packages must include signatures/manifest.json.",
      ),
    );
    return undefined;
  }

  for (const path of zip.keys()) {
    if (
      path.startsWith(SIGNATURE_DIRECTORY) &&
      path !== SIGNATURE_MANIFEST_PATH
    ) {
      diagnostics.push(
        diagnostic(
          "signature_unexpected",
          path,
          "Only signatures/manifest.json is supported for signed .mpx packages.",
        ),
      );
    }
  }

  const signatureManifest = parseSignatureManifest(signatureEntry, diagnostics);
  if (signatureManifest === undefined) return undefined;

  if (signatureManifest.algorithm !== SIGNATURE_ALGORITHM) {
    diagnostics.push(
      diagnostic(
        "signature_algorithm_unsupported",
        "$.algorithm",
        `Only ${SIGNATURE_ALGORITHM} signatures are supported.`,
      ),
    );
  }
  if (signatureManifest.payload?.algorithm !== SIGNATURE_PAYLOAD_ALGORITHM) {
    diagnostics.push(
      diagnostic(
        "signature_payload_algorithm_invalid",
        "$.payload.algorithm",
        "Only sha256 payload digests are supported.",
      ),
    );
  }

  if (
    typeof manifest.package.publisher !== "string" ||
    manifest.package.publisher.length === 0
  ) {
    diagnostics.push(
      diagnostic(
        "signature_publisher_missing",
        "$.package.publisher",
        "Signed packages must declare package.publisher.",
      ),
    );
  }
  if (signatureManifest.publisher !== manifest.package.publisher) {
    diagnostics.push(
      diagnostic(
        "signature_publisher_mismatch",
        "$.publisher",
        "Signature publisher must match package.publisher.",
      ),
    );
  }
  if (signatureManifest.packageId !== manifest.package.id) {
    diagnostics.push(
      diagnostic(
        "signature_package_mismatch",
        "$.packageId",
        "Signature packageId must match package.id.",
      ),
    );
  }
  if (signatureManifest.packageVersion !== manifest.package.version) {
    diagnostics.push(
      diagnostic(
        "signature_version_mismatch",
        "$.packageVersion",
        "Signature packageVersion must match package.version.",
      ),
    );
  }
  if (
    typeof signatureManifest.keyId !== "string" ||
    signatureManifest.keyId.length === 0
  ) {
    diagnostics.push(
      diagnostic(
        "signature_key_missing",
        "$.keyId",
        "Signed packages must declare keyId.",
      ),
    );
  }
  if (
    typeof signatureManifest.publicKeySha256 !== "string" ||
    !HEX_SHA256.test(signatureManifest.publicKeySha256)
  ) {
    diagnostics.push(
      diagnostic(
        "signature_key_fingerprint_invalid",
        "$.publicKeySha256",
        "publicKeySha256 must be a lowercase SHA-256 fingerprint.",
      ),
    );
  }
  if (
    typeof signatureManifest.signature !== "string" ||
    signatureManifest.signature.length === 0
  ) {
    diagnostics.push(
      diagnostic(
        "signature_missing",
        "$.signature",
        "Signed packages must include a signature value.",
      ),
    );
  }

  const actualEntries = await buildSignatureEntries(zip);
  if (
    !signatureEntriesMatch(signatureManifest.payload?.entries, actualEntries)
  ) {
    diagnostics.push(
      diagnostic(
        "signature_payload_mismatch",
        "$.payload.entries",
        "Signature payload entries must exactly match package contents.",
      ),
    );
  }

  if (diagnostics.length > 0) return undefined;

  if (trustedPublishers.length === 0) {
    diagnostics.push(
      diagnostic(
        "signature_trust_unavailable",
        "$.publisher",
        "Signed .mpx packages require a trusted publisher key before admission.",
      ),
    );
    return undefined;
  }

  let trusted: MpxTrustedPublisher | undefined;
  for (const candidate of trustedPublishers) {
    const keyBytes = toBytes(candidate.publicKeySubjectPublicKeyInfo);
    const keySha256 = await sha256Hex(keyBytes);
    if (
      candidate.publisher === signatureManifest.publisher &&
      candidate.keyId === signatureManifest.keyId &&
      keySha256 === signatureManifest.publicKeySha256
    ) {
      trusted = candidate;
      break;
    }
  }

  if (trusted === undefined) {
    diagnostics.push(
      diagnostic(
        "signature_key_untrusted",
        "$.publicKeySha256",
        "The package signing key is not trusted for this publisher.",
      ),
    );
    return undefined;
  }

  const subtle = globalThis.crypto?.subtle;
  if (subtle === undefined) {
    diagnostics.push(
      diagnostic(
        "signature_verification_unavailable",
        "$.signature",
        "WebCrypto is unavailable, so package signatures cannot be verified.",
      ),
    );
    return undefined;
  }

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = decodeBase64(signatureManifest.signature!);
  } catch {
    diagnostics.push(
      diagnostic(
        "signature_invalid",
        "$.signature",
        "Signature must be base64-encoded.",
      ),
    );
    return undefined;
  }

  try {
    const key = await subtle.importKey(
      "spki",
      toArrayBuffer(toBytes(trusted.publicKeySubjectPublicKeyInfo)),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    const valid = await subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      toArrayBuffer(signatureBytes),
      toArrayBuffer(buildSignatureInput(signatureManifest, actualEntries)),
    );
    if (!valid) {
      diagnostics.push(
        diagnostic(
          "signature_invalid",
          "$.signature",
          "Package signature verification failed.",
        ),
      );
      return undefined;
    }
  } catch (error) {
    diagnostics.push(
      diagnostic(
        "signature_invalid",
        "$.signature",
        error instanceof Error
          ? error.message
          : "Package signature verification failed.",
      ),
    );
    return undefined;
  }

  if (
    signatureManifest.signedAt !== undefined &&
    Number.isNaN(Date.parse(signatureManifest.signedAt))
  ) {
    diagnostics.push(
      diagnostic(
        "signature_signed_at_invalid",
        "$.signedAt",
        "signedAt must be an ISO 8601 timestamp when present.",
      ),
    );
    return undefined;
  }

  return {
    publisher: signatureManifest.publisher!,
    keyId: signatureManifest.keyId!,
    publicKeySha256: signatureManifest.publicKeySha256!,
    ...(signatureManifest.signedAt === undefined
      ? {}
      : { signedAt: signatureManifest.signedAt }),
  };
}

function parseSignatureManifest(
  entry: ZipEntry,
  diagnostics: MpxPackageDiagnostic[],
): MpxSignatureManifest | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeUtf8(entry.bytes));
  } catch (error) {
    diagnostics.push(
      diagnostic(
        "signature_manifest_parse_failed",
        SIGNATURE_MANIFEST_PATH,
        error instanceof Error
          ? error.message
          : "signatures/manifest.json is not valid JSON.",
      ),
    );
    return undefined;
  }

  if (!isRecord(parsed)) {
    diagnostics.push(
      diagnostic(
        "signature_manifest_invalid",
        SIGNATURE_MANIFEST_PATH,
        "Signature manifest must be an object.",
      ),
    );
    return undefined;
  }

  return parsed as MpxSignatureManifest;
}

async function buildSignatureEntries(
  zip: ReadonlyMap<string, ZipEntry>,
): Promise<readonly Required<MpxSignatureEntry>[]> {
  const entries: Required<MpxSignatureEntry>[] = [];
  for (const [path, entry] of zip) {
    if (path.startsWith(SIGNATURE_DIRECTORY)) continue;
    entries.push({ path, sha256: await sha256Hex(entry.bytes) });
  }
  return entries.sort((left, right) => left.path.localeCompare(right.path));
}

function signatureEntriesMatch(
  declared: readonly MpxSignatureEntry[] | undefined,
  actual: readonly Required<MpxSignatureEntry>[],
): boolean {
  if (declared === undefined || declared.length !== actual.length) return false;
  const ordered = [...declared].sort((left, right) =>
    String(left.path ?? "").localeCompare(String(right.path ?? "")),
  );
  for (let index = 0; index < actual.length; index++) {
    if (
      ordered[index]?.path !== actual[index]?.path ||
      ordered[index]?.sha256 !== actual[index]?.sha256
    ) {
      return false;
    }
  }
  return true;
}

function buildSignatureInput(
  document: MpxSignatureManifest,
  entries: readonly Required<MpxSignatureEntry>[],
): Uint8Array {
  const lines = [
    SIGNATURE_INPUT_HEADER,
    signatureField("algorithm", document.algorithm),
    signatureField("publisher", document.publisher),
    signatureField("packageId", document.packageId),
    signatureField("packageVersion", document.packageVersion),
    signatureField("keyId", document.keyId),
    signatureField("publicKeySha256", document.publicKeySha256),
    signatureField("signedAt", document.signedAt),
    signatureField("payloadAlgorithm", document.payload?.algorithm),
    ...entries.map((entry) => `entry:${entry.path}:${entry.sha256}`),
  ];
  return textEncoder.encode(`${lines.join("\n")}\n`);
}

function signatureField(key: string, value: string | undefined): string {
  return `${key}:${value ?? ""}`;
}

function decodeBase64(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function rejectUnexpectedSignatureEntries(
  paths: Iterable<string>,
  manifest: MpxManifest,
  diagnostics: MpxPackageDiagnostic[],
): void {
  if (manifest.integrity?.signed === true) return;
  for (const path of paths) {
    if (path.startsWith(SIGNATURE_DIRECTORY)) {
      diagnostics.push(
        diagnostic(
          "signature_unexpected",
          path,
          "Signature payloads are only accepted for signed packages.",
        ),
      );
    }
  }
}

function validateExtensionPoints(
  extensionPoints: readonly MpxManifestExtensionPoint[] | undefined,
  diagnostics: MpxPackageDiagnostic[],
): void {
  if (extensionPoints === undefined) return;
  if (!Array.isArray(extensionPoints)) {
    diagnostics.push(
      diagnostic(
        "extension_points_invalid",
        "$.extensionPoints",
        "extensionPoints must be an array.",
      ),
    );
    return;
  }

  const seen = new Set<string>();
  extensionPoints.forEach((extensionPoint, index) => {
    const path = `$.extensionPoints[${index}]`;
    if (!isRecord(extensionPoint)) {
      diagnostics.push(
        diagnostic(
          "extension_point_invalid",
          path,
          "Extension point declaration must be an object.",
        ),
      );
      return;
    }

    if (
      typeof extensionPoint.kind !== "string" ||
      !ALLOWED_EXTENSION_POINT_KINDS.has(extensionPoint.kind)
    ) {
      diagnostics.push(
        diagnostic(
          "extension_point_kind_unknown",
          `${path}.kind`,
          "Extension point kind is not supported.",
        ),
      );
    }

    if (
      typeof extensionPoint.id !== "string" ||
      !ALLOWED_EXTENSION_POINT_IDS.has(extensionPoint.id)
    ) {
      diagnostics.push(
        diagnostic(
          "extension_point_unknown",
          `${path}.id`,
          "Extension point id is not supported by this package validator.",
        ),
      );
    } else if (!seen.add(extensionPoint.id)) {
      diagnostics.push(
        diagnostic(
          "extension_point_duplicate",
          `${path}.id`,
          "Extension point id is duplicated.",
        ),
      );
    }

    if (
      extensionPoint.target !== undefined &&
      extensionPoint.target !== "client" &&
      extensionPoint.target !== "daemon"
    ) {
      diagnostics.push(
        diagnostic(
          "extension_point_target_unknown",
          `${path}.target`,
          "Extension point target must be client or daemon.",
        ),
      );
    }
  });
}

function validatePluginExtensionEvents(
  manifest: MpxManifest,
  daemonPluginRef:
    | { readonly ref: MpxManifestFileRef; readonly path: string }
    | undefined,
  diagnostics: MpxPackageDiagnostic[],
): void {
  const packageId =
    isRecord(manifest.package) && typeof manifest.package.id === "string"
      ? manifest.package.id
      : "";
  const eventName = `plugin.${packageId}.event.extension`;
  if (!(manifest.permissions?.events ?? []).includes(eventName)) return;

  if (daemonPluginRef === undefined) {
    diagnostics.push(
      diagnostic(
        "event_daemon_target_missing",
        "$.targets.daemon.plugin",
        "Plugin-owned extension events require a daemon plugin payload.",
      ),
    );
  }
  if (!hasDaemonEventExtensionPoint(manifest.extensionPoints)) {
    diagnostics.push(
      diagnostic(
        "event_extension_point_missing",
        "$.extensionPoints",
        "Plugin-owned extension events require the event.daemon extension point.",
      ),
    );
  }
}

function hasDaemonEventExtensionPoint(
  extensionPoints: readonly MpxManifestExtensionPoint[] | undefined,
): boolean {
  return (extensionPoints ?? []).some(
    (extensionPoint) =>
      extensionPoint.kind === "event" &&
      extensionPoint.id === "event.daemon" &&
      (extensionPoint.target === undefined ||
        extensionPoint.target === "daemon"),
  );
}

function validateCommands(
  manifest: MpxManifest,
  daemonPluginRef:
    | { readonly ref: MpxManifestFileRef; readonly path: string }
    | undefined,
  diagnostics: MpxPackageDiagnostic[],
): void {
  if (manifest.commands === undefined) return;
  if (!Array.isArray(manifest.commands)) {
    diagnostics.push(
      diagnostic(
        "commands_invalid",
        "$.commands",
        "commands must be an array.",
      ),
    );
    return;
  }

  const seen = new Set<string>();
  for (const [index, command] of manifest.commands.entries()) {
    const path = `$.commands[${index}]`;
    if (!isRecord(command)) {
      diagnostics.push(
        diagnostic(
          "command_invalid",
          path,
          "Command declaration must be an object.",
        ),
      );
      continue;
    }

    if (typeof command.id !== "string" || !COMMAND_ID.test(command.id)) {
      diagnostics.push(
        diagnostic(
          "command_id_invalid",
          `${path}.id`,
          "Command id must be canonical.",
        ),
      );
    } else if (!seen.add(command.id)) {
      diagnostics.push(
        diagnostic(
          "command_duplicate",
          `${path}.id`,
          "Command id is duplicated.",
        ),
      );
    }

    if (command.title !== undefined && typeof command.title !== "string") {
      diagnostics.push(
        diagnostic(
          "command_title_invalid",
          `${path}.title`,
          "Command title must be a string.",
        ),
      );
    }
    if (
      command.description !== undefined &&
      typeof command.description !== "string"
    ) {
      diagnostics.push(
        diagnostic(
          "command_description_invalid",
          `${path}.description`,
          "Command description must be a string.",
        ),
      );
    }
    if (command.target !== undefined && command.target !== "daemon") {
      diagnostics.push(
        diagnostic(
          "command_target_invalid",
          `${path}.target`,
          "Command target must be daemon.",
        ),
      );
    }
  }

  if (manifest.commands.length === 0) return;
  if (daemonPluginRef === undefined) {
    diagnostics.push(
      diagnostic(
        "command_daemon_target_missing",
        "$.targets.daemon.plugin",
        "Daemon-backed commands require a daemon plugin payload.",
      ),
    );
  }
  if (!hasDaemonCommandExtensionPoint(manifest.extensionPoints)) {
    diagnostics.push(
      diagnostic(
        "command_extension_point_missing",
        "$.extensionPoints",
        "Daemon-backed commands require the command.daemon extension point.",
      ),
    );
  }
}

function hasDaemonCommandExtensionPoint(
  extensionPoints: readonly MpxManifestExtensionPoint[] | undefined,
): boolean {
  return (extensionPoints ?? []).some(
    (extensionPoint) =>
      extensionPoint.kind === "command" &&
      extensionPoint.id === "command.daemon" &&
      (extensionPoint.target === undefined ||
        extensionPoint.target === "daemon"),
  );
}

function collectDeclaredCommands(manifest: MpxManifest): ReadonlySet<string> {
  return new Set((manifest.commands ?? []).map((command) => command.id));
}

function validateUiCommandBindings(
  schema: PluginUiSchema,
  declaredCommands: ReadonlySet<string>,
  diagnostics: MpxPackageDiagnostic[],
): void {
  visitUiNode(schema.root, "$.targets.client.ui:$.root", (path, command) => {
    if (!declaredCommands.has(command)) {
      diagnostics.push(
        diagnostic(
          "command_undeclared",
          path,
          `UI command '${command}' is not declared in manifest.commands.`,
        ),
      );
    }
  });
}

function visitUiNode(
  node: PluginUiSchema["root"],
  path: string,
  onCommand: (path: string, command: string) => void,
): void {
  collectCommandFromProp(
    node.props.OnClick,
    `${path}.props.OnClick`,
    onCommand,
  );
  collectCommandFromProp(
    node.props.OnChanged,
    `${path}.props.OnChanged`,
    onCommand,
  );
  node.children.forEach((child, index) =>
    visitUiNode(child, `${path}.children[${index}]`, onCommand),
  );
  const items = node.props.Items;
  if (Array.isArray(items)) {
    items.forEach((item, index) => {
      if (!isRecord(item) || !Array.isArray(item.Children)) return;
      item.Children.forEach((child, childIndex) =>
        visitUiNode(
          child as unknown as PluginUiSchema["root"],
          `${path}.props.Items[${index}].Children[${childIndex}]`,
          onCommand,
        ),
      );
    });
  }
}

function collectCommandFromProp(
  value: unknown,
  path: string,
  onCommand: (path: string, command: string) => void,
): void {
  if (isRecord(value) && typeof value.Command === "string") {
    onCommand(`${path}.Command`, value.Command);
  }
}

function isAllowedEventPermission(
  eventName: string,
  packageId: string,
): boolean {
  return (
    ALLOWED_EVENT_CAPABILITIES.has(eventName) ||
    eventName === `plugin.${packageId}.event.extension`
  );
}

function validateDaemonBundleRef(
  ref: MpxManifestFileRef | undefined,
  path: string,
  diagnostics: MpxPackageDiagnostic[],
): void {
  if (!isRecord(ref) || typeof ref.path !== "string") return;
  const normalized = normalizeMpxPath(ref.path);
  if (!normalized.ok) return;
  if (!normalized.path.endsWith(".zip")) {
    diagnostics.push(
      diagnostic(
        "daemon_bundle_path_invalid",
        `${path}.path`,
        "Daemon plugin payload must be a zip bundle containing mcsl-plugin.json and plugin assemblies.",
      ),
    );
  }
}

function validateManifestFileRef(
  ref: MpxManifestFileRef | undefined,
  path: string,
  diagnostics: MpxPackageDiagnostic[],
): void {
  if (!isRecord(ref)) {
    diagnostics.push(
      diagnostic("file_ref_invalid", path, "File reference is required."),
    );
    return;
  }

  const normalized = normalizeMpxPath(ref.path);
  if (!normalized.ok) {
    diagnostics.push(
      diagnostic(normalized.code, `${path}.path`, normalized.message),
    );
  }

  if (typeof ref.sha256 !== "string" || !HEX_SHA256.test(ref.sha256)) {
    diagnostics.push(
      diagnostic(
        "sha256_invalid",
        `${path}.sha256`,
        "SHA-256 must be 64 lowercase hex characters.",
      ),
    );
  }
}

async function validatePayloadFile(
  zip: ReadonlyMap<string, ZipEntry>,
  ref: MpxManifestFileRef,
  manifestPath: string,
  maxBytes: number,
  fileDigests: Record<string, string>,
  diagnostics: MpxPackageDiagnostic[],
): Promise<void> {
  const normalized = normalizeMpxPath(ref.path);
  if (!normalized.ok) return;

  const entry = zip.get(normalized.path);
  if (!entry) {
    diagnostics.push(
      diagnostic(
        "payload_missing",
        `${manifestPath}.path`,
        `File '${normalized.path}' is missing.`,
      ),
    );
    return;
  }

  if (entry.uncompressedSize > maxBytes) {
    diagnostics.push(
      diagnostic(
        "payload_too_large",
        normalized.path,
        `File exceeds ${maxBytes} bytes.`,
      ),
    );
    return;
  }

  const digest = await sha256Hex(entry.bytes);
  fileDigests[normalized.path] = digest;
  if (digest !== ref.sha256) {
    diagnostics.push(
      diagnostic(
        "sha256_mismatch",
        `${manifestPath}.sha256`,
        `SHA-256 mismatch for '${normalized.path}'.`,
      ),
    );
  }
}

function collectDeclaredFiles(
  manifest: MpxManifest,
  diagnostics: MpxPackageDiagnostic[],
): Set<string> {
  const declared = new Set<string>();
  const entryRefs: readonly (readonly [
    string,
    MpxManifestFileRef | undefined,
  ])[] = [
    ["$.targets.client.ui", manifest.targets?.client?.ui],
    ["$.targets.client.theme", manifest.targets?.client?.theme],
    ["$.targets.daemon.plugin", manifest.targets?.daemon?.plugin],
    ["$.entry.ui", manifest.entry?.ui],
    ["$.entry.script", manifest.entry?.script],
  ];

  for (const [path, ref] of entryRefs) {
    if (ref === undefined) continue;
    const normalized = normalizeMpxPath(ref.path);
    if (normalized.ok) declared.add(normalized.path);
    else
      diagnostics.push(
        diagnostic(normalized.code, `${path}.path`, normalized.message),
      );
  }

  for (const [index, resource] of (manifest.resources ?? []).entries()) {
    const normalized = normalizeMpxPath(resource.path);
    if (normalized.ok) declared.add(normalized.path);
    else
      diagnostics.push(
        diagnostic(
          normalized.code,
          `$.resources[${index}].path`,
          normalized.message,
        ),
      );
  }

  return declared;
}

async function readZipEntries(
  bytes: Uint8Array,
  limits: MpxPackageLimits,
  diagnostics: MpxPackageDiagnostic[],
): Promise<Map<string, ZipEntry> | null> {
  const eocd = findEndOfCentralDirectory(bytes);
  if (eocd < 0) {
    diagnostics.push(
      diagnostic(
        "zip_eocd_missing",
        "$",
        "ZIP end of central directory was not found.",
      ),
    );
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const disk = view.getUint16(eocd + 4, true);
  const centralDisk = view.getUint16(eocd + 6, true);
  const entryCount = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);

  if (disk !== 0 || centralDisk !== 0) {
    diagnostics.push(
      diagnostic(
        "zip_multi_disk",
        "$",
        "Multi-disk ZIP packages are not supported.",
      ),
    );
    return null;
  }
  if (entryCount > limits.maxFiles) {
    diagnostics.push(
      diagnostic(
        "zip_file_count_exceeded",
        "$",
        `ZIP has more than ${limits.maxFiles} files.`,
      ),
    );
    return null;
  }
  if (centralOffset + centralSize > bytes.byteLength) {
    diagnostics.push(
      diagnostic(
        "zip_central_directory_invalid",
        "$",
        "ZIP central directory is out of bounds.",
      ),
    );
    return null;
  }

  const metadata: ZipEntryMetadata[] = [];
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (
      offset + 46 > bytes.byteLength ||
      view.getUint32(offset, true) !== ZIP_CENTRAL_DIRECTORY_HEADER
    ) {
      diagnostics.push(
        diagnostic(
          "zip_central_entry_invalid",
          `$[${index}]`,
          "ZIP central directory entry is invalid.",
        ),
      );
      return null;
    }

    const flags = view.getUint16(offset + 8, true);
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const nameStart = offset + 46;
    const nextOffset = nameStart + fileNameLength + extraLength + commentLength;

    if (nextOffset > bytes.byteLength) {
      diagnostics.push(
        diagnostic(
          "zip_central_entry_invalid",
          `$[${index}]`,
          "ZIP entry name is out of bounds.",
        ),
      );
      return null;
    }
    if ((flags & ZIP_ENCRYPTED_FLAG) !== 0) {
      diagnostics.push(
        diagnostic(
          "zip_encrypted",
          `$[${index}]`,
          "Encrypted ZIP entries are not allowed.",
        ),
      );
      return null;
    }
    if ((flags & ZIP_UTF8_FLAG) === 0) {
      diagnostics.push(
        diagnostic(
          "zip_name_encoding_invalid",
          `$[${index}]`,
          "ZIP entry names must use UTF-8.",
        ),
      );
      return null;
    }
    if (
      compressionMethod !== ZIP_METHOD_STORED &&
      compressionMethod !== ZIP_METHOD_DEFLATE
    ) {
      diagnostics.push(
        diagnostic(
          "zip_compression_unsupported",
          `$[${index}]`,
          "Only stored or deflate ZIP entries are supported.",
        ),
      );
      return null;
    }
    if (uncompressedSize > limits.maxSingleFileBytes) {
      diagnostics.push(
        diagnostic(
          "zip_entry_too_large",
          `$[${index}]`,
          `ZIP entry exceeds ${limits.maxSingleFileBytes} bytes.`,
        ),
      );
      return null;
    }

    const rawName = decodeUtf8(
      bytes.subarray(nameStart, nameStart + fileNameLength),
    );
    const normalized = normalizeMpxPath(rawName, limits.maxPathLength);
    if (!normalized.ok) {
      diagnostics.push(
        diagnostic(
          normalized.code,
          rawName || `$[${index}]`,
          normalized.message,
        ),
      );
      return null;
    }
    if (!normalized.path.endsWith("/")) {
      metadata.push({
        path: normalized.path,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        localHeaderOffset,
      });
    }

    offset = nextOffset;
  }

  const seen = new Set<string>();
  let totalUncompressed = 0;
  const entries = new Map<string, ZipEntry>();
  for (const entry of metadata) {
    if (seen.has(entry.path)) {
      diagnostics.push(
        diagnostic(
          "zip_duplicate_path",
          entry.path,
          "ZIP entry path is duplicated.",
        ),
      );
      return null;
    }
    seen.add(entry.path);
    totalUncompressed += entry.uncompressedSize;
    if (totalUncompressed > limits.maxPackageBytes) {
      diagnostics.push(
        diagnostic(
          "zip_uncompressed_too_large",
          "$",
          "ZIP uncompressed payload is too large.",
        ),
      );
      return null;
    }

    const payload = await readZipEntryPayload(bytes, view, entry, diagnostics);
    if (!payload) return null;
    if (payload.byteLength !== entry.uncompressedSize) {
      diagnostics.push(
        diagnostic(
          "zip_size_mismatch",
          entry.path,
          "ZIP entry size does not match metadata.",
        ),
      );
      return null;
    }
    entries.set(entry.path, { ...entry, bytes: payload });
  }

  return entries;
}

async function readZipEntryPayload(
  bytes: Uint8Array,
  view: DataView,
  entry: ZipEntryMetadata,
  diagnostics: MpxPackageDiagnostic[],
): Promise<Uint8Array | null> {
  const offset = entry.localHeaderOffset;
  if (
    offset + 30 > bytes.byteLength ||
    view.getUint32(offset, true) !== ZIP_LOCAL_FILE_HEADER
  ) {
    diagnostics.push(
      diagnostic(
        "zip_local_entry_invalid",
        entry.path,
        "ZIP local file header is invalid.",
      ),
    );
    return null;
  }

  const fileNameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const payloadStart = offset + 30 + fileNameLength + extraLength;
  const payloadEnd = payloadStart + entry.compressedSize;
  if (payloadEnd > bytes.byteLength) {
    diagnostics.push(
      diagnostic(
        "zip_payload_out_of_bounds",
        entry.path,
        "ZIP payload is out of bounds.",
      ),
    );
    return null;
  }

  const payload = bytes.subarray(payloadStart, payloadEnd);
  if (entry.compressionMethod === ZIP_METHOD_STORED) {
    return new Uint8Array(payload);
  }

  try {
    const payloadBuffer = new ArrayBuffer(payload.byteLength);
    new Uint8Array(payloadBuffer).set(payload);
    const stream = new Response(payloadBuffer).body?.pipeThrough(
      new DecompressionStream("deflate-raw"),
    );
    if (!stream) throw new Error("Decompression stream unavailable.");
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch (error) {
    diagnostics.push(
      diagnostic(
        "zip_deflate_failed",
        entry.path,
        error instanceof Error ? error.message : "Failed to inflate ZIP entry.",
      ),
    );
    return null;
  }
}

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const minOffset = Math.max(0, bytes.byteLength - 22 - 0xffff);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = bytes.byteLength - 22; offset >= minOffset; offset -= 1) {
    if (view.getUint32(offset, true) === ZIP_END_OF_CENTRAL_DIRECTORY) {
      return offset;
    }
  }
  return -1;
}

function normalizeMpxPath(
  raw: unknown,
  maxPathLength = DEFAULT_LIMITS.maxPathLength,
):
  | { readonly ok: true; readonly path: string }
  | { readonly ok: false; readonly code: string; readonly message: string } {
  if (typeof raw !== "string" || raw.length === 0) {
    return {
      ok: false,
      code: "path_invalid",
      message: "Path must be a non-empty string.",
    };
  }
  if (raw.length > maxPathLength) {
    return {
      ok: false,
      code: "path_too_long",
      message: `Path exceeds ${maxPathLength} characters.`,
    };
  }
  if (raw.includes("\0") || raw.includes("\\")) {
    return {
      ok: false,
      code: "path_invalid",
      message: "Path contains forbidden characters.",
    };
  }
  if (raw.startsWith("/") || /^[A-Za-z]:/.test(raw)) {
    return {
      ok: false,
      code: "path_absolute",
      message: "Absolute paths are not allowed.",
    };
  }

  const segments = raw.split("/");
  if (
    segments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    return {
      ok: false,
      code: "path_traversal",
      message: "Path traversal is not allowed.",
    };
  }

  return { ok: true, path: segments.join("/") };
}

function diagnostic(
  code: string,
  path: string,
  message: string,
): MpxPackageDiagnostic {
  return { code, path, message };
}

function toBytes(data: ArrayBuffer | ArrayBufferView): Uint8Array {
  return data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

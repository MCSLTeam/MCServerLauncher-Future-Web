import { sha256Hex } from "../../../lib/daemon/binary.ts";
import type {
  MpxManifest,
  MpxManifestCommand,
  MpxManifestExtensionPoint,
  MpxManifestResourceRef,
} from "./mpx-validator.ts";
import { compilePluginUiSchema } from "./schema.ts";
import { compilePluginTheme } from "./theme-runtime.ts";

const encoder = new TextEncoder();

type MutableRuntime = {
  ui?: string;
  daemonApi?: string;
  javascript?: string;
};

type MutableTargets = {
  client?: {
    ui?: { path: string; sha256: string };
    theme?: { path: string; sha256: string };
  };
  daemon?: {
    plugin?: { path: string; sha256: string };
  };
};

export interface MpxPackageBuildResourceInput {
  readonly path: string;
  readonly bytes: Uint8Array;
  readonly mime: MpxManifestResourceRef["mime"];
}

export interface MpxPackageBuildInput {
  readonly package: MpxManifest["package"];
  readonly runtime?: MpxManifest["runtime"];
  readonly uiAuthoringJson5?: string;
  readonly themeJson?: string;
  readonly daemonPlugin?: Uint8Array;
  readonly resources?: readonly MpxPackageBuildResourceInput[];
  readonly permissions?: MpxManifest["permissions"];
  readonly extensionPoints?: readonly MpxManifestExtensionPoint[];
  readonly commands?: readonly MpxManifestCommand[];
}

export type MpxPackageBuildResult =
  | {
      readonly ok: true;
      readonly bytes: Uint8Array;
      readonly manifest: MpxManifest;
    }
  | { readonly ok: false; readonly diagnostics: readonly string[] };

export async function buildMpxPackageFromSources(
  input: MpxPackageBuildInput,
): Promise<MpxPackageBuildResult> {
  const entries: Record<string, Uint8Array> = {};
  const targets: MutableTargets = {};
  const runtime: MutableRuntime = {
    ...(input.runtime ?? {}),
  };
  const resources: MpxManifestResourceRef[] = [];

  if (input.uiAuthoringJson5 !== undefined) {
    const compiled = compilePluginUiSchema(input.uiAuthoringJson5);
    if (!compiled.ok) {
      return {
        ok: false,
        diagnostics: compiled.diagnostics.map(
          (diagnostic) => `${diagnostic.path}: ${diagnostic.message}`,
        ),
      };
    }
    const uiBytes = encoder.encode(compiled.runtimeJson);
    entries["client/ui.json"] = uiBytes;
    targets.client = {
      ...(targets.client ?? {}),
      ui: { path: "client/ui.json", sha256: await sha256Hex(uiBytes) },
    };
    runtime.ui ??= "[1.0.0,2.0.0)";
  }

  if (input.themeJson !== undefined) {
    const compiled = compilePluginTheme(input.themeJson);
    if (!compiled.ok) {
      return {
        ok: false,
        diagnostics: compiled.diagnostics.map(
          (diagnostic) => `${diagnostic.path}: ${diagnostic.message}`,
        ),
      };
    }
    const themeBytes = encoder.encode(compiled.runtimeJson);
    entries["client/theme.json"] = themeBytes;
    targets.client = {
      ...(targets.client ?? {}),
      theme: {
        path: "client/theme.json",
        sha256: await sha256Hex(themeBytes),
      },
    };
  }

  if (input.daemonPlugin !== undefined) {
    entries["daemon/plugin-bundle.zip"] = input.daemonPlugin;
    targets.daemon = {
      plugin: {
        path: "daemon/plugin-bundle.zip",
        sha256: await sha256Hex(input.daemonPlugin),
      },
    };
    runtime.daemonApi ??= "[1.0.0,2.0.0)";
  }

  for (const resource of input.resources ?? []) {
    entries[resource.path] = resource.bytes;
    resources.push({
      path: resource.path,
      sha256: await sha256Hex(resource.bytes),
      mime: resource.mime,
      bytes: resource.bytes.byteLength,
    });
    targets.client = {
      ...(targets.client ?? {}),
    };
  }

  const manifest: MpxManifest = {
    schema:
      "https://mcsl-team.github.io/schemas/mcsl-extension-1.0.schema.json",
    package: input.package,
    runtime,
    targets,
    permissions: input.permissions ?? {
      host: [],
      events: [],
      network: [],
    },
    resources,
    ...(input.extensionPoints === undefined
      ? {}
      : { extensionPoints: input.extensionPoints }),
    ...(input.commands === undefined ? {} : { commands: input.commands }),
    integrity: { algorithm: "sha256", signed: false },
  };

  return {
    ok: true,
    manifest,
    bytes: makeStoredZip({
      "manifest.json": JSON.stringify(manifest),
      ...entries,
    }),
  };
}

function makeStoredZip(
  entries: Record<string, string | Uint8Array>,
): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const [name, raw] of Object.entries(entries)) {
    const nameBytes = encoder.encode(name);
    const payload = typeof raw === "string" ? encoder.encode(raw) : raw;
    const local = bytesBuilder();
    writeU32(local, 0x04034b50);
    writeU16(local, 20);
    writeU16(local, 0x0800);
    writeU16(local, 0);
    writeU16(local, 0);
    writeU16(local, 0);
    writeU32(local, 0);
    writeU32(local, payload.byteLength);
    writeU32(local, payload.byteLength);
    writeU16(local, nameBytes.byteLength);
    writeU16(local, 0);
    writeBytes(local, nameBytes);
    writeBytes(local, payload);
    const localBytes = local.finish();
    localParts.push(localBytes);

    const central = bytesBuilder();
    writeU32(central, 0x02014b50);
    writeU16(central, 20);
    writeU16(central, 20);
    writeU16(central, 0x0800);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU32(central, 0);
    writeU32(central, payload.byteLength);
    writeU32(central, payload.byteLength);
    writeU16(central, nameBytes.byteLength);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU32(central, 0);
    writeU32(central, offset);
    writeBytes(central, nameBytes);
    centralParts.push(central.finish());

    offset += localBytes.byteLength;
  }

  const centralOffset = offset;
  const centralDirectory = concatBytes(centralParts);
  const end = bytesBuilder();
  writeU32(end, 0x06054b50);
  writeU16(end, 0);
  writeU16(end, 0);
  writeU16(end, Object.keys(entries).length);
  writeU16(end, Object.keys(entries).length);
  writeU32(end, centralDirectory.byteLength);
  writeU32(end, centralOffset);
  writeU16(end, 0);

  return concatBytes([...localParts, centralDirectory, end.finish()]);
}

function bytesBuilder() {
  const bytes: number[] = [];
  return {
    push(byte: number) {
      bytes.push(byte & 0xff);
    },
    finish() {
      return new Uint8Array(bytes);
    },
  };
}

function writeU16(out: ReturnType<typeof bytesBuilder>, value: number) {
  out.push(value);
  out.push(value >> 8);
}

function writeU32(out: ReturnType<typeof bytesBuilder>, value: number) {
  out.push(value);
  out.push(value >> 8);
  out.push(value >> 16);
  out.push(value >> 24);
}

function writeBytes(out: ReturnType<typeof bytesBuilder>, value: Uint8Array) {
  for (const byte of value) out.push(byte);
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  const length = parts.reduce((total, part) => total + part.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

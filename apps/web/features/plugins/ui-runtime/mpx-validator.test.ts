import test from "node:test";
import assert from "node:assert/strict";

import { sha256Hex } from "../../../lib/daemon/binary.ts";
import { validateMpxPackage, type MpxManifest } from "./mpx-validator.ts";

const encoder = new TextEncoder();

const VALID_UI = JSON.stringify({
  schema: "mcsl.ui.v1",
  root: {
    type: "Card",
    props: { Title: "{state.title}" },
    children: [
      { type: "Text", props: { Text: "Ready" } },
      { type: "Button", props: { Text: "Refresh", OnClick: "refresh" } },
    ],
  },
});

const VALID_SCRIPT = "export function onLoad() {}\n";

test("validates a stored .mpx package with manifest hashes", async () => {
  const zip = await buildMpxPackage();

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(
      result.package.manifest.package.id,
      "community.example.status-panel",
    );
    assert.equal(result.package.uiSchema?.root.type, "Card");
    assert.match(
      result.package.fileDigests["client/ui.json"] ?? "",
      /^[a-f0-9]{64}$/,
    );
  }
});

test("validates a declarative .mpx package without a script bundle", async () => {
  const zip = await buildMpxPackage({ script: null });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.package.fileDigests["bundle.js"], undefined);
    assert.equal(result.package.uiSchema?.root.type, "Card");
    assert.deepEqual(result.package.deploymentPlan.scopes, ["client"]);
  }
});

test("validates declared daemon plugin payloads in unified targets", async () => {
  const pluginBytes = encoder.encode("not-a-real-assembly-yet");
  const zip = await buildMpxPackage({
    extraEntries: { "daemon/plugin-bundle.zip": pluginBytes },
    mutateManifest: async (manifest) => ({
      ...manifest,
      targets: {
        ...manifest.targets,
        daemon: {
          plugin: {
            path: "daemon/plugin-bundle.zip",
            sha256: await sha256Hex(pluginBytes),
          },
        },
      },
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(
      result.package.fileDigests["daemon/plugin-bundle.zip"] ?? "",
      /^[a-f0-9]{64}$/,
    );
    assert.deepEqual(result.package.deploymentPlan.scopes, [
      "client",
      "daemon",
    ]);
    assert.equal(
      result.package.deploymentPlan.daemon?.plugin?.path,
      "daemon/plugin-bundle.zip",
    );
  }
});

test("rejects single dll daemon payloads because daemon install requires a bundle", async () => {
  const pluginBytes = encoder.encode("not-a-real-assembly-yet");
  const zip = await buildMpxPackage({
    extraEntries: { "daemon/plugin.dll": pluginBytes },
    mutateManifest: async (manifest) => ({
      ...manifest,
      targets: {
        ...manifest.targets,
        daemon: {
          plugin: {
            path: "daemon/plugin.dll",
            sha256: await sha256Hex(pluginBytes),
          },
        },
      },
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.diagnostics.some(
        (diagnostic) => diagnostic.code === "daemon_bundle_path_invalid",
      ),
      true,
    );
  }
});

test("validates client-only theme extension packages", async () => {
  const themeBytes = encoder.encode(
    JSON.stringify({ schema: "mcsl.theme.v1", colors: { accent: "#0070c0" } }),
  );
  const zip = await buildMpxPackage({
    ui: null,
    script: null,
    extraEntries: { "client/theme.json": themeBytes },
    mutateManifest: async (manifest) => ({
      ...manifest,
      package: {
        ...manifest.package,
        id: "community.example.theme",
        displayName: "Example Theme",
      },
      targets: {
        client: {
          theme: {
            path: "client/theme.json",
            sha256: await sha256Hex(themeBytes),
          },
        },
      },
      runtime: {},
      permissions: { host: [], events: [], network: [] },
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.package.uiSchema, undefined);
    assert.deepEqual(result.package.deploymentPlan.scopes, ["client"]);
    assert.equal(
      result.package.deploymentPlan.client?.theme?.path,
      "client/theme.json",
    );
    assert.equal(result.package.theme?.colors.accent, "#0070c0");
  }
});

test("validates daemon-only provider extension packages", async () => {
  const pluginBytes = encoder.encode("not-a-real-assembly-yet");
  const zip = await buildMpxPackage({
    ui: null,
    script: null,
    extraEntries: { "daemon/plugin-bundle.zip": pluginBytes },
    mutateManifest: async (manifest) => ({
      ...manifest,
      package: {
        ...manifest.package,
        id: "community.example.java-provider",
        displayName: "Java Provider",
      },
      targets: {
        daemon: {
          plugin: {
            path: "daemon/plugin-bundle.zip",
            sha256: await sha256Hex(pluginBytes),
          },
        },
      },
      runtime: { daemonApi: "[1.0.0,2.0.0)" },
      permissions: { host: [], events: [], network: [] },
      extensionPoints: [
        { kind: "provider", id: "provider.java", target: "daemon" },
      ],
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.package.uiSchema, undefined);
    assert.deepEqual(result.package.deploymentPlan.scopes, ["daemon"]);
    assert.equal(
      result.package.deploymentPlan.daemon?.extensionPoints[0]?.id,
      "provider.java",
    );
  }
});

test("validates declared daemon command bindings in unified packages", async () => {
  const pluginBytes = encoder.encode("not-a-real-assembly-yet");
  const commandUi = JSON.stringify({
    schema: "mcsl.ui.v1",
    root: {
      type: "Button",
      props: {
        Text: "Refresh",
        OnClick: {
          Command: "refresh",
          Params: { mode: "{state.mode}" },
        },
      },
    },
  });
  const zip = await buildMpxPackage({
    ui: commandUi,
    extraEntries: { "daemon/plugin-bundle.zip": pluginBytes },
    mutateManifest: async (manifest) => ({
      ...manifest,
      targets: {
        ...manifest.targets,
        daemon: {
          plugin: {
            path: "daemon/plugin-bundle.zip",
            sha256: await sha256Hex(pluginBytes),
          },
        },
      },
      runtime: { ...manifest.runtime, daemonApi: "[1.0.0,2.0.0)" },
      extensionPoints: [
        { kind: "command", id: "command.daemon", target: "daemon" },
      ],
      commands: [
        {
          id: "refresh",
          title: "Refresh",
          description: "Refreshes panel state.",
          target: "daemon",
        },
      ],
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.package.commands[0]?.id, "refresh");
    assert.equal(
      result.package.deploymentPlan.daemon?.commands[0]?.id,
      "refresh",
    );
  }
});

test("rejects unsigned packages that carry signature sidecars", async () => {
  const zip = await buildMpxPackage({
    extraEntries: { "signatures/publisher.sig": encoder.encode("signature") },
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.diagnostics[0]?.code, "signature_unexpected");
  }
});

test("rejects signed packages without a trusted publisher key", async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const publicKey = new Uint8Array(
    await crypto.subtle.exportKey("spki", keyPair.publicKey),
  );
  const zip = await buildSignedMpxPackage(keyPair.privateKey, publicKey);

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.diagnostics.some(
        (diagnostic) => diagnostic.code === "signature_trust_unavailable",
      ),
      true,
    );
  }
});

test("accepts signed packages from a trusted publisher key", async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const publicKey = new Uint8Array(
    await crypto.subtle.exportKey("spki", keyPair.publicKey),
  );
  const zip = await buildSignedMpxPackage(keyPair.privateKey, publicKey);

  const result = await validateMpxPackage(zip, {
    trustedPublishers: [
      {
        publisher: "community.example",
        keyId: "test-key",
        publicKeySubjectPublicKeyInfo: publicKey,
      },
    ],
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.package.signature?.publisher, "community.example");
    assert.equal(result.package.signature?.keyId, "test-key");
    assert.equal(
      result.package.signature?.publicKeySha256,
      await sha256Hex(publicKey),
    );
  }
});

test("rejects signed packages when payload is tampered", async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const publicKey = new Uint8Array(
    await crypto.subtle.exportKey("spki", keyPair.publicKey),
  );
  const zip = await buildSignedMpxPackage(keyPair.privateKey, publicKey, {
    tamperPayload: true,
  });

  const result = await validateMpxPackage(zip, {
    trustedPublishers: [
      {
        publisher: "community.example",
        keyId: "test-key",
        publicKeySubjectPublicKeyInfo: publicKey,
      },
    ],
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.diagnostics.some(
        (diagnostic) => diagnostic.code === "signature_payload_mismatch",
      ),
      true,
    );
  }
});

test("rejects undeclared UI command bindings", async () => {
  const commandUi = JSON.stringify({
    schema: "mcsl.ui.v1",
    root: {
      type: "Button",
      props: { Text: "Refresh", OnClick: { Command: "refresh" } },
    },
  });
  const zip = await buildMpxPackage({ ui: commandUi });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /command_undeclared|command_daemon_target_missing|command_extension_point_missing/,
    );
  }
});

test("rejects command declarations without daemon command extension point", async () => {
  const pluginBytes = encoder.encode("not-a-real-assembly-yet");
  const zip = await buildMpxPackage({
    extraEntries: { "daemon/plugin-bundle.zip": pluginBytes },
    mutateManifest: async (manifest) => ({
      ...manifest,
      targets: {
        ...manifest.targets,
        daemon: {
          plugin: {
            path: "daemon/plugin-bundle.zip",
            sha256: await sha256Hex(pluginBytes),
          },
        },
      },
      commands: [{ id: "refresh", target: "daemon" }],
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /command_extension_point_missing/,
    );
  }
});

test("rejects illegal extension point declarations", async () => {
  const zip = await buildMpxPackage({
    mutateManifest: (manifest) => ({
      ...manifest,
      extensionPoints: [
        {
          kind: "override",
          id: "private.instanceBase.patch",
          target: "daemon",
        },
      ],
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /extension_point_unknown/,
    );
  }
});

test("rejects unknown extension targets", async () => {
  const zip = await buildMpxPackage({
    mutateManifest: (manifest) => ({
      ...manifest,
      targets: {
        ...manifest.targets,
        browser: { ui: manifest.targets!.client!.ui! },
      } as MpxManifest["targets"] & { readonly browser: unknown },
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /target_unknown/,
    );
  }
});

test("rejects zip-slip paths before reading payloads", async () => {
  const zip = makeStoredZip({
    "../evil.txt": "owned",
    "manifest.json": "{}",
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.diagnostics[0]?.code, "path_traversal");
  }
});

test("rejects manifest payload hash mismatches", async () => {
  const zip = await buildMpxPackage({
    mutateManifest: (manifest) => ({
      ...manifest,
      targets: {
        client: {
          ui: { ...manifest.targets!.client!.ui!, sha256: "0".repeat(64) },
        },
      },
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /sha256_mismatch/,
    );
  }
});

test("rejects missing manifest hashes", async () => {
  const zip = await buildMpxPackage({
    mutateManifest: (manifest) => ({
      ...manifest,
      entry: {
        ...manifest.entry,
        script: { ...manifest.entry!.script!, sha256: "" },
      },
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /sha256_invalid/,
    );
  }
});

test("rejects unknown or unsupported host capabilities", async () => {
  const zip = await buildMpxPackage({
    mutateManifest: (manifest) => ({
      ...manifest,
      permissions: {
        ...manifest.permissions,
        host: ["ui.state", "daemon.file.write"],
      },
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /capability_unknown_or_unsupported/,
    );
  }
});

test("rejects unknown event permissions", async () => {
  const zip = await buildMpxPackage({
    mutateManifest: (manifest) => ({
      ...manifest,
      permissions: {
        ...manifest.permissions,
        host: ["daemon.event.subscribe"],
        events: ["daemon.file.changed"],
      },
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /event_permission_unknown/,
    );
  }
});

test("accepts package-owned extension protocol event permission", async () => {
  const pluginBytes = encoder.encode("not-a-real-assembly-yet");
  const zip = await buildMpxPackage({
    extraEntries: { "daemon/plugin-bundle.zip": pluginBytes },
    mutateManifest: async (manifest) => ({
      ...manifest,
      targets: {
        ...manifest.targets,
        daemon: {
          plugin: {
            path: "daemon/plugin-bundle.zip",
            sha256: await sha256Hex(pluginBytes),
          },
        },
      },
      extensionPoints: [
        ...(manifest.extensionPoints ?? []),
        { kind: "event", id: "event.daemon", target: "daemon" },
      ],
      permissions: {
        ...manifest.permissions,
        host: ["daemon.event.subscribe"],
        events: ["plugin.community.example.status-panel.event.extension"],
      },
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, true);
});

test("rejects package-owned extension protocol event without daemon extension point", async () => {
  const zip = await buildMpxPackage({
    mutateManifest: (manifest) => ({
      ...manifest,
      permissions: {
        ...manifest.permissions,
        host: ["daemon.event.subscribe"],
        events: ["plugin.community.example.status-panel.event.extension"],
      },
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /event_daemon_target_missing|event_extension_point_missing/,
    );
  }
});

test("rejects cross-plugin extension protocol event permissions", async () => {
  const zip = await buildMpxPackage({
    mutateManifest: (manifest) => ({
      ...manifest,
      permissions: {
        ...manifest.permissions,
        host: ["daemon.event.subscribe"],
        events: ["plugin.community.example.other.event.extension"],
      },
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /event_permission_unknown/,
    );
  }
});

test("rejects oversized resources", async () => {
  const resource = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const zip = await buildMpxPackage({
    extraEntries: { "resources/icon.png": resource },
    mutateManifest: async (manifest) => ({
      ...manifest,
      resources: [
        {
          path: "resources/icon.png",
          mime: "image/png",
          bytes: resource.byteLength,
          sha256: await sha256Hex(resource),
        },
      ],
    }),
  });

  const result = await validateMpxPackage(zip, {
    limits: { maxResourceBytes: 4 },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /resource_size_invalid|payload_too_large/,
    );
  }
});

test("rejects authoring JSON5 as runtime UI schema", async () => {
  const zip = await buildMpxPackage({
    ui: `{ schema: "mcsl.ui.v1", root: { type: "Card" } }`,
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /ui_schema_parse_failed/,
    );
  }
});

test("rejects invalid UI schema inside a correctly hashed package", async () => {
  const zip = await buildMpxPackage({
    ui: JSON.stringify({
      schema: "mcsl.ui.v1",
      root: { type: "WebView" },
    }),
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /ui_component_unknown/,
    );
  }
});

test("rejects undeclared payload files", async () => {
  const zip = await buildMpxPackage({
    extraEntries: { "resources/hidden.bin": new Uint8Array([1, 2, 3]) },
  });

  const result = await validateMpxPackage(zip);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.diagnostics.map((diagnostic) => diagnostic.code).join(","),
      /file_undeclared/,
    );
  }
});

async function buildMpxPackage(
  options: {
    ui?: string | null;
    script?: string | null;
    extraEntries?: Record<string, string | Uint8Array>;
    mutateManifest?:
      | ((manifest: MpxManifest) => MpxManifest)
      | ((manifest: MpxManifest) => Promise<MpxManifest>);
  } = {},
): Promise<Uint8Array> {
  const ui = options.ui === undefined ? VALID_UI : options.ui;
  const script = options.script === undefined ? VALID_SCRIPT : options.script;
  const uiBytes = ui === null ? null : encoder.encode(ui);
  const scriptBytes = script === null ? null : encoder.encode(script);
  let manifest: MpxManifest = {
    schema:
      "https://mcsl-team.github.io/schemas/mcsl-extension-1.0.schema.json",
    package: {
      id: "community.example.status-panel",
      version: "1.0.0",
      publisher: "community.example",
      displayName: "Status Panel",
    },
    runtime: {
      ...(uiBytes === null ? {} : { ui: "[1.0.0,2.0.0)" }),
      daemonApi: "[1.0.0,2.0.0)",
      ...(scriptBytes === null ? {} : { javascript: "es2020" }),
    },
    targets:
      uiBytes === null
        ? undefined
        : {
            client: {
              ui: {
                path: "client/ui.json",
                sha256: await sha256Hex(uiBytes),
              },
            },
          },
    entry:
      scriptBytes === null
        ? undefined
        : {
            script: {
              path: "bundle.js",
              sha256: await sha256Hex(scriptBytes),
              module: "esm",
            },
          },
    permissions: {
      host: ["ui.state", "daemon.instance.query"],
      events: [],
      network: [],
      storage: { privateBytes: 1024 },
    },
    resources: [],
    integrity: { algorithm: "sha256", signed: false },
  };

  if (options.mutateManifest) {
    manifest = await options.mutateManifest(manifest);
  }

  return makeStoredZip({
    "manifest.json": JSON.stringify(manifest),
    ...(uiBytes === null ? {} : { "client/ui.json": uiBytes }),
    ...(scriptBytes === null ? {} : { "bundle.js": scriptBytes }),
    ...(options.extraEntries ?? {}),
  });
}

async function buildSignedMpxPackage(
  privateKey: CryptoKey,
  publicKey: Uint8Array,
  options: { readonly tamperPayload?: boolean } = {},
): Promise<Uint8Array> {
  const uiBytes = encoder.encode(VALID_UI);
  const scriptBytes = encoder.encode(VALID_SCRIPT);
  const publicKeySha256 = await sha256Hex(publicKey);
  const signedAt = "2026-08-10T00:00:00Z";
  const manifest: MpxManifest = {
    schema:
      "https://mcsl-team.github.io/schemas/mcsl-extension-1.0.schema.json",
    package: {
      id: "community.example.status-panel",
      version: "1.0.0",
      publisher: "community.example",
      displayName: "Status Panel",
    },
    runtime: {
      ui: "[1.0.0,2.0.0)",
      daemonApi: "[1.0.0,2.0.0)",
      javascript: "es2020",
    },
    targets: {
      client: {
        ui: {
          path: "client/ui.json",
          sha256: await sha256Hex(uiBytes),
        },
      },
    },
    entry: {
      script: {
        path: "bundle.js",
        sha256: await sha256Hex(scriptBytes),
        module: "esm",
      },
    },
    permissions: {
      host: ["ui.state", "daemon.instance.query"],
      events: [],
      network: [],
      storage: { privateBytes: 1024 },
    },
    resources: [],
    integrity: { algorithm: "sha256", signed: true },
  };
  const entries: Record<string, string | Uint8Array> = {
    "manifest.json": JSON.stringify(manifest),
    "client/ui.json": uiBytes,
    "bundle.js": scriptBytes,
  };
  const signatureEntries = await buildSignatureEntries(entries);
  const signatureInput = buildSignatureInput({
    algorithm: "ecdsa-p256-sha256",
    publisher: "community.example",
    packageId: "community.example.status-panel",
    packageVersion: "1.0.0",
    keyId: "test-key",
    publicKeySha256,
    signedAt,
    payloadAlgorithm: "sha256",
    entries: signatureEntries,
  });
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      privateKey,
      toArrayBuffer(signatureInput),
    ),
  );
  entries["signatures/manifest.json"] = JSON.stringify({
    schema:
      "https://mcsl-team.github.io/schemas/mcsl-extension-signature-1.0.schema.json",
    algorithm: "ecdsa-p256-sha256",
    publisher: "community.example",
    packageId: "community.example.status-panel",
    packageVersion: "1.0.0",
    keyId: "test-key",
    publicKeySha256,
    signedAt,
    payload: { algorithm: "sha256", entries: signatureEntries },
    signature: toBase64(signature),
  });

  if (options.tamperPayload === true) {
    entries["client/ui.json"] = encoder.encode(
      VALID_UI.replace("Ready", "Tampered"),
    );
  }

  return makeStoredZip(entries);
}

async function buildSignatureEntries(
  entries: Record<string, string | Uint8Array>,
): Promise<readonly { readonly path: string; readonly sha256: string }[]> {
  const signatureEntries: { path: string; sha256: string }[] = [];
  for (const [path, raw] of Object.entries(entries)) {
    if (path.startsWith("signatures/")) continue;
    const bytes = typeof raw === "string" ? encoder.encode(raw) : raw;
    signatureEntries.push({ path, sha256: await sha256Hex(bytes) });
  }
  return signatureEntries.sort((left, right) =>
    left.path.localeCompare(right.path),
  );
}

function buildSignatureInput(input: {
  readonly algorithm: string;
  readonly publisher: string;
  readonly packageId: string;
  readonly packageVersion: string;
  readonly keyId: string;
  readonly publicKeySha256: string;
  readonly signedAt: string;
  readonly payloadAlgorithm: string;
  readonly entries: readonly {
    readonly path: string;
    readonly sha256: string;
  }[];
}): Uint8Array {
  const lines = [
    "MCSL-MPX-SIGNATURE-v1",
    `algorithm:${input.algorithm}`,
    `publisher:${input.publisher}`,
    `packageId:${input.packageId}`,
    `packageVersion:${input.packageVersion}`,
    `keyId:${input.keyId}`,
    `publicKeySha256:${input.publicKeySha256}`,
    `signedAt:${input.signedAt}`,
    `payloadAlgorithm:${input.payloadAlgorithm}`,
    ...input.entries.map((entry) => `entry:${entry.path}:${entry.sha256}`),
  ];
  return encoder.encode(`${lines.join("\n")}\n`);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
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

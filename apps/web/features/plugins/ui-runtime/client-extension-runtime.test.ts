import test from "node:test";
import assert from "node:assert/strict";

import {
  applyClientExtensionStateEnvelope,
  createClientExtensionState,
  createPreviewExtensionTransport,
  dispatchClientExtensionCommand,
  dispatchClientExtensionEvent,
  listClientExtensionResources,
  resolveClientExtensionObjectUrl,
  resolveClientExtensionResource,
} from "./client-extension-runtime.ts";
import {
  MemoryClientExtensionPayloadStore,
  type ClientExtensionCacheEntry,
} from "./client-extension-manager.ts";
import { sha256Hex } from "../../../lib/daemon/binary.ts";

const entry: ClientExtensionCacheEntry = {
  id: "community.example.status-panel",
  version: "1.0.0",
  manifest: {
    schema:
      "https://mcsl-team.github.io/schemas/mcsl-extension-1.0.schema.json",
    package: { id: "community.example.status-panel", version: "1.0.0" },
    runtime: { ui: "[1.0.0,2.0.0)", daemonApi: "[1.0.0,2.0.0)" },
    targets: {
      client: {
        ui: { path: "client/ui.json", sha256: "a".repeat(64) },
        theme: { path: "client/theme.json", sha256: "b".repeat(64) },
      },
      daemon: {
        plugin: { path: "daemon/plugin-bundle.zip", sha256: "c".repeat(64) },
      },
    },
    entry: {
      script: { path: "bundle.js", sha256: "d".repeat(64), module: "default" },
    },
    permissions: { host: [], events: [], network: [] },
    resources: [
      {
        path: "client/resources/icon.png",
        sha256: "e".repeat(64),
        mime: "image/png",
        bytes: 8,
      },
    ],
    commands: [{ id: "refresh", target: "daemon" }],
    integrity: { algorithm: "sha256", signed: false },
  },
  deploymentPlan: {
    scopes: ["client", "daemon"],
    client: {
      ui: { path: "client/ui.json", sha256: "a".repeat(64) },
      theme: { path: "client/theme.json", sha256: "b".repeat(64) },
      script: { path: "bundle.js", sha256: "d".repeat(64), module: "default" },
      resources: [
        {
          path: "client/resources/icon.png",
          sha256: "e".repeat(64),
          mime: "image/png",
          bytes: 8,
        },
      ],
    },
    daemon: {
      plugin: { path: "daemon/plugin-bundle.zip", sha256: "c".repeat(64) },
      extensionPoints: [
        { kind: "command", id: "command.daemon", target: "daemon" },
      ],
      commands: [{ id: "refresh", target: "daemon" }],
    },
  },
  uiSchema: {
    schema: "mcsl.ui.v1",
    root: { type: "Text", props: { Text: "Ready" }, children: [] },
  },
  resources: [
    {
      path: "client/resources/icon.png",
      sha256: "e".repeat(64),
      mime: "image/png",
      bytes: 8,
    },
  ],
  commands: [{ id: "refresh", target: "daemon" }],
  fileDigests: {
    "client/ui.json": "a".repeat(64),
    "client/theme.json": "b".repeat(64),
    "bundle.js": "d".repeat(64),
    "client/resources/icon.png": "e".repeat(64),
  },
};

test("client extension runtime lists installed entry resources", () => {
  assert.deepEqual(
    listClientExtensionResources(entry).map((resource) => [
      resource.kind,
      resource.path,
    ]),
    [
      ["script", "bundle.js"],
      ["resource", "client/resources/icon.png"],
      ["theme", "client/theme.json"],
      ["ui", "client/ui.json"],
    ],
  );
});

test("client extension runtime resolves declared resources to safe URLs or storage refs", () => {
  const url = resolveClientExtensionResource(
    entry,
    "client/resources/icon.png",
    {
      resolveUrl: (_entry, resource) => `blob://preview/${resource.path}`,
    },
  );
  assert.equal(url.ok, true);
  if (url.ok) assert.equal(url.reference.kind, "url");

  const storage = resolveClientExtensionResource(entry, "client/ui.json", {
    resolveStorageRef: (extension, resource) =>
      `${extension.id}:${resource.sha256}`,
  });
  assert.equal(storage.ok, true);
  if (storage.ok) assert.equal(storage.reference.kind, "storage");
});

test("client extension runtime rejects undeclared and unsafe resource URLs", () => {
  const missing = resolveClientExtensionResource(
    entry,
    "client/missing.png",
    {},
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.code, "resource_undeclared");

  const unsafe = resolveClientExtensionResource(
    entry,
    "client/resources/icon.png",
    {
      resolveUrl: () => "javascript:alert(1)",
    },
  );
  assert.equal(unsafe.ok, false);
  if (!unsafe.ok) assert.equal(unsafe.code, "resource_url_unsafe");
});

test("client extension runtime resolves cached payloads to blob URLs", async () => {
  const payloadStore = new MemoryClientExtensionPayloadStore();
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const sha256 = await sha256Hex(bytes);
  const cached = await payloadStore.writeFile(
    entry.id,
    "client/resources/icon.png",
    bytes,
    { sha256, mime: "image/png" },
  );
  const resolved = await resolveClientExtensionObjectUrl(
    {
      ...entry,
      resources: [{ ...entry.resources[0]!, sha256 }],
      cachedPayloads: [cached],
    },
    "client/resources/icon.png",
    payloadStore,
  );

  assert.equal(resolved.ok, true);
  if (resolved.ok) {
    assert.equal(resolved.reference.kind, "url");
    assert.match(resolved.reference.url, /^blob:/);
    URL.revokeObjectURL(resolved.reference.url);
  }
});

test("client extension runtime applies only matching extension state envelopes", () => {
  const snapshot = createClientExtensionState(entry, { status: "starting" }, 1);
  const next = applyClientExtensionStateEnvelope(entry, snapshot, {
    protocol: "mcsl.extension.v1",
    type: "state.patch",
    plugin: entry.id,
    revision: 2,
    patch: { status: "ready", cpu: 0.5 },
  });

  assert.equal(next.applied, true);
  assert.deepEqual(next.state, { status: "ready", cpu: 0.5 });

  const full = applyClientExtensionStateEnvelope(entry, next, {
    protocol: "mcsl.extension.v1",
    type: "state.snapshot",
    plugin: entry.id,
    revision: 3,
    state: { status: "synced" },
  });
  assert.equal(full.applied, true);
  assert.deepEqual(full.state, { status: "synced" });

  const foreign = applyClientExtensionStateEnvelope(entry, full, {
    protocol: "mcsl.extension.v1",
    type: "state.patch",
    plugin: "community.example.other",
    revision: 4,
    patch: { status: "wrong" },
  });
  assert.equal(foreign.applied, false);
  assert.deepEqual(foreign.state, { status: "synced" });
});

test("client extension runtime dispatches declared extension events only", async () => {
  const eventEntry: ClientExtensionCacheEntry = {
    ...entry,
    manifest: {
      ...entry.manifest,
      permissions: {
        ...entry.manifest.permissions,
        events: ["daemon.instance.log"],
      },
    },
  };
  const events: string[] = [];
  const dispatched = await dispatchClientExtensionEvent(
    eventEntry,
    {
      protocol: "mcsl.extension.v1",
      type: "event",
      plugin: entry.id,
      name: "daemon.instance.log",
      version: 1,
      data: { line: "hello" },
    },
    (event) => {
      events.push(String(event.data.line));
    },
  );

  assert.equal(dispatched.dispatched, true);
  assert.deepEqual(events, ["hello"]);

  const undeclared = await dispatchClientExtensionEvent(
    entry,
    {
      protocol: "mcsl.extension.v1",
      type: "event",
      plugin: entry.id,
      name: "daemon.instance.log",
      version: 1,
      data: { line: "hello" },
    },
    () => {
      throw new Error("must not dispatch");
    },
  );
  assert.equal(undeclared.dispatched, false);
  if (!undeclared.dispatched)
    assert.match(undeclared.diagnostics.join(","), /not declared/);
});

test("client extension runtime dispatches declared commands through extension protocol", async () => {
  const calls: Array<{ method: string; params: Record<string, unknown> }> = [];
  const parsed = await dispatchClientExtensionCommand(
    entry,
    {
      async request<T>(method: string, params: Record<string, unknown>) {
        calls.push({ method, params });
        return createPreviewExtensionTransport(entry).request<T>(
          method,
          params,
        );
      },
    },
    {
      kind: "click",
      command: { command: "refresh", params: { mode: "safe" } },
    },
    "request-1",
  );

  assert.equal(parsed.ok, true);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0]?.params, {
    envelope: {
      protocol: "mcsl.extension.v1",
      type: "request",
      id: "request-1",
      plugin: "community.example.status-panel",
      command: "refresh",
      params: { mode: "safe" },
    },
  });
});

test("client extension runtime rejects undeclared command events before RPC", async () => {
  const parsed = await dispatchClientExtensionCommand(
    { ...entry, commands: [] },
    {
      async request<T>() {
        throw new Error("must not call daemon");
      },
    },
    { kind: "click", command: { command: "refresh" } },
  );

  assert.equal(parsed.ok, false);
  if (!parsed.ok) assert.match(parsed.diagnostics.join(","), /not declared/);
});

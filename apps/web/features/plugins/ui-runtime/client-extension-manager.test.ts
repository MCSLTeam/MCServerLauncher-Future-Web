import test from "node:test";
import assert from "node:assert/strict";

import {
  ClientExtensionManager,
  LocalStorageClientExtensionCacheStore,
  MemoryClientExtensionCacheStore,
  MemoryClientExtensionPayloadStore,
  type ClientExtensionKeyValueStorage,
} from "./client-extension-manager.ts";
import { buildMpxPackageFromSources } from "./package-builder.ts";
import {
  validateMpxPackage,
  type ValidatedMpxPackage,
} from "./mpx-validator.ts";

const uiSchema = {
  schema: "mcsl.ui.v1",
  root: { type: "Text", props: { Text: "Ready" }, children: [] },
} as const;

test("client extension manager caches renderable UI packages", () => {
  const manager = new ClientExtensionManager();
  const result = manager.install(makePackage());

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.entry.id, "community.example.status-panel");
    assert.equal(manager.get(result.entry.id)?.uiSchema, uiSchema);
    assert.equal(manager.list().length, 1);
  }
});

test("client extension manager caches client theme packages without UI schema", () => {
  const manager = new ClientExtensionManager();
  const result = manager.install(
    makePackage({
      uiSchema: undefined,
      deploymentPlan: {
        scopes: ["client"],
        client: {
          theme: { path: "client/theme.json", sha256: "a".repeat(64) },
          resources: [],
        },
      },
    }),
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.entry.uiSchema, undefined);
    assert.equal(result.entry.theme?.colors.accent, undefined);
    assert.equal(
      result.entry.deploymentPlan.client?.theme?.path,
      "client/theme.json",
    );
  }
});

test("client extension manager rejects daemon-only packages", () => {
  const manager = new ClientExtensionManager();
  const result = manager.install(
    makePackage({
      uiSchema: undefined,
      deploymentPlan: {
        scopes: ["daemon"],
        daemon: {
          plugin: { path: "daemon/plugin-bundle.zip", sha256: "b".repeat(64) },
          extensionPoints: [
            { kind: "provider", id: "provider.java", target: "daemon" },
          ],
          commands: [],
        },
      },
    }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "client_target_missing");
});

test("client extension manager persists and restores client cache entries", async () => {
  const store = new MemoryClientExtensionCacheStore();
  const writer = new ClientExtensionManager(store);
  const install = await writer.installPersisted(makePackage());
  assert.equal(install.ok, true);

  const reader = new ClientExtensionManager(store);
  await reader.restore();

  assert.equal(
    reader.get("community.example.status-panel")?.uiSchema?.root.type,
    "Text",
  );
  assert.equal(reader.list().length, 1);
  assert.equal(
    await reader.uninstallPersisted("community.example.status-panel"),
    true,
  );

  const afterDelete = new ClientExtensionManager(store);
  await afterDelete.restore();
  assert.equal(afterDelete.list().length, 0);
});

test("client extension manager persists payload bytes and rejects tampered restore", async () => {
  const built = await buildMpxPackageFromSources({
    package: { id: "community.example.payload", version: "1.0.0" },
    uiAuthoringJson5: `{
      schema: "mcsl.ui.v1",
      root: { type: "Text", props: { Text: "Ready" } },
    }`,
    themeJson: '{"schema":"mcsl.theme.v1","colors":{"accent":"#0070c0"}}',
    permissions: { host: [], events: [], network: [] },
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  const validation = await validateMpxPackage(built.bytes);
  assert.equal(validation.ok, true);
  if (!validation.ok) return;

  const metadataStore = new MemoryClientExtensionCacheStore();
  const payloadStore = new MemoryClientExtensionPayloadStore();
  const writer = new ClientExtensionManager(metadataStore, payloadStore);
  const install = await writer.installPersisted(
    validation.package,
    built.bytes,
  );
  assert.equal(install.ok, true);
  if (!install.ok) return;
  assert.equal(install.entry.cachedPayloads?.length, 2);

  const reader = new ClientExtensionManager(metadataStore, payloadStore);
  await reader.restore();
  const restored = reader.get("community.example.payload");
  assert.equal(restored?.cachedPayloads?.length, 2);
  const uiPayload = restored?.cachedPayloads?.find(
    (payload) => payload.path === "client/ui.json",
  );
  assert.notEqual(uiPayload, undefined);
  if (uiPayload === undefined) return;
  assert.notEqual(await payloadStore.readFile(uiPayload.storageRef), undefined);

  await payloadStore.writeFile(
    "community.example.payload",
    "client/ui.json",
    new TextEncoder().encode("tampered"),
    { sha256: uiPayload.sha256 },
  );
  const tampered = new ClientExtensionManager(metadataStore, payloadStore);
  await tampered.restore();
  assert.equal(tampered.get("community.example.payload"), undefined);
});

test("client extension manager skips non-client entries restored from a store", async () => {
  const store = new MemoryClientExtensionCacheStore();
  await store.writeEntry({
    id: "community.example.daemon-only",
    version: "1.0.0",
    manifest: makePackage({ uiSchema: undefined }).manifest,
    deploymentPlan: {
      scopes: ["daemon"],
      daemon: {
        plugin: { path: "daemon/plugin-bundle.zip", sha256: "d".repeat(64) },
        extensionPoints: [
          { kind: "provider", id: "provider.java", target: "daemon" },
        ],
        commands: [],
      },
    },
    resources: [],
    commands: [],
    fileDigests: {},
  });

  const manager = new ClientExtensionManager(store);
  await manager.restore();

  assert.equal(manager.list().length, 0);
});

test("local storage cache store persists sorted entries and deletes by plugin id", async () => {
  const storage = new MapBackedStorage();
  const store = new LocalStorageClientExtensionCacheStore(storage, "test.");
  const statusPanel = new ClientExtensionManager().install(makePackage());
  const alpha = new ClientExtensionManager().install(
    makePackage({
      manifest: {
        ...makePackage().manifest,
        package: { id: "community.example.alpha", version: "1.0.0" },
      },
    }),
  );
  assert.equal(statusPanel.ok, true);
  assert.equal(alpha.ok, true);

  if (statusPanel.ok) await store.writeEntry(statusPanel.entry);
  if (alpha.ok) await store.writeEntry(alpha.entry);
  storage.setItem("test.invalid-json", "{");
  storage.setItem("other.namespace", JSON.stringify({ id: "ignored" }));

  const restored = await store.readEntries();
  assert.deepEqual(
    restored.map((entry) => entry.id),
    ["community.example.alpha", "community.example.status-panel"],
  );

  await store.deleteEntry("community.example.alpha");
  assert.equal(storage.getItem("test.community.example.alpha"), null);
});

function makePackage(
  overrides: Partial<ValidatedMpxPackage> = {},
): ValidatedMpxPackage {
  return {
    manifest: {
      schema:
        "https://mcsl-team.github.io/schemas/mcsl-extension-1.0.schema.json",
      package: {
        id: "community.example.status-panel",
        version: "1.0.0",
      },
      runtime: { ui: "[1.0.0,2.0.0)" },
      targets: {
        client: { ui: { path: "client/ui.json", sha256: "c".repeat(64) } },
      },
      permissions: { host: [], events: [], network: [] },
      resources: [],
      integrity: { algorithm: "sha256", signed: false },
    },
    uiSchema,
    deploymentPlan: {
      scopes: ["client"],
      client: {
        ui: { path: "client/ui.json", sha256: "c".repeat(64) },
        resources: [],
      },
    },
    commands: [],
    fileDigests: { "client/ui.json": "c".repeat(64) },
    totalUncompressedBytes: 512,
    ...overrides,
  };
}

class MapBackedStorage implements ClientExtensionKeyValueStorage {
  readonly #items = new Map<string, string>();

  get length(): number {
    return this.#items.size;
  }

  key(index: number): string | null {
    return [...this.#items.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.#items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.#items.set(key, value);
  }

  removeItem(key: string): void {
    this.#items.delete(key);
  }
}

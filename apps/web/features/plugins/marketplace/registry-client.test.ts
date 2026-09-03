import test from "node:test";
import assert from "node:assert/strict";

import {
  RegistryClient,
  RegistryClientError,
  resolveDependencies,
  semverCompare,
} from "./registry-client.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("semverCompare orders versions", () => {
  assert.ok(semverCompare("1.0.0", "1.0.1") < 0);
  assert.ok(semverCompare("1.2.0", "1.10.0") < 0);
  assert.ok(semverCompare("2.0.0", "1.99.99") > 0);
  assert.equal(semverCompare("1.0.0", "1.0.0"), 0);
});

test("registry client lists plugins and maps categories", async () => {
  const calls: string[] = [];
  const client = new RegistryClient({
    baseUrl: "http://registry.test",
    fetchImpl: async (input) => {
      calls.push(String(input));
      const url = String(input);
      if (url.includes("/api/v1/categories")) {
        return jsonResponse({
          categories: [{ id: "monitoring", name: "Monitoring", description: "x" }],
        });
      }
      if (url.includes("/api/v1/plugins")) {
        return jsonResponse({
          total: 1,
          page: 1,
          pageSize: 20,
          sort: "updated",
          order: "desc",
          plugins: [
            {
              id: "acme.status",
              displayName: "Status",
              summary: "s",
              publisher: { id: "p1", slug: "acme" },
              categories: ["monitoring"],
              keywords: [],
              targets: { client: true, daemon: false },
              license: null,
              latestVersion: "1.0.0",
              publishedAt: "2026-01-01T00:00:00Z",
              updatedAt: "2026-01-01T00:00:00Z",
              downloads: 3,
              iconUrl: null,
            },
          ],
        });
      }
      return jsonResponse({ error: "not_found", message: "not found" }, 404);
    },
  });

  const categories = await client.categories();
  assert.equal(categories[0]?.id, "monitoring");

  const result = await client.listPlugins({ q: "status", target: "client" });
  assert.equal(result.total, 1);
  assert.equal(result.plugins[0]?.id, "acme.status");
  assert.ok(calls.some((url) => url.includes("q=status") && url.includes("target=client")));
});

test("registry client surfaces structured errors and timeouts", async () => {
  const client404 = new RegistryClient({
    baseUrl: "http://registry.test",
    fetchImpl: async () => jsonResponse({ error: "plugin_not_found", message: "gone" }, 404),
  });
  await assert.rejects(
    () => client404.getPlugin("missing"),
    (error: unknown) =>
      error instanceof RegistryClientError &&
      error.statusCode === 404 &&
      error.code === "plugin_not_found",
  );

  const unreachable = new RegistryClient({
    baseUrl: "http://registry.test",
    fetchImpl: async () => {
      throw new TypeError("fetch failed");
    },
  });
  await assert.rejects(
    () => unreachable.health(),
    (error: unknown) => error instanceof RegistryClientError && error.code === "registry_unreachable",
  );
});

test("registry client checkForUpdate compares installed vs latest", async () => {
  const detail = {
    id: "acme.status",
    displayName: "Status",
    summary: "s",
    publisher: { id: "p1", slug: "acme" },
    categories: [],
    keywords: [],
    targets: { client: true, daemon: false },
    license: null,
    latestVersion: "1.1.0",
    publishedAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    downloads: 1,
    iconUrl: null,
    description: "",
    homepage: null,
    repository: null,
    versions: [
      {
        version: "1.1.0",
        releasedAt: "2026-01-02T00:00:00Z",
        changelog: "fixes",
        sha256: "a".repeat(64),
        sizeBytes: 10,
        downloadCount: 1,
        targets: { client: true, daemon: false },
        runtime: null,
        signed: false,
        downloadUrl: "http://registry.test/api/v1/plugins/acme.status/versions/1.1.0/download",
      },
    ],
  };
  const client = new RegistryClient({
    baseUrl: "http://registry.test",
    fetchImpl: async () => jsonResponse(detail),
  });

  const noUpdate = await client.checkForUpdate("acme.status", "1.1.0");
  assert.equal(noUpdate?.updateAvailable, false);

  const update = await client.checkForUpdate("acme.status", "1.0.0");
  assert.equal(update?.updateAvailable, true);
  assert.equal(update?.latestVersion, "1.1.0");
  assert.equal(update?.changelog, "fixes");
});

function buildDepZip(id: string, version: string, deps: readonly { id: string; version: string }[] = []): Uint8Array {
  const manifest = JSON.stringify({
    schema: "https://mcsl-team.github.io/schemas/mcsl-extension-1.0.schema.json",
    package: { id, version, publisher: "test", displayName: id },
    targets: { client: { ui: { path: "client/ui.json", sha256: "a".repeat(64) } } },
    permissions: { host: [], events: [], network: [] },
    integrity: { algorithm: "sha256", signed: false },
    dependencies: deps.length > 0 ? { extensions: deps } : undefined,
  });
  return buildStoredZip([{ path: "manifest.json", bytes: new TextEncoder().encode(manifest) }]);
}

function buildStoredZip(entries: readonly { path: string; bytes: Uint8Array }[]): Uint8Array {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  let offset = 0;
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  for (const entry of entries) {
    const name = new TextEncoder().encode(entry.path);
    let crc = 0xffffffff;
    for (const byte of entry.bytes) crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
    crc = (crc ^ 0xffffffff) >>> 0;
    const head = new Uint8Array(30);
    const view = new DataView(head.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, entry.bytes.byteLength, true);
    view.setUint32(22, entry.bytes.byteLength, true);
    view.setUint16(26, name.byteLength, true);
    const cHead = new Uint8Array(46);
    const cView = new DataView(cHead.buffer);
    cView.setUint32(0, 0x02014b50, true);
    cView.setUint16(4, 20, true);
    cView.setUint16(6, 20, true);
    cView.setUint16(8, 0x0800, true);
    cView.setUint32(16, crc, true);
    cView.setUint32(20, entry.bytes.byteLength, true);
    cView.setUint32(24, entry.bytes.byteLength, true);
    cView.setUint16(28, name.byteLength, true);
    cView.setUint32(42, offset, true);
    local.push(concat([head, name, entry.bytes]));
    central.push(concat([cHead, name]));
    offset += 30 + name.byteLength + entry.bytes.byteLength;
  }
  const localBlob = concat(local);
  const centralBlob = concat(central);
  const eocd = new Uint8Array(22);
  const eview = new DataView(eocd.buffer);
  eview.setUint32(0, 0x06054b50, true);
  eview.setUint16(8, entries.length, true);
  eview.setUint16(10, entries.length, true);
  eview.setUint32(12, centralBlob.byteLength, true);
  eview.setUint32(16, localBlob.byteLength, true);
  return concat([localBlob, centralBlob, eocd]);
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.byteLength;
  }
  return out;
}

test("resolveDependencies resolves a chain, dependencies first", async () => {
  const result = await resolveDependencies({
    package: {
      package: { id: "app", version: "1.0.0" },
      dependencies: {
        extensions: [
          { id: "dep.a", version: "1.0.0" },
          { id: "dep.c", version: "1.2.0" },
        ],
      },
    },
    installed: new Set(["dep.c"]),
    fetchDependency: async (dependency) => ({
      bytes: buildDepZip(dependency.id, dependency.version),
      sha256: "x".repeat(64),
    }),
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(
      result.installOrder.map((entry) => entry.id),
      ["dep.a"],
    );
    assert.deepEqual(result.alreadyInstalled, ["dep.c"]);
  }
});

test("resolveDependencies walks transitive edges, dependencies-first", async () => {
  const result = await resolveDependencies({
    package: {
      package: { id: "app", version: "1.0.0" },
      dependencies: { extensions: [{ id: "dep.a", version: "1.0.0" }] },
    },
    installed: new Set(),
    fetchDependency: async (dependency) => ({
      bytes:
        dependency.id === "dep.a"
          ? buildDepZip("dep.a", "1.0.0", [{ id: "dep.b", version: "2.0.0" }])
          : buildDepZip("dep.b", "2.0.0"),
      sha256: "x".repeat(64),
    }),
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(
      result.installOrder.map((entry) => entry.id),
      ["dep.b", "dep.a"],
    );
  }
});

test("resolveDependencies reports missing and conflicting deps", async () => {
  const missing = await resolveDependencies({
    package: {
      package: { id: "app", version: "1.0.0" },
      dependencies: { extensions: [{ id: "ghost", version: "2.0.0" }] },
    },
    installed: new Set(),
    fetchDependency: async () => null,
  });
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.code, "dependency_unavailable");

  const conflict = await resolveDependencies({
    package: {
      package: { id: "app", version: "1.0.0" },
      dependencies: {
        extensions: [
          { id: "dep.a", version: "1.0.0" },
          { id: "dep.a", version: "2.0.0" },
        ],
      },
    },
    installed: new Set(),
    fetchDependency: async (dependency) => ({
      bytes: buildDepZip(dependency.id, dependency.version),
      sha256: "x".repeat(64),
    }),
  });
  assert.equal(conflict.ok, false);
  if (!conflict.ok) assert.equal(conflict.code, "dependency_version_conflict");
});

test("resolveDependencies terminates on cycles", async () => {
  const result = await resolveDependencies({
    package: {
      package: { id: "root", version: "1.0.0" },
      dependencies: { extensions: [{ id: "node", version: "1.0.0" }] },
    },
    installed: new Set(),
    fetchDependency: async (dependency) => ({
      bytes: buildDepZip(dependency.id, dependency.version, [{ id: "node", version: "1.0.0" }]),
      sha256: "x".repeat(64),
    }),
  });
  // The self-referencing cycle is detected via the seen-set; a single node
  // is queued and installed.
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.installOrder.length, 1);
});
import test from "node:test";
import assert from "node:assert/strict";

import {
  EXTENSION_DISPATCH_METHOD,
  applyExtensionStateEnvelope,
  applyExtensionStatePatch,
  applyExtensionStateSnapshot,
  dispatchExtensionRequest,
  dispatchPluginUiCommand,
  parseExtensionProtocolEnvelope,
  type ExtensionStatePatchEnvelope,
  type ExtensionStateSnapshotEnvelope,
} from "./extension-protocol.ts";

test("parses state.patch envelopes and applies monotonic revisions", () => {
  const parsed = parseExtensionProtocolEnvelope({
    protocol: "mcsl.extension.v1",
    type: "state.patch",
    plugin: "community.example.status-panel",
    revision: 2,
    patch: { cpu: 37.5, status: "running" },
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    const next = applyExtensionStatePatch(
      {
        plugin: "community.example.status-panel",
        revision: 1,
        state: { status: "starting" },
      },
      parsed.envelope as ExtensionStatePatchEnvelope,
    );

    assert.equal(next.applied, true);
    assert.equal(next.revision, 2);
    assert.deepEqual(next.state, { status: "running", cpu: 37.5 });
  }
});

test("ignores stale state.patch revisions", () => {
  const patch: ExtensionStatePatchEnvelope = {
    protocol: "mcsl.extension.v1",
    type: "state.patch",
    plugin: "community.example.status-panel",
    revision: 1,
    patch: { status: "stale" },
  };

  const next = applyExtensionStatePatch(
    {
      plugin: "community.example.status-panel",
      revision: 2,
      state: { status: "running" },
    },
    patch,
  );

  assert.equal(next.applied, false);
  assert.equal(next.revision, 2);
  assert.deepEqual(next.state, { status: "running" });
});

test("applies state.snapshot envelopes as full monotonic replacements", () => {
  const snapshot: ExtensionStateSnapshotEnvelope = {
    protocol: "mcsl.extension.v1",
    type: "state.snapshot",
    plugin: "community.example.status-panel",
    revision: 4,
    state: { status: "ready", cpu: 0.42 },
  };

  const next = applyExtensionStateSnapshot(
    {
      plugin: "community.example.status-panel",
      revision: 3,
      state: { status: "starting", memory: 512 },
    },
    snapshot,
  );

  assert.equal(next.applied, true);
  assert.equal(next.revision, 4);
  assert.deepEqual(next.state, { status: "ready", cpu: 0.42 });

  const stale = applyExtensionStateEnvelope(next, { ...snapshot, revision: 2 });
  assert.equal(stale.applied, false);
  assert.deepEqual(stale.state, next.state);
});

test("rejects unsafe patch keys before state mutation", () => {
  const parsed = parseExtensionProtocolEnvelope({
    protocol: "mcsl.extension.v1",
    type: "state.patch",
    plugin: "community.example.status-panel",
    revision: 3,
    patch: JSON.parse('{"__proto__":{"polluted":true}}'),
  });

  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.match(parsed.diagnostics.join(","), /unsafe key/);
  }
});

test("dispatches extension requests through the daemon extension RPC and parses the response", async () => {
  const calls: Array<{ method: string; params: Record<string, unknown> }> = [];
  const parsed = await dispatchExtensionRequest(
    {
      async request<T>(method: string, params: Record<string, unknown>) {
        calls.push({ method, params });
        return {
          envelope: {
            protocol: "mcsl.extension.v1",
            type: "response",
            id: "request-1",
            plugin: "community.example.status-panel",
            result: { refreshed: true },
          },
        } as T;
      },
    },
    {
      protocol: "mcsl.extension.v1",
      type: "request",
      id: "request-1",
      plugin: "community.example.status-panel",
      command: "refresh",
      params: { path: "world" },
    },
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.method, EXTENSION_DISPATCH_METHOD);
  assert.deepEqual(calls[0]?.params, {
    envelope: {
      protocol: "mcsl.extension.v1",
      type: "request",
      id: "request-1",
      plugin: "community.example.status-panel",
      command: "refresh",
      params: { path: "world" },
    },
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.envelope.type, "response");
    assert.deepEqual(parsed.envelope.result, { refreshed: true });
  }
});

test("dispatch helper rejects malformed daemon dispatch results before callers see them", async () => {
  const parsed = await dispatchExtensionRequest(
    {
      async request<T>() {
        return { notEnvelope: true } as T;
      },
    },
    {
      protocol: "mcsl.extension.v1",
      type: "request",
      id: "request-1",
      plugin: "community.example.status-panel",
      command: "refresh",
    },
  );

  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.match(
      parsed.diagnostics.join(","),
      /dispatch result envelope is missing/,
    );
  }
});

test("dispatches renderer command events through extension protocol requests", async () => {
  const calls: Array<{ method: string; params: Record<string, unknown> }> = [];
  const parsed = await dispatchPluginUiCommand(
    {
      async request<T>(method: string, params: Record<string, unknown>) {
        calls.push({ method, params });
        return {
          envelope: {
            protocol: "mcsl.extension.v1",
            type: "response",
            id: "ui-request-1",
            plugin: "community.example.status-panel",
            result: { accepted: true },
          },
        } as T;
      },
    },
    "community.example.status-panel",
    {
      command: {
        command: "refresh",
        params: { mode: "fast", checked: true },
      },
    },
    "ui-request-1",
  );

  assert.equal(calls[0]?.method, EXTENSION_DISPATCH_METHOD);
  assert.deepEqual(calls[0]?.params, {
    envelope: {
      protocol: "mcsl.extension.v1",
      type: "request",
      id: "ui-request-1",
      plugin: "community.example.status-panel",
      command: "refresh",
      params: { mode: "fast", checked: true },
    },
  });
  assert.equal(parsed.ok, true);
});

test("dispatch helper rejects renderer events without command binding", async () => {
  const parsed = await dispatchPluginUiCommand(
    {
      async request<T>() {
        throw new Error("must not dispatch");
      },
    },
    "community.example.status-panel",
    {},
  );

  assert.equal(parsed.ok, false);
  if (!parsed.ok) assert.match(parsed.diagnostics.join(","), /no command/);
});

test("parses structured protocol errors without C# runtime objects", () => {
  const parsed = parseExtensionProtocolEnvelope({
    protocol: "mcsl.extension.v1",
    type: "error",
    plugin: "community.example.status-panel",
    code: "instance_not_found",
    message: "Instance does not exist",
    details: { instanceId: "11111111-2222-3333-4444-555555555555" },
  });

  assert.equal(parsed.ok, true);
});

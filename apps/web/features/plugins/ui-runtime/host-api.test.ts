import test from "node:test";
import assert from "node:assert/strict";

import {
  createPluginHostBridge,
  isPluginHostCapability,
  PluginHostCallError,
  PluginHostCapabilityError,
  PluginHostEventPermissionError,
  type PluginHostCallAuditEntry,
  type PluginHostEventEnvelope,
} from "./host-api.ts";

test("host bridge exposes typed APIs without raw rpc or token handles", () => {
  const host = createPluginHostBridge({ capabilities: [] });

  assert.equal("log" in host, true);
  assert.equal("setState" in host, true);
  assert.equal("queryInstanceCatalog" in host, true);
  assert.equal("notify" in host, true);
  assert.equal("subscribeEvent" in host, true);
  assert.equal("rpc" in host, false);
  assert.equal("rawRpc" in host, false);
  assert.equal("token" in host, false);
  assert.equal("webSocket" in host, false);
});

test("host bridge gates state mutation by declared capability", () => {
  let patched: unknown = null;
  const denied = createPluginHostBridge({
    capabilities: [],
    onSetState: (patch) => {
      patched = patch;
    },
  });

  assert.throws(
    () => denied.setState({ title: "blocked" }),
    PluginHostCapabilityError,
  );
  assert.equal(patched, null);

  const allowed = createPluginHostBridge({
    capabilities: ["ui.state"],
    onSetState: (patch) => {
      patched = patch;
    },
  });

  allowed.setState({ title: "allowed" });
  assert.deepEqual(patched, { title: "allowed" });
});

test("host bridge gates readonly instance catalog query", async () => {
  const denied = createPluginHostBridge({ capabilities: ["ui.state"] });
  await assert.rejects(
    () => denied.queryInstanceCatalog(),
    PluginHostCapabilityError,
  );

  const allowed = createPluginHostBridge({
    capabilities: ["daemon.instance.query"],
    onQueryInstanceCatalog: async () => ({
      version: 7,
      instances: [
        {
          id: "00000000-0000-0000-0000-000000000001",
          name: "Survival",
          type: "MinecraftJava",
          version: "1.21.1",
          status: "Running",
          readyTimedOut: false,
        },
      ],
    }),
  });

  const catalog = await allowed.queryInstanceCatalog();
  assert.equal(catalog.version, 7);
  assert.equal(catalog.instances[0]?.name, "Survival");
});

test("host bridge gates notification capability and bounds logs", () => {
  const logs: string[] = [];
  const notifications: string[] = [];
  const host = createPluginHostBridge({
    capabilities: ["ui.notification"],
    onLog: (_level, message) => logs.push(message),
    onNotify: (request) => notifications.push(request.title),
  });

  host.log("info", "x".repeat(4096));
  host.notify({ title: "Done", message: "Complete" });

  assert.equal(logs[0]?.length, 2048);
  assert.deepEqual(notifications, ["Done"]);

  const denied = createPluginHostBridge({ capabilities: [] });
  assert.throws(
    () => denied.notify({ title: "Blocked", message: "No capability" }),
    PluginHostCapabilityError,
  );
});

test("host bridge audits allowed and denied host calls", () => {
  const audit: PluginHostCallAuditEntry[] = [];
  const host = createPluginHostBridge({
    capabilities: ["ui.state"],
    onAudit: (entry) => audit.push(entry),
  });

  host.log("info", "hello");
  host.setState({ title: "allowed" });
  assert.throws(
    () => host.notify({ title: "Blocked", message: "No capability" }),
    PluginHostCapabilityError,
  );

  assert.deepEqual(
    audit.map((entry) => [entry.call, entry.outcome, entry.code ?? "ok"]),
    [
      ["log", "ok", "ok"],
      ["setState", "ok", "ok"],
      ["notify", "denied", "host_capability_denied"],
    ],
  );
});

test("host bridge converts callback failures to standard errors", () => {
  const audit: PluginHostCallAuditEntry[] = [];
  const host = createPluginHostBridge({
    capabilities: ["ui.state"],
    onAudit: (entry) => audit.push(entry),
    onSetState: () => {
      throw new Error("storage failed");
    },
  });

  assert.throws(() => host.setState({ title: "boom" }), PluginHostCallError);
  const failure = audit.at(-1);
  assert.equal(failure?.call, "setState");
  assert.equal(failure?.outcome, "error");
  assert.equal(failure?.code, "host_callback_failed");
});

test("host bridge times out slow async daemon queries", async () => {
  const audit: PluginHostCallAuditEntry[] = [];
  const host = createPluginHostBridge({
    capabilities: ["daemon.instance.query"],
    callTimeoutMs: 1,
    onAudit: (entry) => audit.push(entry),
    onQueryInstanceCatalog: () =>
      new Promise((resolve) => {
        setTimeout(() => resolve({ version: 1, instances: [] }), 50);
      }),
  });

  await assert.rejects(() => host.queryInstanceCatalog(), PluginHostCallError);
  const failure = audit.at(-1);
  assert.equal(failure?.call, "queryInstanceCatalog");
  assert.equal(failure?.outcome, "timeout");
  assert.equal(failure?.code, "host_call_timeout");
});

test("host bridge gates event subscription by capability and manifest event", async () => {
  const audit: PluginHostCallAuditEntry[] = [];
  const deniedCapability = createPluginHostBridge({
    capabilities: [],
    events: ["daemon.instance.log"],
    onAudit: (entry) => audit.push(entry),
  });
  assert.throws(
    () => deniedCapability.subscribeEvent("daemon.instance.log", () => {}),
    PluginHostCapabilityError,
  );

  const deniedEvent = createPluginHostBridge({
    capabilities: ["daemon.event.subscribe"],
    events: [],
    onAudit: (entry) => audit.push(entry),
  });
  assert.throws(
    () => deniedEvent.subscribeEvent("daemon.instance.log", () => {}),
    PluginHostEventPermissionError,
  );

  let closed = false;
  let registeredHandler:
    | ((event: PluginHostEventEnvelope) => void | Promise<void>)
    | null = null;
  const allowed = createPluginHostBridge({
    capabilities: ["daemon.event.subscribe"],
    events: ["daemon.instance.log"],
    onAudit: (entry) => audit.push(entry),
    onSubscribeEvent: (_name, handler) => {
      registeredHandler = handler;
      return () => {
        closed = true;
      };
    },
  });

  const seen: PluginHostEventEnvelope[] = [];
  const subscription = allowed.subscribeEvent(
    "daemon.instance.log",
    (event) => {
      seen.push(event);
    },
  );
  assert.notEqual(registeredHandler, null);
  const emit = registeredHandler as unknown as (
    event: PluginHostEventEnvelope,
  ) => void | Promise<void>;
  await emit({ name: "daemon.instance.log", data: { line: "hello" } });
  subscription.unsubscribe();
  subscription.unsubscribe();

  assert.equal(closed, true);
  assert.equal(subscription.closed, true);
  assert.equal(seen[0]?.name, "daemon.instance.log");
  assert.deepEqual(
    audit.map((entry) => [entry.call, entry.outcome, entry.code ?? "ok"]),
    [
      ["subscribeEvent", "denied", "host_capability_denied"],
      ["subscribeEvent", "denied", "host_event_denied"],
      ["subscribeEvent", "ok", "ok"],
      ["dispatchEvent", "ok", "ok"],
      ["unsubscribeEvent", "ok", "ok"],
    ],
  );
});

test("host bridge normalizes event handler failures and timeouts", async () => {
  const failures: PluginHostCallAuditEntry[] = [];
  let failingHandler:
    | ((event: PluginHostEventEnvelope) => Promise<void>)
    | null = null;
  const failing = createPluginHostBridge({
    capabilities: ["daemon.event.subscribe"],
    events: ["daemon.instance.log"],
    onAudit: (entry) => failures.push(entry),
    onSubscribeEvent: (_name, handler) => {
      failingHandler = handler as (
        event: PluginHostEventEnvelope,
      ) => Promise<void>;
    },
  });

  failing.subscribeEvent("daemon.instance.log", () => {
    throw new Error("plugin callback failed");
  });
  await assert.rejects(
    () => failingHandler!({ name: "daemon.instance.log", data: {} }),
    PluginHostCallError,
  );
  assert.equal(failures.at(-1)?.call, "dispatchEvent");
  assert.equal(failures.at(-1)?.outcome, "error");
  assert.equal(failures.at(-1)?.code, "host_callback_failed");

  const timeouts: PluginHostCallAuditEntry[] = [];
  let slowHandler: ((event: PluginHostEventEnvelope) => Promise<void>) | null =
    null;
  const slow = createPluginHostBridge({
    capabilities: ["daemon.event.subscribe"],
    events: ["daemon.instance.log"],
    callTimeoutMs: 1,
    onAudit: (entry) => timeouts.push(entry),
    onSubscribeEvent: (_name, handler) => {
      slowHandler = handler as (
        event: PluginHostEventEnvelope,
      ) => Promise<void>;
    },
  });

  slow.subscribeEvent(
    "daemon.instance.log",
    () => new Promise((resolve) => setTimeout(resolve, 50)),
  );
  await assert.rejects(
    () => slowHandler!({ name: "daemon.instance.log", data: {} }),
    PluginHostCallError,
  );
  assert.equal(timeouts.at(-1)?.call, "dispatchEvent");
  assert.equal(timeouts.at(-1)?.outcome, "timeout");
  assert.equal(timeouts.at(-1)?.code, "host_call_timeout");
});

test("host bridge rejects globally unknown event names", () => {
  const host = createPluginHostBridge({
    capabilities: ["daemon.event.subscribe"],
    events: ["daemon.file.changed"],
  });

  assert.throws(
    () =>
      host.subscribeEvent(
        "daemon.file.changed" as "daemon.instance.log",
        () => {},
      ),
    PluginHostEventPermissionError,
  );
});

test("host capability validator matches the MVP allowlist", () => {
  assert.equal(isPluginHostCapability("ui.state"), true);
  assert.equal(isPluginHostCapability("daemon.file.write"), false);
});

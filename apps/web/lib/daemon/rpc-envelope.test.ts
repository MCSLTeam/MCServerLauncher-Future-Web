import assert from "node:assert/strict";
import test from "node:test";
import { V2_METHODS, V2_UPLOAD_ACK_METHOD, wsUrl } from "./types.ts";

test("wsUrl uses /api/v2", () => {
  assert.equal(
    wsUrl("127.0.0.1", "8080", false, "tok en"),
    "ws://127.0.0.1:8080/api/v2?token=tok%20en",
  );
  assert.equal(
    wsUrl("example.com", "443", true, "abc"),
    "wss://example.com:443/api/v2?token=abc",
  );
});

test("V2 method catalog uses mcsl.* names", () => {
  assert.equal(V2_METHODS.ping, "mcsl.daemon.ping");
  assert.equal(V2_METHODS.start, "mcsl.instance.start");
  assert.equal(V2_METHODS.halt, "mcsl.instance.halt");
  assert.equal(V2_METHODS.uploadOpen, "mcsl.file.upload.open");
  assert.equal(V2_METHODS.downloadRead, "mcsl.file.download.read");
  assert.equal(V2_METHODS.subscribe, "mcsl.event.subscribe");
  assert.equal(V2_METHODS.extensionDispatch, "mcsl.extension.dispatch");
  assert.equal(
    V2_METHODS.extensionDaemonBundleInstall,
    "mcsl.extension.daemon.bundle.install",
  );
  assert.equal(
    V2_METHODS.extensionDaemonBundleRemove,
    "mcsl.extension.daemon.bundle.remove",
  );
  assert.equal(V2_UPLOAD_ACK_METHOD, "mcsl.file.upload.ack");
});

type JsonRpcFixtureMessage = {
  jsonrpc?: string;
  method?: string;
  id?: string | number | null;
  params?: Record<string, unknown>;
  error?: { message?: string } & Record<string, unknown>;
  result?: unknown;
};

type CreateFixtureSetting = {
  name: string;
  target: string;
  instance_type: string;
  target_type: string;
  mc_version?: string;
  input_encoding?: string;
  output_encoding?: string;
  java_path?: string;
  arguments?: string[];
  source: string;
  source_type: string;
  mirror?: string;
  use_post_process?: boolean;
};

/** Minimal envelope classifier used by DaemonClient.handleTextMessage paths. */
function classifyJsonRpcMessage(
  message: JsonRpcFixtureMessage | null | undefined,
) {
  if (!message || typeof message !== "object") return { kind: "ignore" };
  if (
    message.jsonrpc === "2.0" &&
    message.method === V2_UPLOAD_ACK_METHOD &&
    message.params &&
    typeof message.params === "object"
  ) {
    return { kind: "upload_ack", params: message.params };
  }
  if (
    message.jsonrpc === "2.0" &&
    typeof message.method === "string" &&
    message.id == null &&
    message.params &&
    typeof message.params === "object" &&
    String(message.method).startsWith("mcsl.event.")
  ) {
    return { kind: "event", method: message.method, params: message.params };
  }
  if (message.jsonrpc === "2.0" && message.id != null) {
    if (message.error && typeof message.error === "object") {
      return { kind: "error", id: String(message.id), error: message.error };
    }
    return { kind: "result", id: String(message.id), result: message.result };
  }
  return { kind: "ignore" };
}

test("classifies success result", () => {
  const c = classifyJsonRpcMessage({
    jsonrpc: "2.0",
    id: "1",
    result: { time: 1 },
  });
  assert.equal(c.kind, "result");
  assert.equal(c.id, "1");
  assert.deepEqual(c.result, { time: 1 });
});

test("classifies error", () => {
  const c = classifyJsonRpcMessage({
    jsonrpc: "2.0",
    id: "2",
    error: { code: -32000, message: "fail", data: { message: "nope" } },
  });
  assert.equal(c.kind, "error");
  assert.equal(c.error!.message, "fail");
});

test("classifies event notification", () => {
  const c = classifyJsonRpcMessage({
    jsonrpc: "2.0",
    method: "mcsl.event.instance.log",
    params: {
      sequence: 1,
      timestamp: 2,
      data: { log: "hi" },
      meta: { instance_id: "x" },
    },
  });
  assert.equal(c.kind, "event");
  assert.equal(c.method, "mcsl.event.instance.log");
});

test("classifies upload ack", () => {
  const c = classifyJsonRpcMessage({
    jsonrpc: "2.0",
    method: V2_UPLOAD_ACK_METHOD,
    params: {
      session_id: SESSION_PLACEHOLDER(),
      offset: 0,
      length: 10,
      status: "accepted",
    },
  });
  assert.equal(c.kind, "upload_ack");
  assert.equal(c.params!.status, "accepted");
});

function SESSION_PLACEHOLDER() {
  return "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
}

// create request shape helper (mirror client.toCreateInstanceRequest without crypto)
function toCreateInstanceRequest(setting: CreateFixtureSetting) {
  const instanceId = "11111111-2222-3333-4444-555555555555";
  return {
    setting: {
      configuration: {
        instance_id: instanceId,
        name: setting.name,
        target: setting.target,
        instance_type: setting.instance_type,
        target_type: setting.target_type,
        version: setting.mc_version ?? "",
        input_encoding: setting.input_encoding ?? "utf-8",
        output_encoding: setting.output_encoding ?? "utf-8",
        java_path: setting.java_path ?? "",
        arguments: setting.arguments ?? [],
        environment_variables: {},
        event_rules: [],
      },
      source: setting.source,
      source_type: setting.source_type,
      mirror: setting.mirror ?? "none",
      use_post_process: setting.use_post_process ?? false,
    },
  };
}

test("create request nests configuration.version from mc_version", () => {
  const req = toCreateInstanceRequest({
    name: "demo",
    target: "server.jar",
    instance_type: "mc_java",
    target_type: "jar",
    mc_version: "1.21.1",
    java_path: "/usr/bin/java",
    arguments: ["-Xmx2G"],
    source: "https://example/server.jar",
    source_type: "none",
  });
  assert.equal(req.setting.configuration.version, "1.21.1");
  assert.equal(req.setting.configuration.instance_type, "mc_java");
  assert.equal(req.setting.mirror, "none");
  assert.deepEqual(req.setting.configuration.event_rules, []);
});

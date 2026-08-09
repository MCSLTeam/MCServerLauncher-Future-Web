export const EXTENSION_PROTOCOL_VERSION = "mcsl.extension.v1";
export const EXTENSION_DISPATCH_METHOD = "mcsl.extension.dispatch";

export type ExtensionJsonValue =
  | string
  | number
  | boolean
  | null
  | readonly ExtensionJsonValue[]
  | { readonly [key: string]: ExtensionJsonValue };

export type ExtensionProtocolEnvelope =
  | ExtensionStatePatchEnvelope
  | ExtensionStateSnapshotEnvelope
  | ExtensionEventEnvelope
  | ExtensionErrorEnvelope
  | ExtensionRequestEnvelope
  | ExtensionResponseEnvelope;

export interface ExtensionStatePatchEnvelope {
  readonly protocol: typeof EXTENSION_PROTOCOL_VERSION;
  readonly type: "state.patch";
  readonly plugin: string;
  readonly revision: number;
  readonly patch: Record<string, ExtensionJsonValue>;
}

export interface ExtensionStateSnapshotEnvelope {
  readonly protocol: typeof EXTENSION_PROTOCOL_VERSION;
  readonly type: "state.snapshot";
  readonly plugin: string;
  readonly revision: number;
  readonly state: Record<string, ExtensionJsonValue>;
}

export interface ExtensionEventEnvelope {
  readonly protocol: typeof EXTENSION_PROTOCOL_VERSION;
  readonly type: "event";
  readonly plugin: string;
  readonly name: string;
  readonly version: number;
  readonly data: Record<string, ExtensionJsonValue>;
  readonly meta?: Record<string, ExtensionJsonValue>;
}

export interface ExtensionErrorEnvelope {
  readonly protocol: typeof EXTENSION_PROTOCOL_VERSION;
  readonly type: "error";
  readonly id?: string;
  readonly plugin?: string;
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, ExtensionJsonValue>;
}

export interface ExtensionRequestEnvelope {
  readonly protocol: typeof EXTENSION_PROTOCOL_VERSION;
  readonly type: "request";
  readonly id: string;
  readonly plugin: string;
  readonly command: string;
  readonly params?: Record<string, ExtensionJsonValue>;
}

export interface ExtensionResponseEnvelope {
  readonly protocol: typeof EXTENSION_PROTOCOL_VERSION;
  readonly type: "response";
  readonly id: string;
  readonly plugin: string;
  readonly result?: ExtensionJsonValue;
  readonly error?: ExtensionErrorEnvelope;
}

export interface ExtensionStateSnapshot {
  readonly plugin: string;
  readonly revision: number;
  readonly state: Record<string, ExtensionJsonValue>;
}

export type ExtensionProtocolParseResult =
  | { readonly ok: true; readonly envelope: ExtensionProtocolEnvelope }
  | { readonly ok: false; readonly diagnostics: readonly string[] };

export interface ExtensionProtocolRpcTransport {
  request<T = unknown>(
    method: string,
    params: Record<string, unknown>,
  ): Promise<T>;
}

export interface ExtensionUiCommandEvent {
  readonly command?: {
    readonly command: string;
    readonly params?: Record<string, ExtensionJsonValue>;
  };
}

export async function dispatchPluginUiCommand(
  transport: ExtensionProtocolRpcTransport,
  plugin: string,
  event: ExtensionUiCommandEvent,
  requestId: string = createRequestId(),
): Promise<ExtensionProtocolParseResult> {
  if (event.command === undefined) {
    return { ok: false, diagnostics: ["ui event has no command binding"] };
  }

  return dispatchExtensionRequest(transport, {
    protocol: EXTENSION_PROTOCOL_VERSION,
    type: "request",
    id: requestId,
    plugin,
    command: event.command.command,
    ...(event.command.params === undefined
      ? {}
      : { params: event.command.params }),
  });
}

export async function dispatchExtensionRequest(
  transport: ExtensionProtocolRpcTransport,
  envelope: ExtensionRequestEnvelope,
): Promise<ExtensionProtocolParseResult> {
  const outbound = parseExtensionProtocolEnvelope(envelope);
  if (!outbound.ok) return outbound;
  if (outbound.envelope.type !== "request") {
    return { ok: false, diagnostics: ["envelope must be a request"] };
  }

  const result = await transport.request<{ envelope?: unknown }>(
    EXTENSION_DISPATCH_METHOD,
    { envelope },
  );
  if (!isRecord(result) || !("envelope" in result)) {
    return { ok: false, diagnostics: ["dispatch result envelope is missing"] };
  }

  return parseExtensionProtocolEnvelope(result.envelope);
}

export function parseExtensionProtocolEnvelope(
  value: unknown,
): ExtensionProtocolParseResult {
  const diagnostics: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, diagnostics: ["envelope must be an object"] };
  }

  if (value.protocol !== EXTENSION_PROTOCOL_VERSION) {
    diagnostics.push("protocol must be mcsl.extension.v1");
  }
  if (typeof value.type !== "string") {
    diagnostics.push("type must be a string");
  }

  switch (value.type) {
    case "state.patch":
      validatePlugin(value, diagnostics);
      validateRevision(value.revision, diagnostics);
      validateJsonObject(value.patch, "patch", diagnostics);
      break;
    case "state.snapshot":
      validatePlugin(value, diagnostics);
      validateRevision(value.revision, diagnostics);
      validateJsonObject(value.state, "state", diagnostics);
      break;
    case "event":
      validatePlugin(value, diagnostics);
      if (typeof value.name !== "string" || value.name.length === 0) {
        diagnostics.push("event name is required");
      }
      if (
        typeof value.version !== "number" ||
        !Number.isInteger(value.version) ||
        value.version < 1
      ) {
        diagnostics.push("event version must be a positive integer");
      }
      validateJsonObject(value.data, "data", diagnostics);
      if (value.meta !== undefined)
        validateJsonObject(value.meta, "meta", diagnostics);
      break;
    case "error":
      if (value.plugin !== undefined && typeof value.plugin !== "string") {
        diagnostics.push("plugin must be a string when present");
      }
      if (typeof value.code !== "string" || value.code.length === 0) {
        diagnostics.push("error code is required");
      }
      if (typeof value.message !== "string" || value.message.length === 0) {
        diagnostics.push("error message is required");
      }
      if (value.details !== undefined) {
        validateJsonObject(value.details, "details", diagnostics);
      }
      break;
    case "request":
      validatePlugin(value, diagnostics);
      if (typeof value.id !== "string" || value.id.length === 0) {
        diagnostics.push("request id is required");
      }
      if (typeof value.command !== "string" || value.command.length === 0) {
        diagnostics.push("command is required");
      }
      if (value.params !== undefined)
        validateJsonObject(value.params, "params", diagnostics);
      break;
    case "response":
      validatePlugin(value, diagnostics);
      if (typeof value.id !== "string" || value.id.length === 0) {
        diagnostics.push("response id is required");
      }
      if (value.error !== undefined) {
        const parsed = parseExtensionProtocolEnvelope(value.error);
        if (!parsed.ok)
          diagnostics.push(...parsed.diagnostics.map((d) => `error.${d}`));
      }
      if (value.result !== undefined && !isJsonValue(value.result)) {
        diagnostics.push("result must be JSON-serializable");
      }
      break;
    default:
      diagnostics.push("type is not supported");
      break;
  }

  if (diagnostics.length > 0) return { ok: false, diagnostics };
  return { ok: true, envelope: value as unknown as ExtensionProtocolEnvelope };
}

export function applyExtensionStatePatch(
  snapshot: ExtensionStateSnapshot,
  envelope: ExtensionStatePatchEnvelope,
): ExtensionStateSnapshot & { readonly applied: boolean } {
  if (
    snapshot.plugin !== envelope.plugin ||
    envelope.revision <= snapshot.revision
  ) {
    return { ...snapshot, applied: false };
  }

  assertSafePatchKeys(envelope.patch);
  return {
    plugin: snapshot.plugin,
    revision: envelope.revision,
    state: { ...snapshot.state, ...envelope.patch },
    applied: true,
  };
}

export function applyExtensionStateSnapshot(
  snapshot: ExtensionStateSnapshot,
  envelope: ExtensionStateSnapshotEnvelope,
): ExtensionStateSnapshot & { readonly applied: boolean } {
  if (
    snapshot.plugin !== envelope.plugin ||
    envelope.revision < snapshot.revision
  ) {
    return { ...snapshot, applied: false };
  }

  assertSafePatchKeys(envelope.state);
  return {
    plugin: snapshot.plugin,
    revision: envelope.revision,
    state: { ...envelope.state },
    applied: true,
  };
}

export function applyExtensionStateEnvelope(
  snapshot: ExtensionStateSnapshot,
  envelope: ExtensionProtocolEnvelope,
): ExtensionStateSnapshot & { readonly applied: boolean } {
  switch (envelope.type) {
    case "state.patch":
      return applyExtensionStatePatch(snapshot, envelope);
    case "state.snapshot":
      return applyExtensionStateSnapshot(snapshot, envelope);
    default:
      return { ...snapshot, applied: false };
  }
}

function createRequestId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `ui-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}

function validatePlugin(value: Record<string, unknown>, diagnostics: string[]) {
  if (typeof value.plugin !== "string" || value.plugin.length === 0) {
    diagnostics.push("plugin is required");
  }
}

function validateRevision(value: unknown, diagnostics: string[]) {
  if (!Number.isInteger(value) || Number(value) < 0) {
    diagnostics.push("revision must be a non-negative integer");
  }
}

function validateJsonObject(
  value: unknown,
  label: string,
  diagnostics: string[],
): void {
  if (!isRecord(value)) {
    diagnostics.push(`${label} must be an object`);
    return;
  }
  if (!isJsonValue(value)) {
    diagnostics.push(`${label} must be JSON-serializable`);
  }
  try {
    assertSafePatchKeys(value as Record<string, ExtensionJsonValue>);
  } catch (error) {
    diagnostics.push(
      error instanceof Error ? error.message : `${label} contains unsafe keys`,
    );
  }
}

function assertSafePatchKeys(value: Record<string, ExtensionJsonValue>): void {
  for (const [key, child] of Object.entries(value)) {
    if (key === "__proto__" || key === "prototype" || key === "constructor") {
      throw new Error(`unsafe key '${key}' is not allowed`);
    }
    if (isRecord(child))
      assertSafePatchKeys(child as Record<string, ExtensionJsonValue>);
  }
}

function isJsonValue(value: unknown): value is ExtensionJsonValue {
  if (value === null) return true;
  if (["string", "boolean"].includes(typeof value)) return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (isRecord(value)) return Object.values(value).every(isJsonValue);
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

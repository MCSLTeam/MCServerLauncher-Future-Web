export const PLUGIN_HOST_CAPABILITIES = [
  "ui.state",
  "ui.notification",
  "daemon.system.query",
  "daemon.instance.query",
  "daemon.event.subscribe",
  "storage.private",
] as const;

export const PLUGIN_HOST_EVENTS = [
  "daemon.instance.catalog.changed",
  "daemon.instance.log",
  "daemon.report",
  "daemon.notification",
] as const;

export type PluginHostCapability = (typeof PLUGIN_HOST_CAPABILITIES)[number];
export type PluginHostEventName = (typeof PLUGIN_HOST_EVENTS)[number];

export type PluginHostLogLevel = "debug" | "info" | "warning" | "error";

export type PluginHostStatePatch = Readonly<Record<string, unknown>>;

export type PluginHostCallName =
  | "log"
  | "setState"
  | "queryInstanceCatalog"
  | "notify"
  | "subscribeEvent"
  | "dispatchEvent"
  | "unsubscribeEvent";

export type PluginHostCallOutcome = "ok" | "denied" | "timeout" | "error";

export type PluginHostErrorCode =
  | "host_capability_denied"
  | "host_event_denied"
  | "host_call_timeout"
  | "host_callback_failed";

export interface PluginHostCallAuditEntry {
  readonly call: PluginHostCallName;
  readonly capability?: PluginHostCapability;
  readonly outcome: PluginHostCallOutcome;
  readonly code?: PluginHostErrorCode;
  readonly durationMs: number;
}

export interface PluginInstanceSummary {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly version: string;
  readonly status: string;
  readonly readyTimedOut: boolean;
}

export interface PluginInstanceCatalogView {
  readonly version: number;
  readonly instances: readonly PluginInstanceSummary[];
}

export interface PluginNotificationRequest {
  readonly title: string;
  readonly message: string;
  readonly severity?: "info" | "success" | "warning" | "error";
}

export interface PluginHostEventEnvelope<TData = unknown, TMeta = unknown> {
  readonly name: PluginHostEventName;
  readonly data: TData;
  readonly meta?: TMeta;
}

export type PluginHostEventHandler<TData = unknown, TMeta = unknown> = (
  event: PluginHostEventEnvelope<TData, TMeta>,
) => void | Promise<void>;

export interface PluginHostEventSubscription {
  readonly closed: boolean;
  unsubscribe(): void;
}

export interface PluginHostBridge {
  log(level: PluginHostLogLevel, message: string): void;
  setState(patch: PluginHostStatePatch): void;
  queryInstanceCatalog(): Promise<PluginInstanceCatalogView>;
  notify(request: PluginNotificationRequest): void;
  subscribeEvent(
    name: PluginHostEventName,
    handler: PluginHostEventHandler,
  ): PluginHostEventSubscription;
}

export interface PluginHostBridgeOptions {
  readonly capabilities: Iterable<string>;
  readonly events?: Iterable<string>;
  readonly callTimeoutMs?: number;
  readonly onAudit?: (entry: PluginHostCallAuditEntry) => void;
  readonly onLog?: (level: PluginHostLogLevel, message: string) => void;
  readonly onSetState?: (patch: PluginHostStatePatch) => void;
  readonly onQueryInstanceCatalog?: () => Promise<PluginInstanceCatalogView>;
  readonly onNotify?: (request: PluginNotificationRequest) => void;
  readonly onSubscribeEvent?: (
    name: PluginHostEventName,
    handler: PluginHostEventHandler,
  ) => PluginHostEventSubscription | (() => void) | void;
}

const MAX_LOG_MESSAGE_LENGTH = 2048;
const DEFAULT_CALL_TIMEOUT_MS = 250;

const EMPTY_CATALOG: PluginInstanceCatalogView = {
  version: 0,
  instances: [],
};

export function createPluginHostBridge(
  options: PluginHostBridgeOptions,
): PluginHostBridge {
  const capabilities = new Set(options.capabilities);
  const events = new Set(options.events ?? []);
  const timeoutMs = options.callTimeoutMs ?? DEFAULT_CALL_TIMEOUT_MS;

  return Object.freeze({
    log(level, message) {
      invokeSync(options, "log", undefined, () => {
        options.onLog?.(level, truncate(message, MAX_LOG_MESSAGE_LENGTH));
      });
    },
    setState(patch) {
      invokeSync(options, "setState", "ui.state", () => {
        ensureCapability(capabilities, "ui.state", "setState");
        options.onSetState?.(patch);
      });
    },
    queryInstanceCatalog() {
      return invokeAsync(
        options,
        "queryInstanceCatalog",
        "daemon.instance.query",
        timeoutMs,
        () => {
          ensureCapability(
            capabilities,
            "daemon.instance.query",
            "queryInstanceCatalog",
          );
          return (
            options.onQueryInstanceCatalog?.() ?? Promise.resolve(EMPTY_CATALOG)
          );
        },
      );
    },
    notify(request) {
      invokeSync(options, "notify", "ui.notification", () => {
        ensureCapability(capabilities, "ui.notification", "notify");
        options.onNotify?.(request);
      });
    },
    subscribeEvent(name, handler) {
      return invokeSync(
        options,
        "subscribeEvent",
        "daemon.event.subscribe",
        () => {
          ensureCapability(
            capabilities,
            "daemon.event.subscribe",
            "subscribeEvent",
          );
          ensureEventPermission(events, name, "subscribeEvent");
          return createSubscription(
            options,
            options.onSubscribeEvent?.(
              name,
              wrapEventHandler(options, name, handler, timeoutMs),
            ),
          );
        },
      );
    },
  } satisfies PluginHostBridge);
}

export function isPluginHostCapability(
  value: string,
): value is PluginHostCapability {
  return (PLUGIN_HOST_CAPABILITIES as readonly string[]).includes(value);
}

export function isPluginHostEventName(
  value: string,
): value is PluginHostEventName {
  return (PLUGIN_HOST_EVENTS as readonly string[]).includes(value);
}

function invokeSync<T>(
  options: PluginHostBridgeOptions,
  call: PluginHostCallName,
  capability: PluginHostCapability | undefined,
  action: () => T,
): T {
  const started = performance.now();
  try {
    const result = action();
    audit(options, call, capability, "ok", undefined, started);
    return result;
  } catch (error) {
    const normalized = normalizeHostError(error, call);
    audit(
      options,
      call,
      capability,
      normalized.outcome,
      normalized.code,
      started,
    );
    throw normalized.error;
  }
}

async function invokeAsync<T>(
  options: PluginHostBridgeOptions,
  call: PluginHostCallName,
  capability: PluginHostCapability,
  timeoutMs: number,
  action: () => Promise<T>,
): Promise<T> {
  const started = performance.now();
  try {
    const result = await withTimeout(action(), timeoutMs, call);
    audit(options, call, capability, "ok", undefined, started);
    return result;
  } catch (error) {
    const normalized = normalizeHostError(error, call);
    audit(
      options,
      call,
      capability,
      normalized.outcome,
      normalized.code,
      started,
    );
    throw normalized.error;
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  call: PluginHostCallName,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new PluginHostCallError("host_call_timeout", call)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

function ensureCapability(
  capabilities: ReadonlySet<string>,
  capability: PluginHostCapability,
  call: PluginHostCallName,
): void {
  if (!capabilities.has(capability)) {
    throw new PluginHostCapabilityError(capability, call);
  }
}

function ensureEventPermission(
  events: ReadonlySet<string>,
  name: string,
  call: PluginHostCallName,
): asserts name is PluginHostEventName {
  if (!isPluginHostEventName(name) || !events.has(name)) {
    throw new PluginHostEventPermissionError(name, call);
  }
}

function createSubscription(
  options: PluginHostBridgeOptions,
  registration: PluginHostEventSubscription | (() => void) | void,
): PluginHostEventSubscription {
  if (registration && typeof registration !== "function") {
    return new LocalPluginHostEventSubscription(options, () => {
      registration.unsubscribe();
    });
  }

  const cleanup = typeof registration === "function" ? registration : undefined;
  return new LocalPluginHostEventSubscription(options, cleanup);
}

function wrapEventHandler(
  options: PluginHostBridgeOptions,
  name: PluginHostEventName,
  handler: PluginHostEventHandler,
  timeoutMs: number,
): PluginHostEventHandler {
  return async (event) => {
    const started = performance.now();
    try {
      if (event.name !== name) {
        throw new PluginHostEventPermissionError(event.name, "dispatchEvent");
      }

      await withTimeout(
        Promise.resolve(handler(event)),
        timeoutMs,
        "dispatchEvent",
      );
      audit(
        options,
        "dispatchEvent",
        "daemon.event.subscribe",
        "ok",
        undefined,
        started,
      );
    } catch (error) {
      const normalized = normalizeHostError(error, "dispatchEvent");
      audit(
        options,
        "dispatchEvent",
        "daemon.event.subscribe",
        normalized.outcome,
        normalized.code,
        started,
      );
      throw normalized.error;
    }
  };
}

function normalizeHostError(
  error: unknown,
  call: PluginHostCallName,
): {
  readonly error: PluginHostCallError;
  readonly outcome: PluginHostCallOutcome;
  readonly code: PluginHostErrorCode;
} {
  if (error instanceof PluginHostCapabilityError) {
    return {
      error,
      outcome: "denied",
      code: "host_capability_denied",
    };
  }

  if (error instanceof PluginHostEventPermissionError) {
    return {
      error,
      outcome: "denied",
      code: "host_event_denied",
    };
  }

  if (error instanceof PluginHostCallError) {
    return {
      error,
      outcome: error.code === "host_call_timeout" ? "timeout" : "error",
      code: error.code,
    };
  }

  return {
    error: new PluginHostCallError("host_callback_failed", call, error),
    outcome: "error",
    code: "host_callback_failed",
  };
}

function audit(
  options: PluginHostBridgeOptions,
  call: PluginHostCallName,
  capability: PluginHostCapability | undefined,
  outcome: PluginHostCallOutcome,
  code: PluginHostErrorCode | undefined,
  started: number,
): void {
  options.onAudit?.({
    call,
    capability,
    outcome,
    code,
    durationMs: Math.max(0, performance.now() - started),
  });
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : value.slice(0, maxLength);
}

class LocalPluginHostEventSubscription implements PluginHostEventSubscription {
  private readonly options: PluginHostBridgeOptions;
  private cleanup: (() => void) | undefined;

  constructor(
    options: PluginHostBridgeOptions,
    cleanup: (() => void) | undefined,
  ) {
    this.options = options;
    this.cleanup = cleanup;
  }

  get closed(): boolean {
    return this.cleanup === undefined;
  }

  unsubscribe(): void {
    const cleanup = this.cleanup;
    if (cleanup === undefined) return;

    this.cleanup = undefined;
    invokeSync(
      this.options,
      "unsubscribeEvent",
      "daemon.event.subscribe",
      () => {
        cleanup();
      },
    );
  }
}

export class PluginHostCallError extends Error {
  readonly code: PluginHostErrorCode;
  readonly call: PluginHostCallName;
  readonly cause: unknown;

  constructor(
    code: PluginHostErrorCode,
    call: PluginHostCallName,
    cause?: unknown,
  ) {
    super(`Plugin host call '${call}' failed with '${code}'.`);
    this.name = "PluginHostCallError";
    this.code = code;
    this.call = call;
    this.cause = cause;
  }
}

export class PluginHostCapabilityError extends PluginHostCallError {
  readonly capability: PluginHostCapability;

  constructor(capability: PluginHostCapability, call: PluginHostCallName) {
    super("host_capability_denied", call);
    this.name = "PluginHostCapabilityError";
    this.capability = capability;
  }
}

export class PluginHostEventPermissionError extends PluginHostCallError {
  readonly eventName: string;

  constructor(eventName: string, call: PluginHostCallName) {
    super("host_event_denied", call);
    this.name = "PluginHostEventPermissionError";
    this.eventName = eventName;
  }
}

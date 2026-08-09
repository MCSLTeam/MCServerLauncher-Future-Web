import JSON5 from "json5";

import { isPluginUiDesignToken } from "./design-tokens.ts";

export const UI_SCHEMA_VERSION = "mcsl.ui.v1";

const MAX_DEPTH = 16;
const MAX_NODES = 200;
const MAX_TEXT_LENGTH = 4096;
const MAX_BINDING_PATH_SEGMENTS = 12;

const COMPONENTS = [
  "View",
  "Text",
  "Button",
  "TextBox",
  "TextArea",
  "ToggleSwitch",
  "CheckBox",
  "Select",
  "Card",
  "Tabs",
] as const;

const COMPONENT_SET = new Set<string>(COMPONENTS);

const COMMON_PROPS = new Set(["Id", "Hidden"]);

const PROPS_BY_COMPONENT: Record<PluginUiComponentType, ReadonlySet<string>> = {
  View: set("Direction", "Gap", "Padding", "Align", "Justify"),
  Text: set("Text", "Variant"),
  Button: set("Text", "Variant", "Size", "Disabled", "OnClick"),
  TextBox: set("Value", "Placeholder", "Disabled", "OnChanged"),
  TextArea: set("Value", "Placeholder", "Disabled", "OnChanged"),
  ToggleSwitch: set("IsOn", "Disabled", "OnChanged"),
  CheckBox: set("IsChecked", "Label", "Disabled", "OnChanged"),
  Select: set("Value", "Placeholder", "Options", "Disabled", "OnChanged"),
  Card: set("Title", "Description"),
  Tabs: set("Value", "Items", "OnChanged"),
};

const EVENT_PROPS = new Set(["OnClick", "OnChanged"]);
const DESIGN_TOKEN_PROPS = new Set(["Gap", "Padding"]);
const BINDING_PATTERN = /^\{state\.([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*)\}$/;
const EVENT_VALUE_BINDING_PATTERN = /^\{event\.value\}$/;
const FORMAT_BINDING_PATTERN =
  /^\{format\.(percent|number|bytes)\(state\.([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*)\)\}$/;
const HANDLER_PATTERN = /^[A-Za-z_][\w]*$/;
const COMMAND_PATTERN = /^[A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*$/;
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export type PluginUiComponentType = (typeof COMPONENTS)[number];
export type PluginUiPrimitive = string | number | boolean | null;
export type PluginUiValue =
  | PluginUiPrimitive
  | PluginUiValue[]
  | { readonly [key: string]: PluginUiValue };

export interface PluginUiSchema {
  readonly schema: typeof UI_SCHEMA_VERSION;
  readonly root: PluginUiNode;
}

export interface PluginUiNode {
  readonly type: PluginUiComponentType;
  readonly props: Readonly<Record<string, PluginUiValue>>;
  readonly children: readonly PluginUiNode[];
}

export interface PluginUiOption {
  readonly Value: string;
  readonly Text: string;
}

export interface PluginUiTabItem {
  readonly Value: string;
  readonly Text: string;
  readonly Children: readonly PluginUiNode[];
}

export interface PluginUiDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export type PluginUiParseResult =
  | { readonly ok: true; readonly schema: PluginUiSchema }
  | { readonly ok: false; readonly diagnostics: readonly PluginUiDiagnostic[] };

export type PluginUiCompileResult =
  | {
      readonly ok: true;
      readonly schema: PluginUiSchema;
      readonly runtimeJson: string;
    }
  | { readonly ok: false; readonly diagnostics: readonly PluginUiDiagnostic[] };

export interface PluginUiCommandBinding {
  readonly Command: string;
  readonly Params?: Readonly<Record<string, PluginUiValue>>;
}

export type PluginUiEventAction = string | PluginUiCommandBinding;

export type PluginUiBinding =
  | { readonly kind: "state"; readonly path: readonly string[] }
  | {
      readonly kind: "format";
      readonly formatter: "percent" | "number" | "bytes";
      readonly path: readonly string[];
    };

export function parsePluginUiSchema(source: string): PluginUiParseResult {
  let parsed: unknown;
  try {
    parsed = JSON5.parse(source);
  } catch (error) {
    return {
      ok: false,
      diagnostics: [
        diagnostic(
          "schema_parse_failed",
          "$",
          error instanceof Error
            ? error.message
            : "The UI schema is not valid JSON5.",
        ),
      ],
    };
  }

  return validatePluginUiSchema(parsed);
}

export function parsePluginRuntimeUiSchema(
  source: string,
): PluginUiParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    return {
      ok: false,
      diagnostics: [
        diagnostic(
          "schema_parse_failed",
          "$",
          error instanceof Error
            ? error.message
            : "The runtime UI schema is not valid JSON.",
        ),
      ],
    };
  }

  return validatePluginUiSchema(parsed);
}

export function validatePluginUiSchema(value: unknown): PluginUiParseResult {
  const diagnostics: PluginUiDiagnostic[] = [];
  const counter = { value: 0 };

  if (!isRecord(value)) {
    return {
      ok: false,
      diagnostics: [
        diagnostic(
          "schema_root_invalid",
          "$",
          "The UI schema root must be an object.",
        ),
      ],
    };
  }

  if (value.schema !== UI_SCHEMA_VERSION) {
    diagnostics.push(
      diagnostic(
        "schema_version_invalid",
        "$.schema",
        `The UI schema version must be '${UI_SCHEMA_VERSION}'.`,
      ),
    );
  }

  const root = normalizeNode(value.root, "$.root", 0, diagnostics, counter);
  if (!root || diagnostics.length > 0) {
    return { ok: false, diagnostics };
  }

  return { ok: true, schema: { schema: UI_SCHEMA_VERSION, root } };
}

export function compilePluginUiSchema(source: string): PluginUiCompileResult {
  const parsed = parsePluginUiSchema(source);
  if (!parsed.ok) return parsed;

  return {
    ok: true,
    schema: parsed.schema,
    runtimeJson: JSON.stringify(parsed.schema),
  };
}

export function parsePluginUiBinding(value: string): PluginUiBinding | null {
  const state = BINDING_PATTERN.exec(value);
  if (state) return { kind: "state", path: state[1]!.split(".") };

  const formatted = FORMAT_BINDING_PATTERN.exec(value);
  if (formatted) {
    return {
      kind: "format",
      formatter: formatted[1] as "percent" | "number" | "bytes",
      path: formatted[2]!.split("."),
    };
  }

  return null;
}

export function readStatePath(
  state: unknown,
  path: readonly string[],
): unknown {
  let current = state;
  for (const segment of path) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
}

function normalizeNode(
  value: unknown,
  path: string,
  depth: number,
  diagnostics: PluginUiDiagnostic[],
  counter: { value: number },
): PluginUiNode | null {
  if (depth > MAX_DEPTH) {
    diagnostics.push(
      diagnostic(
        "schema_depth_exceeded",
        path,
        `UI schema depth exceeds ${MAX_DEPTH}.`,
      ),
    );
    return null;
  }

  counter.value++;
  if (counter.value > MAX_NODES) {
    diagnostics.push(
      diagnostic(
        "schema_node_limit_exceeded",
        path,
        `UI schema node count exceeds ${MAX_NODES}.`,
      ),
    );
    return null;
  }

  if (!isRecord(value)) {
    diagnostics.push(
      diagnostic("node_invalid", path, "A UI node must be an object."),
    );
    return null;
  }

  if (typeof value.type !== "string" || !COMPONENT_SET.has(value.type)) {
    diagnostics.push(
      diagnostic(
        "component_unknown",
        `${path}.type`,
        `Unknown UI component '${String(value.type)}'.`,
      ),
    );
    return null;
  }

  const type = value.type as PluginUiComponentType;
  const props = normalizeProps(type, value.props, `${path}.props`, diagnostics);
  const children = normalizeChildren(
    value.children,
    `${path}.children`,
    depth,
    diagnostics,
    counter,
  );

  if (type === "Tabs") {
    normalizeTabsItems(
      props.Items,
      `${path}.props.Items`,
      depth,
      diagnostics,
      counter,
    );
  }

  return { type, props, children };
}

function normalizeProps(
  type: PluginUiComponentType,
  value: unknown,
  path: string,
  diagnostics: PluginUiDiagnostic[],
): Record<string, PluginUiValue> {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    diagnostics.push(
      diagnostic(
        "props_invalid",
        path,
        "Node props must be an object when present.",
      ),
    );
    return {};
  }

  const allowed = PROPS_BY_COMPONENT[type];
  const props: Record<string, PluginUiValue> = {};
  for (const [key, raw] of Object.entries(value)) {
    const propPath = `${path}.${key}`;
    if (!COMMON_PROPS.has(key) && !allowed.has(key)) {
      diagnostics.push(
        diagnostic(
          "prop_unknown",
          propPath,
          `Property '${key}' is not allowed on '${type}'.`,
        ),
      );
      continue;
    }

    if (key === "ClassName" || key === "Style" || key === "Html") {
      diagnostics.push(
        diagnostic(
          "prop_unsafe",
          propPath,
          `Property '${key}' is not allowed.`,
        ),
      );
      continue;
    }

    validatePropValue(type, key, raw, propPath, diagnostics);
    if (isPluginUiValue(raw)) props[key] = raw;
  }

  return props;
}

function validatePropValue(
  type: PluginUiComponentType,
  key: string,
  value: unknown,
  path: string,
  diagnostics: PluginUiDiagnostic[],
): void {
  if (!isPluginUiValue(value)) {
    diagnostics.push(
      diagnostic(
        "prop_value_invalid",
        path,
        "Property values must be JSON-compatible.",
      ),
    );
    return;
  }

  if (typeof value === "string") {
    if (value.length > MAX_TEXT_LENGTH) {
      diagnostics.push(
        diagnostic(
          "prop_text_too_long",
          path,
          `String property exceeds ${MAX_TEXT_LENGTH} characters.`,
        ),
      );
    }

    if (value.includes("<script") || value.includes("javascript:")) {
      diagnostics.push(
        diagnostic(
          "prop_script_forbidden",
          path,
          "Script-like strings are not allowed.",
        ),
      );
    }

    const binding = parsePluginUiBinding(value);
    if (value.startsWith("{") && value.endsWith("}") && !binding) {
      diagnostics.push(
        diagnostic(
          "binding_invalid",
          path,
          "Bindings must use {state.path} or an allowed formatter.",
        ),
      );
    }

    if (binding && binding.path.length > MAX_BINDING_PATH_SEGMENTS) {
      diagnostics.push(
        diagnostic(
          "binding_path_too_deep",
          path,
          "Binding path has too many segments.",
        ),
      );
    }
  }

  if (EVENT_PROPS.has(key)) {
    validateEventAction(value, path, diagnostics);
  }

  if (DESIGN_TOKEN_PROPS.has(key)) {
    if (
      typeof value !== "string" ||
      (!isPluginUiDesignToken(value) && !parsePluginUiBinding(value))
    ) {
      diagnostics.push(
        diagnostic(
          "token_invalid",
          path,
          "Design token value is not in the allowlist.",
        ),
      );
    }
  }

  if (type === "Select" && key === "Options")
    validateOptions(value, path, diagnostics);
}

function validateEventAction(
  value: unknown,
  path: string,
  diagnostics: PluginUiDiagnostic[],
): void {
  if (typeof value === "string") {
    if (!HANDLER_PATTERN.test(value)) {
      diagnostics.push(
        diagnostic(
          "handler_invalid",
          path,
          "Event handlers must be exported handler names.",
        ),
      );
    }
    return;
  }

  if (!isRecord(value)) {
    diagnostics.push(
      diagnostic(
        "event_action_invalid",
        path,
        "Event action must be a handler name or command binding object.",
      ),
    );
    return;
  }

  const keys = Object.keys(value);
  const unknown = keys.filter((key) => key !== "Command" && key !== "Params");
  for (const key of unknown) {
    diagnostics.push(
      diagnostic(
        "command_property_unknown",
        `${path}.${key}`,
        `Command binding property '${key}' is not allowed.`,
      ),
    );
  }

  if (
    typeof value.Command !== "string" ||
    !COMMAND_PATTERN.test(value.Command)
  ) {
    diagnostics.push(
      diagnostic(
        "command_invalid",
        `${path}.Command`,
        "Command must be a canonical extension command id.",
      ),
    );
  }

  if (value.Params !== undefined) {
    if (!isRecord(value.Params)) {
      diagnostics.push(
        diagnostic(
          "command_params_invalid",
          `${path}.Params`,
          "Command Params must be an object.",
        ),
      );
    } else {
      validateCommandParams(value.Params, `${path}.Params`, diagnostics);
    }
  }
}

function validateCommandParams(
  value: Record<string, unknown>,
  path: string,
  diagnostics: PluginUiDiagnostic[],
): void {
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (UNSAFE_KEYS.has(key)) {
      diagnostics.push(
        diagnostic(
          "command_param_key_unsafe",
          childPath,
          "Unsafe command parameter key is not allowed.",
        ),
      );
      continue;
    }

    if (!isPluginUiValue(child)) {
      diagnostics.push(
        diagnostic(
          "command_param_invalid",
          childPath,
          "Command parameters must be JSON-compatible.",
        ),
      );
      continue;
    }

    if (typeof child === "string") {
      validateCommandParamString(child, childPath, diagnostics);
    } else if (Array.isArray(child)) {
      validateCommandParamArray(child, childPath, diagnostics);
    } else if (isRecord(child)) {
      validateCommandParams(child, childPath, diagnostics);
    }
  }
}

function validateCommandParamArray(
  value: readonly PluginUiValue[],
  path: string,
  diagnostics: PluginUiDiagnostic[],
): void {
  value.forEach((child, index) => {
    const childPath = `${path}[${index}]`;
    if (typeof child === "string") {
      validateCommandParamString(child, childPath, diagnostics);
    } else if (Array.isArray(child)) {
      validateCommandParamArray(child, childPath, diagnostics);
    } else if (isRecord(child)) {
      validateCommandParams(child, childPath, diagnostics);
    }
  });
}

function validateCommandParamString(
  value: string,
  path: string,
  diagnostics: PluginUiDiagnostic[],
): void {
  const binding = parsePluginUiBinding(value);
  if (
    value.startsWith("{") &&
    value.endsWith("}") &&
    !binding &&
    !EVENT_VALUE_BINDING_PATTERN.test(value)
  ) {
    diagnostics.push(
      diagnostic(
        "binding_invalid",
        path,
        "Command parameter bindings must use {state.path}, {event.value}, or an allowed formatter.",
      ),
    );
  }

  if (binding && binding.path.length > MAX_BINDING_PATH_SEGMENTS) {
    diagnostics.push(
      diagnostic(
        "binding_path_too_deep",
        path,
        "Binding path has too many segments.",
      ),
    );
  }
}

function normalizeChildren(
  value: unknown,
  path: string,
  depth: number,
  diagnostics: PluginUiDiagnostic[],
  counter: { value: number },
): PluginUiNode[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    diagnostics.push(
      diagnostic("children_invalid", path, "Node children must be an array."),
    );
    return [];
  }

  const children: PluginUiNode[] = [];
  value.forEach((item, index) => {
    const child = normalizeNode(
      item,
      `${path}[${index}]`,
      depth + 1,
      diagnostics,
      counter,
    );
    if (child) children.push(child);
  });
  return children;
}

function normalizeTabsItems(
  value: PluginUiValue | undefined,
  path: string,
  depth: number,
  diagnostics: PluginUiDiagnostic[],
  counter: { value: number },
): void {
  if (value === undefined) {
    diagnostics.push(
      diagnostic("tabs_items_missing", path, "Tabs requires an Items array."),
    );
    return;
  }

  if (!Array.isArray(value) || value.length === 0) {
    diagnostics.push(
      diagnostic(
        "tabs_items_invalid",
        path,
        "Tabs Items must be a non-empty array.",
      ),
    );
    return;
  }

  const seen = new Set<string>();
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      diagnostics.push(
        diagnostic(
          "tabs_item_invalid",
          itemPath,
          "A tab item must be an object.",
        ),
      );
      return;
    }

    if (typeof item.Value !== "string" || item.Value.length === 0) {
      diagnostics.push(
        diagnostic(
          "tabs_item_value_invalid",
          `${itemPath}.Value`,
          "Tab Value is required.",
        ),
      );
    } else if (seen.has(item.Value)) {
      diagnostics.push(
        diagnostic(
          "tabs_item_duplicate",
          `${itemPath}.Value`,
          "Tab Values must be unique.",
        ),
      );
    } else {
      seen.add(item.Value);
    }

    if (typeof item.Text !== "string" || item.Text.length === 0) {
      diagnostics.push(
        diagnostic(
          "tabs_item_text_invalid",
          `${itemPath}.Text`,
          "Tab Text is required.",
        ),
      );
    }

    if (item.Children !== undefined) {
      normalizeChildren(
        item.Children,
        `${itemPath}.Children`,
        depth + 1,
        diagnostics,
        counter,
      );
    }
  });
}

function validateOptions(
  value: unknown,
  path: string,
  diagnostics: PluginUiDiagnostic[],
): void {
  if (!Array.isArray(value)) {
    diagnostics.push(
      diagnostic("options_invalid", path, "Options must be an array."),
    );
    return;
  }

  const seen = new Set<string>();
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      diagnostics.push(
        diagnostic("option_invalid", itemPath, "An option must be an object."),
      );
      return;
    }

    if (typeof item.Value !== "string" || item.Value.length === 0) {
      diagnostics.push(
        diagnostic(
          "option_value_invalid",
          `${itemPath}.Value`,
          "Option Value is required.",
        ),
      );
    } else if (seen.has(item.Value)) {
      diagnostics.push(
        diagnostic(
          "option_duplicate",
          `${itemPath}.Value`,
          "Option Values must be unique.",
        ),
      );
    } else {
      seen.add(item.Value);
    }

    if (typeof item.Text !== "string" || item.Text.length === 0) {
      diagnostics.push(
        diagnostic(
          "option_text_invalid",
          `${itemPath}.Text`,
          "Option Text is required.",
        ),
      );
    }
  });
}

function isPluginUiValue(value: unknown): value is PluginUiValue {
  if (value === null) return true;
  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
      return true;
    case "object":
      if (Array.isArray(value)) return value.every(isPluginUiValue);
      return Object.values(value as Record<string, unknown>).every(
        isPluginUiValue,
      );
    default:
      return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function diagnostic(
  code: string,
  path: string,
  message: string,
): PluginUiDiagnostic {
  return { code, path, message };
}

function set(...values: string[]): ReadonlySet<string> {
  return new Set(values);
}

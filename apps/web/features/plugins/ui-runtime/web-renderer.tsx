"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { pluginUiSpacingClass } from "@/features/plugins/ui-runtime/design-tokens";
import type { ExtensionJsonValue } from "@/features/plugins/ui-runtime/extension-protocol";
import {
  parsePluginUiBinding,
  readStatePath,
  type PluginUiNode,
  type PluginUiOption,
  type PluginUiSchema,
  type PluginUiTabItem,
  type PluginUiValue,
} from "@/features/plugins/ui-runtime/schema";

const INLINE_STATE_BINDING =
  /\{state\.([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*)\}/g;
const INLINE_FORMAT_BINDING =
  /\{format\.(percent|number|bytes)\(state\.([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*)\)\}/g;

export type PluginUiEventKind = "click" | "changed";

export interface PluginUiCommandEvent {
  readonly command: string;
  readonly params?: Record<string, ExtensionJsonValue>;
}

export interface PluginUiEvent {
  readonly handler?: string;
  readonly command?: PluginUiCommandEvent;
  readonly kind: PluginUiEventKind;
  readonly value?: unknown;
}

export interface PluginUiRendererProps {
  readonly schema: PluginUiSchema;
  readonly state: unknown;
  readonly onEvent?: (event: PluginUiEvent) => void;
  readonly className?: string;
}

export function PluginUiRenderer({
  schema,
  state,
  onEvent,
  className,
}: PluginUiRendererProps) {
  return (
    <div className={cn("w-full", className)}>
      <PluginUiNodeView node={schema.root} state={state} onEvent={onEvent} />
    </div>
  );
}

function PluginUiNodeView({
  node,
  state,
  onEvent,
}: {
  node: PluginUiNode;
  state: unknown;
  onEvent?: (event: PluginUiEvent) => void;
}) {
  if (toBoolean(resolveProp(node.props.Hidden, state))) return null;

  switch (node.type) {
    case "View":
      return (
        <div className={viewClassName(node.props, state)}>
          {renderChildren(node.children, state, onEvent)}
        </div>
      );
    case "Text":
      return (
        <p className={textClassName(node.props, state)}>
          {toText(resolveProp(node.props.Text, state))}
        </p>
      );
    case "Button":
      return (
        <Button
          type="button"
          variant={buttonVariant(resolveProp(node.props.Variant, state))}
          size={buttonSize(resolveProp(node.props.Size, state))}
          disabled={toBoolean(resolveProp(node.props.Disabled, state))}
          onClick={() => emit(onEvent, node.props.OnClick, "click", state)}
        >
          {toText(resolveProp(node.props.Text, state)) || "Button"}
        </Button>
      );
    case "TextBox":
      return (
        <Input
          value={toText(resolveProp(node.props.Value, state))}
          placeholder={toText(resolveProp(node.props.Placeholder, state))}
          disabled={toBoolean(resolveProp(node.props.Disabled, state))}
          onChange={(event) =>
            emit(
              onEvent,
              node.props.OnChanged,
              "changed",
              state,
              event.currentTarget.value,
            )
          }
        />
      );
    case "TextArea":
      return (
        <Textarea
          value={toText(resolveProp(node.props.Value, state))}
          placeholder={toText(resolveProp(node.props.Placeholder, state))}
          disabled={toBoolean(resolveProp(node.props.Disabled, state))}
          onChange={(event) =>
            emit(
              onEvent,
              node.props.OnChanged,
              "changed",
              state,
              event.currentTarget.value,
            )
          }
        />
      );
    case "ToggleSwitch":
      return (
        <Switch
          checked={toBoolean(resolveProp(node.props.IsOn, state))}
          disabled={toBoolean(resolveProp(node.props.Disabled, state))}
          onCheckedChange={(checked) =>
            emit(onEvent, node.props.OnChanged, "changed", state, checked)
          }
        />
      );
    case "CheckBox":
      return (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={toBoolean(resolveProp(node.props.IsChecked, state))}
            disabled={toBoolean(resolveProp(node.props.Disabled, state))}
            onCheckedChange={(checked) =>
              emit(
                onEvent,
                node.props.OnChanged,
                "changed",
                state,
                checked === true,
              )
            }
          />
          {toText(resolveProp(node.props.Label, state))}
        </label>
      );
    case "Select":
      return renderSelect(node, state, onEvent);
    case "Card":
      return (
        <Card>
          {node.props.Title || node.props.Description ? (
            <CardHeader>
              {node.props.Title ? (
                <CardTitle>
                  {toText(resolveProp(node.props.Title, state))}
                </CardTitle>
              ) : null}
              {node.props.Description ? (
                <CardDescription>
                  {toText(resolveProp(node.props.Description, state))}
                </CardDescription>
              ) : null}
            </CardHeader>
          ) : null}
          <CardContent className="flex flex-col gap-3">
            {renderChildren(node.children, state, onEvent)}
          </CardContent>
        </Card>
      );
    case "Tabs":
      return renderTabs(node, state, onEvent);
  }
}

function renderSelect(
  node: PluginUiNode,
  state: unknown,
  onEvent?: (event: PluginUiEvent) => void,
) {
  const options = asOptions(node.props.Options);
  const value = toText(resolveProp(node.props.Value, state));
  const selected = options.some((option) => option.Value === value)
    ? value
    : (options[0]?.Value ?? "");

  return (
    <Select
      value={selected}
      disabled={toBoolean(resolveProp(node.props.Disabled, state))}
      onValueChange={(next) =>
        emit(onEvent, node.props.OnChanged, "changed", state, next)
      }
    >
      <SelectTrigger className="w-full min-w-44">
        <SelectValue
          placeholder={toText(resolveProp(node.props.Placeholder, state))}
        />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.Value} value={option.Value}>
            {option.Text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function renderTabs(
  node: PluginUiNode,
  state: unknown,
  onEvent?: (event: PluginUiEvent) => void,
) {
  const items = asTabItems(node.props.Items);
  const value = toText(resolveProp(node.props.Value, state));
  const selected = items.some((item) => item.Value === value)
    ? value
    : (items[0]?.Value ?? "");

  return (
    <Tabs
      value={selected}
      onValueChange={(next) =>
        emit(onEvent, node.props.OnChanged, "changed", state, next)
      }
    >
      <TabsList>
        {items.map((item) => (
          <TabsTrigger key={item.Value} value={item.Value}>
            {item.Text}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.Value} value={item.Value}>
          <div className="flex flex-col gap-3">
            {renderChildren(item.Children, state, onEvent)}
          </div>
        </TabsContent>
      ))}
      {node.children.length > 0 ? (
        <div className="flex flex-col gap-3">
          {renderChildren(node.children, state, onEvent)}
        </div>
      ) : null}
    </Tabs>
  );
}

function renderChildren(
  children: readonly PluginUiNode[],
  state: unknown,
  onEvent?: (event: PluginUiEvent) => void,
): ReactNode {
  return children.map((child, index) => (
    <PluginUiNodeView
      key={`${child.type}-${index}`}
      node={child}
      state={state}
      onEvent={onEvent}
    />
  ));
}

function resolveProp(
  value: PluginUiValue | undefined,
  state: unknown,
): unknown {
  if (typeof value !== "string") return value;

  const binding = parsePluginUiBinding(value);
  if (binding) return resolveBinding(binding, state);

  return resolveInlineText(value, state);
}

function resolveBinding(
  binding: NonNullable<ReturnType<typeof parsePluginUiBinding>>,
  state: unknown,
): unknown {
  const raw = readStatePath(state, binding.path);
  if (binding.kind === "state") return raw;

  switch (binding.formatter) {
    case "percent":
      return typeof raw === "number" ? `${(raw * 100).toFixed(1)}%` : "";
    case "number":
      return typeof raw === "number" ? new Intl.NumberFormat().format(raw) : "";
    case "bytes":
      return typeof raw === "number" ? formatBytes(raw) : "";
  }
}

function resolveInlineText(value: string, state: unknown): string {
  const withState = value.replace(INLINE_STATE_BINDING, (_, path: string) =>
    toText(readStatePath(state, path.split("."))),
  );
  return withState.replace(
    INLINE_FORMAT_BINDING,
    (_, formatter: "percent" | "number" | "bytes", path: string) =>
      toText(
        resolveBinding(
          { kind: "format", formatter, path: path.split(".") },
          state,
        ),
      ),
  );
}

function emit(
  onEvent: ((event: PluginUiEvent) => void) | undefined,
  action: PluginUiValue | undefined,
  kind: PluginUiEventKind,
  state: unknown,
  value?: unknown,
): void {
  if (typeof action === "string" && action) {
    onEvent?.({ handler: action, kind, value });
    return;
  }

  const command = resolveCommandAction(action, state, value);
  if (command) onEvent?.({ command, kind, value });
}

function resolveCommandAction(
  action: PluginUiValue | undefined,
  state: unknown,
  eventValue: unknown,
): PluginUiCommandEvent | undefined {
  if (!isRecord(action) || typeof action.Command !== "string") return undefined;
  const params = isRecord(action.Params)
    ? resolveCommandParams(action.Params, state, eventValue)
    : undefined;
  return params === undefined
    ? { command: action.Command }
    : { command: action.Command, params };
}

function resolveCommandParams(
  params: Readonly<Record<string, PluginUiValue>>,
  state: unknown,
  eventValue: unknown,
): Record<string, ExtensionJsonValue> {
  const resolved: Record<string, ExtensionJsonValue> = {};
  for (const [key, value] of Object.entries(params)) {
    if (isUnsafeKey(key)) continue;
    resolved[key] = resolveCommandValue(value, state, eventValue);
  }
  return resolved;
}

function resolveCommandValue(
  value: PluginUiValue,
  state: unknown,
  eventValue: unknown,
): ExtensionJsonValue {
  if (typeof value === "string") {
    if (value === "{event.value}") return toJsonValue(eventValue);
    const binding = parsePluginUiBinding(value);
    if (binding) return toJsonValue(resolveBinding(binding, state));
    return resolveInlineText(value, state);
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveCommandValue(item, state, eventValue));
  }
  if (isRecord(value)) {
    return resolveCommandParams(value, state, eventValue);
  }
  return value;
}

function toJsonValue(value: unknown): ExtensionJsonValue {
  if (value === null || value === undefined) return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return Number.isFinite(value as number) || typeof value !== "number"
      ? (value as ExtensionJsonValue)
      : null;
  }
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (isRecord(value)) {
    const output: Record<string, ExtensionJsonValue> = {};
    for (const [key, child] of Object.entries(value)) {
      if (!isUnsafeKey(key)) output[key] = toJsonValue(child);
    }
    return output;
  }
  return null;
}

function isUnsafeKey(key: string): boolean {
  return key === "__proto__" || key === "prototype" || key === "constructor";
}

function viewClassName(
  props: Readonly<Record<string, PluginUiValue>>,
  state: unknown,
) {
  const direction = toText(resolveProp(props.Direction, state));
  const align = toText(resolveProp(props.Align, state));
  const justify = toText(resolveProp(props.Justify, state));

  return cn(
    "flex min-w-0",
    direction === "Horizontal" ? "flex-row" : "flex-col",
    pluginUiSpacingClass(resolveProp(props.Gap, state), "gap"),
    pluginUiSpacingClass(resolveProp(props.Padding, state), "padding"),
    align === "Center" && "items-center",
    align === "End" && "items-end",
    justify === "Center" && "justify-center",
    justify === "Between" && "justify-between",
    justify === "End" && "justify-end",
  );
}

function textClassName(
  props: Readonly<Record<string, PluginUiValue>>,
  state: unknown,
) {
  const variant = toText(resolveProp(props.Variant, state));
  return cn(
    variant === "Title" && "text-xl font-semibold tracking-tight",
    variant === "Subtitle" && "text-sm leading-6 text-muted-foreground",
    variant === "Label" && "text-xs font-medium text-muted-foreground",
    !variant && "text-sm leading-6",
  );
}

function buttonVariant(
  value: unknown,
): "default" | "outline" | "secondary" | "ghost" | "destructive" {
  switch (toText(value)) {
    case "Outline":
      return "outline";
    case "Secondary":
      return "secondary";
    case "Ghost":
      return "ghost";
    case "Danger":
      return "destructive";
    default:
      return "default";
  }
}

function buttonSize(value: unknown): "default" | "sm" | "lg" | "xs" {
  switch (toText(value)) {
    case "Xs":
      return "xs";
    case "Sm":
      return "sm";
    case "Lg":
      return "lg";
    default:
      return "default";
  }
}

function asOptions(value: PluginUiValue | undefined): PluginUiOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (
      !isRecord(item) ||
      typeof item.Value !== "string" ||
      typeof item.Text !== "string"
    ) {
      return [];
    }
    return [{ Value: item.Value, Text: item.Text }];
  });
}

function asTabItems(value: PluginUiValue | undefined): PluginUiTabItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (
      !isRecord(item) ||
      typeof item.Value !== "string" ||
      typeof item.Text !== "string"
    ) {
      return [];
    }
    return [
      {
        Value: item.Value,
        Text: item.Text,
        Children: Array.isArray(item.Children)
          ? (item.Children as unknown as PluginUiNode[])
          : [],
      },
    ];
  });
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : String(value);
}

function toBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value)) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let scaled = value;
  let index = 0;
  while (scaled >= 1024 && index < units.length - 1) {
    scaled /= 1024;
    index++;
  }
  return `${scaled.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

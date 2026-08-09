"use client";

import { Plus, RefreshCw, Save, Trash2, Upload, Wand2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  JAVA_INSTANCE_TYPES,
  formatInstanceTypeLabel,
  isInstallerBasedType,
  isJavaRuntimeType,
  normalizeInstanceType,
} from "@/features/console/event-types";
import type { JavaInfo } from "@/lib/create/types";
import { cn } from "@/lib/utils";

export function formatJavaRuntimeLabel(item: JavaInfo) {
  const version = item.version || "?";
  const arch = item.architecture || "?";
  return `(${version}, ${arch}) ${item.path}`;
}

/** WPF InstanceSettingsPage: vertical cards, dirty Save, advanced JVM for Java family */
export function InstanceSettingsPanel({
  t,
  instanceId,
  canOperate,
  busy,
  saving,
  canEdit,
  blockedReason,
  error,
  name,
  setName,
  type,
  setType,
  version,
  setVersion,
  java,
  setJava,
  javaList,
  javaScanning,
  jvmArgs,
  setJvmArgs,
  target,
  forceRerun,
  setForceRerun,
  consoleMode,
  setConsoleMode,
  replacementCoreName,
  dirty,
  onRefresh,
  onSave,
  onScanJava,
  onOpenJvmHelper,
  onPickReplacementCore,
  onClearReplacementCore,
}: {
  t: (key: string, params?: Record<string, string | number>) => string;
  instanceId: string;
  canOperate: boolean;
  busy: boolean;
  saving: boolean;
  canEdit: boolean;
  blockedReason: string | null;
  error: string | null;
  name: string;
  setName: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  version: string;
  setVersion: (v: string) => void;
  java: string;
  setJava: (v: string) => void;
  javaList: JavaInfo[];
  javaScanning: boolean;
  jvmArgs: string[];
  setJvmArgs: (args: string[] | ((prev: string[]) => string[])) => void;
  target: string;
  forceRerun: boolean;
  setForceRerun: (v: boolean) => void;
  consoleMode: "pipe" | "pty";
  setConsoleMode: (v: "pipe" | "pty") => void;
  replacementCoreName: string | null;
  dirty: boolean;
  onRefresh: () => void;
  onSave: () => void;
  onScanJava: () => void;
  onOpenJvmHelper: () => void;
  onPickReplacementCore: (file: File | null) => void;
  onClearReplacementCore: () => void;
}) {
  const wireType = normalizeInstanceType(type);
  const advanced = isJavaRuntimeType(wireType);
  const installer = isInstallerBasedType(wireType);
  const typeOptions = Array.from(
    new Set(
      [wireType, ...JAVA_INSTANCE_TYPES, "universal"].map((v) =>
        normalizeInstanceType(v),
      ),
    ),
  ).filter(Boolean);

  const selectedInList = javaList.some((item) => item.path === java);
  const javaDisabled = !canEdit || !canOperate || javaScanning || busy;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">
            {t("shared.instance.detail.settings")}
          </h2>
          <p className="mt-1 truncate font-mono text-sm text-muted-foreground">
            {instanceId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || saving || javaScanning}
            onClick={onRefresh}
          >
            <RefreshCw className="size-4" />
            {t("ui.common.refresh")}
          </Button>
          {dirty ? (
            <Button
              type="button"
              size="sm"
              disabled={!canEdit || !canOperate || saving || javaScanning}
              onClick={onSave}
            >
              <Save className="size-4" />
              {saving ? t("ui.common.loading") : t("ui.common.save")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mcsl-scrollbar min-h-0 flex-1 space-y-3 overflow-auto pb-6">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("shared.instance.detail.settings")}</CardTitle>
            <CardDescription>
              {t("shared.instances.table.name")} /{" "}
              {t("shared.instances.table.type")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>{t("shared.instances.table.name")}</FieldLabel>
                  <Input
                    value={name}
                    disabled={!canEdit}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>{t("shared.instances.table.type")}</FieldLabel>
                  <Select
                    value={wireType}
                    disabled={!canEdit}
                    onValueChange={(v) => setType(normalizeInstanceType(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {typeOptions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {formatInstanceTypeLabel(item)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <FieldLabel>
                  {t("shared.instance.settings.console-mode")}
                </FieldLabel>
                <Select
                  value={consoleMode}
                  disabled={!canEdit}
                  onValueChange={(v) =>
                    setConsoleMode(v === "pty" ? "pty" : "pipe")
                  }
                >
                  <SelectTrigger className="w-full sm:max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pipe">
                      {t("shared.instance.settings.console-mode-pipe")}
                    </SelectItem>
                    <SelectItem value="pty">
                      {t("shared.instance.settings.console-mode-pty")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {t("shared.instance.settings.console-mode-hint")}
                </FieldDescription>
              </Field>
              {!canEdit && blockedReason ? (
                <FieldDescription>{blockedReason}</FieldDescription>
              ) : null}
            </FieldGroup>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("shared.instances.table.version")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel>{t("shared.instances.table.version")}</FieldLabel>
              <Input
                value={version}
                disabled={!canEdit}
                onChange={(e) => setVersion(e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>

        {!advanced ? (
          <Card size="sm">
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("shared.instance.settings.basic-mode-notice")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card size="sm">
              <CardHeader>
                <CardTitle>{t("shared.instance.settings.java")}</CardTitle>
                <CardDescription>
                  {t("shared.create.field.java.manual")}
                </CardDescription>
                <CardAction>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!canOperate || busy || javaScanning}
                    onClick={onScanJava}
                  >
                    <RefreshCw
                      className={cn("size-4", javaScanning && "animate-spin")}
                    />
                    {javaScanning
                      ? t("shared.create.status.loading-java")
                      : t("shared.instance.settings.scan-java")}
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <FieldGroup className="gap-3">
                  <Field>
                    <FieldLabel>
                      {t("shared.create.field.java.select")}
                    </FieldLabel>
                    <Select
                      value={selectedInList ? java : undefined}
                      disabled={javaDisabled}
                      onValueChange={(value) => setJava(value)}
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue
                          placeholder={
                            javaScanning
                              ? t("shared.create.status.loading-java")
                              : javaList.length === 0
                                ? t("shared.instance.settings.java-empty")
                                : t("shared.create.field.java.select")
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {javaList.map((item) => (
                          <SelectItem key={item.path} value={item.path}>
                            <span className="font-mono text-xs sm:text-sm">
                              {formatJavaRuntimeLabel(item)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      {javaScanning
                        ? t("shared.create.status.loading-java")
                        : t("shared.instance.settings.java-count", {
                            count: javaList.length,
                          })}
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t("shared.create.field.java.manual")}
                    </FieldLabel>
                    <Input
                      value={java}
                      disabled={javaDisabled}
                      className="font-mono text-sm"
                      placeholder={t("shared.instance.settings.java")}
                      onChange={(e) => setJava(e.target.value)}
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>{t("shared.instance.settings.jvm-args")}</CardTitle>
                <CardAction>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!canEdit}
                      onClick={onOpenJvmHelper}
                    >
                      <Wand2 className="size-4" />
                      {t("shared.instance.settings.jvm-helper")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!canEdit}
                      onClick={() => setJvmArgs((prev) => [...prev, ""])}
                    >
                      <Plus className="size-4" />
                      {t("shared.instance.settings.add-arg")}
                    </Button>
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-3">
                {!jvmArgs.some((a) => a.includes(".jar")) ? (
                  <Alert>
                    <AlertDescription>
                      {t("shared.instance.settings.no-jar-arg-warn")}
                    </AlertDescription>
                  </Alert>
                ) : null}
                <ul className="space-y-2">
                  {jvmArgs.map((arg, index) => (
                    <li key={index} className="flex gap-2">
                      <Input
                        value={arg}
                        disabled={!canEdit}
                        className="font-mono text-sm"
                        onChange={(e) =>
                          setJvmArgs((prev) =>
                            prev.map((item, i) =>
                              i === index ? e.target.value : item,
                            ),
                          )
                        }
                      />
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        disabled={!canEdit}
                        onClick={() =>
                          setJvmArgs((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>{t("shared.instance.settings.target")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="truncate font-mono text-sm text-muted-foreground">
                  {target || "—"}
                </p>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>
                  {t("shared.instance.settings.core-replace")}
                </CardTitle>
                <CardDescription>
                  {t("shared.instance.settings.core-replace-desc")}
                </CardDescription>
                <CardAction>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!canEdit}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".jar,application/java-archive";
                        input.onchange = () => {
                          onPickReplacementCore(input.files?.[0] ?? null);
                        };
                        input.click();
                      }}
                    >
                      <Upload className="size-4" />
                      {t("shared.instance.settings.core-pick")}
                    </Button>
                    {replacementCoreName ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={!canEdit}
                        onClick={onClearReplacementCore}
                      >
                        {t("ui.common.clear")}
                      </Button>
                    ) : null}
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {replacementCoreName
                    ? replacementCoreName
                    : t("shared.instance.settings.core-none")}
                </p>
              </CardContent>
            </Card>

            {installer ? (
              <Card size="sm">
                <CardContent>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="force-rerun-installer"
                      checked={forceRerun}
                      disabled={!canEdit}
                      onCheckedChange={(v) => setForceRerun(v === true)}
                      className="mt-0.5"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="force-rerun-installer"
                        className="cursor-pointer font-medium"
                      >
                        {t("shared.instance.settings.force-rerun")}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t("shared.instance.settings.force-rerun-desc")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </div>
  );
}

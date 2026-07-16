"use client";

import { useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import {
  ConsolePage,
  ConsolePageHeader,
  ConsolePanel,
  ConsolePanelHeader,
} from "@/components/templates/console-surface";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale, useT } from "@/features/i18n/locale-provider";
import { type ThemeMode, useTheme } from "@/features/theme/theme-provider";
import type { LocalePreference } from "@/lib/i18n/types";
import {
  RESOURCE_PROVIDERS,
  type ResourceProviderId,
} from "@/lib/resource-providers";
import {
  loadSettings,
  saveSettings,
  type AppSettings,
} from "@/lib/settings-store";

function createDraft(theme: ThemeMode): AppSettings {
  if (typeof window === "undefined") {
    return {
      allowContextMenu: true,
      useTerminalInput: true,
      theme,
      downloadSource: "FastMirror",
      downloadThreads: 16,
      downloadErrorAction: "stop",
    };
  }
  return { ...loadSettings(), theme };
}

export default function SettingsPage() {
  const t = useT();
  const { preference, locales, setPreference } = useLocale();
  const { mode, setMode } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(() =>
    createDraft(mode),
  );
  const [saved, setSaved] = useState(false);

  // 主题以 ThemeProvider 为准，渲染时合成草稿
  const draft: AppSettings = { ...settings, theme: mode };

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    if (key === "theme") {
      setMode(value as ThemeMode);
      setSaved(false);
      return;
    }
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function onSave() {
    await saveSettings(draft);
    setSettings(draft);
    setSaved(true);
  }

  function updateDownload<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) {
    const next = { ...draft, [key]: value };
    saveSettings(next);
    setSettings(next);
    setSaved(true);
  }

  return (
    <ConsolePage>
      <Reveal>
        <ConsolePageHeader
          title={t("shared.settings.title")}
          subtitle={t("shared.settings.subtitle")}
          action={
            <Button type="button" onClick={onSave}>
              {t("shared.settings.save")}
            </Button>
          }
        />
      </Reveal>

      <Reveal delay={0.04}>
        <Tabs defaultValue="appearance">
          <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="appearance">
              {t("shared.settings.appearance.title")}
            </TabsTrigger>
            <TabsTrigger value="general">
              {t("shared.settings.general.title")}
            </TabsTrigger>
            <TabsTrigger value="instance">
              {t("shared.settings.instance-management.title")}
            </TabsTrigger>
            <TabsTrigger value="download">
              {t("shared.resource-center.title")}
            </TabsTrigger>
            <TabsTrigger value="about">
              {t("shared.settings.about.title")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance">
            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.appearance.theme.label")}
                description={t("shared.settings.appearance.theme.desc")}
              />
              <RadioGroup
                value={mode}
                onValueChange={(value) => update("theme", value as ThemeMode)}
              >
                {(
                  [
                    ["system", "shared.settings.appearance.theme.system"],
                    ["light", "shared.settings.appearance.theme.light"],
                    ["dark", "shared.settings.appearance.theme.dark"],
                  ] as const
                ).map(([value, key]) => (
                  <Field key={value} orientation="horizontal">
                    <RadioGroupItem id={`theme-${value}`} value={value} />
                    <FieldLabel
                      htmlFor={`theme-${value}`}
                      className="font-normal"
                    >
                      {t(key)}
                    </FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
            </ConsolePanel>
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.general.locale.label")}
                description={t("shared.settings.general.locale.desc")}
              />
              <Select
                value={preference}
                onValueChange={(value) =>
                  setPreference(value as LocalePreference)
                }
              >
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">
                    {t("shared.settings.general.locale.system")}
                  </SelectItem>
                  {locales.map((code) => (
                    <SelectItem key={code} value={code}>
                      {t(`shared.locale.${code}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("shared.settings.require-reload")}
              </p>
            </ConsolePanel>

            <ConsolePanel>
              <Field orientation="horizontal" className="items-start">
                <Checkbox
                  id="ctx"
                  checked={draft.allowContextMenu}
                  onCheckedChange={(v) =>
                    update("allowContextMenu", v === true)
                  }
                />
                <div className="space-y-1">
                  <FieldLabel htmlFor="ctx" className="font-medium">
                    {t("shared.settings.general.allow-contextmenu.label")}
                  </FieldLabel>
                  <FieldDescription>
                    {t("shared.settings.general.allow-contextmenu.desc")}
                  </FieldDescription>
                </div>
              </Field>
            </ConsolePanel>
          </TabsContent>

          <TabsContent value="instance">
            <ConsolePanel>
              <Field orientation="horizontal" className="items-start">
                <Checkbox
                  id="term"
                  checked={draft.useTerminalInput}
                  onCheckedChange={(v) =>
                    update("useTerminalInput", v === true)
                  }
                />
                <div className="space-y-1">
                  <FieldLabel htmlFor="term" className="font-medium">
                    {t(
                      "shared.settings.instance-management.use-terminal-input.label",
                    )}
                  </FieldLabel>
                  <FieldDescription>
                    {t(
                      "shared.settings.instance-management.use-terminal-input.desc",
                    )}
                  </FieldDescription>
                </div>
              </Field>
            </ConsolePanel>
          </TabsContent>

          <TabsContent value="download" className="space-y-4">
            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.download.source.label")}
                description={t("shared.settings.download.source.desc")}
              />
              <RadioGroup
                className="sm:grid-cols-2"
                value={draft.downloadSource}
                onValueChange={(value) =>
                  updateDownload("downloadSource", value as ResourceProviderId)
                }
              >
                {RESOURCE_PROVIDERS.map((provider) => (
                  <Field
                    key={provider.id}
                    orientation="horizontal"
                    className="rounded-lg border px-3 py-2"
                  >
                    <RadioGroupItem
                      id={`download-source-${provider.id}`}
                      value={provider.id}
                    />
                    <FieldLabel
                      htmlFor={`download-source-${provider.id}`}
                      className="font-normal"
                    >
                      {t(provider.displayNameKey)}
                    </FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
            </ConsolePanel>

            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.download.threads.label")}
                description={t("shared.settings.download.threads.desc")}
              />
              <Input
                type="number"
                min={1}
                max={256}
                value={draft.downloadThreads}
                className="max-w-40"
                onChange={(event) => {
                  const value = Math.min(
                    256,
                    Math.max(1, Number(event.target.value) || 1),
                  );
                  updateDownload("downloadThreads", value);
                }}
              />
            </ConsolePanel>

            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.download.failure.label")}
                description={t("shared.settings.download.failure.desc")}
              />
              <Select
                value={draft.downloadErrorAction}
                onValueChange={(value) =>
                  updateDownload(
                    "downloadErrorAction",
                    value as AppSettings["downloadErrorAction"],
                  )
                }
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stop">
                    {t("shared.settings.download.failure.stop")}
                  </SelectItem>
                  <SelectItem value="retry1">
                    {t("shared.settings.download.failure.retry1")}
                  </SelectItem>
                  <SelectItem value="retry3">
                    {t("shared.settings.download.failure.retry3")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </ConsolePanel>
          </TabsContent>

          <TabsContent value="about">
            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.about.info.title")}
              />
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">
                    {t("shared.settings.about.info.name")}
                  </dt>
                  <dd>MCSL Future Web</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("shared.settings.about.info.version")}
                  </dt>
                  <dd>0.1.0</dd>
                </div>
              </dl>
              {saved ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  {t("shared.settings.saved")}
                </p>
              ) : null}
            </ConsolePanel>
          </TabsContent>
        </Tabs>
      </Reveal>
    </ConsolePage>
  );
}

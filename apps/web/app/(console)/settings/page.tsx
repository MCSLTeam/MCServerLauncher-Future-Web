"use client";

import { useEffect, useState } from "react";

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
  checkForUpdate,
  loadDesktopSettings,
  openExternalUrl,
  readAutostartState,
  saveDesktopSettings,
  writeAutostartState,
  type DeleteConfirmMethod,
  type DesktopSettings,
  type DoubleClickAction,
  type UpdateCheckResult,
} from "@/lib/desktop-settings";
import { useIsTauriRuntime } from "@/lib/tauri-runtime";
import {
  RESOURCE_PROVIDERS,
  type ResourceProviderId,
} from "@/lib/resource-providers";
import {
  loadSettings,
  saveSettings,
  type AppSettings,
} from "@/lib/settings-store";

const APP_VERSION = "0.1.0";

function createDraft(theme: ThemeMode): AppSettings {
  if (typeof window === "undefined") {
    return {
      allowContextMenu: true,
      useTerminalInput: true,
      theme,
      downloadSource: "FastMirror",
      downloadThreads: 16,
      downloadErrorAction: "stop",
      autoAcceptMcJavaEula: true,
      autoDisableMcJavaOnlineMode: true,
      autoDisableMcBedrockOnlineMode: true,
      useMirrorForForge: true,
      useMirrorForFabric: true,
      useMirrorForNeoForge: true,
      useMirrorForQuilt: true,
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
  const isTauri = useIsTauriRuntime();
  const [desktop, setDesktop] = useState(() => loadDesktopSettings());
  const [autostart, setAutostart] = useState<boolean | null>(null);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(
    null,
  );
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    void readAutostartState().then((state) => setAutostart(state));
    if (desktop.checkUpdatesOnLaunch) {
      void checkForUpdate().then((result) => setUpdateResult(result));
    }
    // 仅挂载一次读取桌面运行时状态。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function updateDesktop<K extends keyof DesktopSettings>(
    key: K,
    value: DesktopSettings[K],
  ) {
    setDesktop((prev) => {
      const next = { ...prev, [key]: value };
      saveDesktopSettings(next);
      return next;
    });
  }

  async function toggleAutostart(enabled: boolean) {
    const current = await writeAutostartState(enabled);
    setAutostart(current);
  }

  async function runCheckUpdate() {
    setCheckingUpdate(true);
    try {
      setUpdateResult(await checkForUpdate());
    } finally {
      setCheckingUpdate(false);
    }
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

            <ConsolePanel>
              <ConsolePanelHeader title={t("shared.settings.desktop.title")} />
              <div className="space-y-1">
                <ToggleField
                  id="autostart"
                  checked={autostart === true}
                  disabled={!isTauri || autostart === null}
                  onChange={(v) => void toggleAutostart(v)}
                  label={t("shared.settings.desktop.follow-startup.label")}
                  description={t("shared.settings.desktop.follow-startup.desc")}
                />
                <ToggleField
                  id="check-launch"
                  checked={desktop.checkUpdatesOnLaunch}
                  onChange={(v) => updateDesktop("checkUpdatesOnLaunch", v)}
                  label={t(
                    "shared.settings.desktop.check-updates-on-launch.label",
                  )}
                  description={t(
                    "shared.settings.desktop.check-updates-on-launch.desc",
                  )}
                />
              </div>

              {isTauri ? (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={checkingUpdate}
                    onClick={() => void runCheckUpdate()}
                  >
                    {checkingUpdate
                      ? t("shared.settings.desktop.up-to-date", {
                          version: "…",
                        })
                      : t("shared.settings.desktop.check-now")}
                  </Button>
                  {updateResult?.releaseUrl ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("shared.settings.desktop.update-found", {
                        latest: updateResult.latestVersion,
                      })}{" "}
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() =>
                          void openExternalUrl(updateResult.releaseUrl)
                        }
                      >
                        {t("shared.settings.desktop.check-now")}
                      </Button>
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("shared.settings.desktop.unavailable")}
                    </p>
                  )}
                </div>
              ) : null}
            </ConsolePanel>
          </TabsContent>

          <TabsContent value="instance" className="space-y-4">
            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.instance-management.title")}
              />
              <ToggleField
                id="term"
                checked={draft.useTerminalInput}
                onChange={(v) => update("useTerminalInput", v)}
                label={t(
                  "shared.settings.instance-management.use-terminal-input.label",
                )}
                description={t(
                  "shared.settings.instance-management.use-terminal-input.desc",
                )}
              />
            </ConsolePanel>

            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.action-on-double-click.title")}
                description={t("shared.settings.action-on-double-click.desc")}
              />
              <Select
                value={desktop.actionOnDoubleClick}
                onValueChange={(value) =>
                  updateDesktop(
                    "actionOnDoubleClick",
                    value as DoubleClickAction,
                  )
                }
              >
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "none",
                      "console",
                      "settings",
                      "start",
                      "stop",
                      "restart",
                      "kill",
                    ] as const
                  ).map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`shared.settings.action-on-double-click.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ConsolePanel>

            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.delete-confirm.title")}
                description={t("shared.settings.delete-confirm.desc")}
              />
              <Select
                value={desktop.deleteConfirmMethod}
                onValueChange={(value) =>
                  updateDesktop(
                    "deleteConfirmMethod",
                    value as DeleteConfirmMethod,
                  )
                }
              >
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["confirm", "type-name"] as const).map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`shared.settings.delete-confirm.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ConsolePanel>

            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.instance-creation.title")}
              />
              <div className="space-y-1">
                <ToggleField
                  id="eula"
                  checked={draft.autoAcceptMcJavaEula}
                  onChange={(v) => update("autoAcceptMcJavaEula", v)}
                  label={t(
                    "shared.settings.instance-creation.auto-accept-eula.label",
                  )}
                  description={t(
                    "shared.settings.instance-creation.auto-accept-eula.desc",
                  )}
                />
                <ToggleField
                  id="java-online"
                  checked={draft.autoDisableMcJavaOnlineMode}
                  onChange={(v) => update("autoDisableMcJavaOnlineMode", v)}
                  label={t(
                    "shared.settings.instance-creation.auto-disable-java-online.label",
                  )}
                  description={t(
                    "shared.settings.instance-creation.auto-disable-java-online.desc",
                  )}
                />
                <ToggleField
                  id="be-online"
                  checked={draft.autoDisableMcBedrockOnlineMode}
                  onChange={(v) => update("autoDisableMcBedrockOnlineMode", v)}
                  label={t(
                    "shared.settings.instance-creation.auto-disable-bedrock-online.label",
                  )}
                  description={t(
                    "shared.settings.instance-creation.auto-disable-bedrock-online.desc",
                  )}
                />
              </div>
            </ConsolePanel>

            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.instance-creation.use-mirror.label")}
                description={t(
                  "shared.settings.instance-creation.use-mirror.desc",
                )}
              />
              <div className="space-y-1">
                <ToggleField
                  id="mirror-forge"
                  checked={draft.useMirrorForForge}
                  onChange={(v) => update("useMirrorForForge", v)}
                  label={t(
                    "shared.settings.instance-creation.use-mirror-forge.label",
                  )}
                />
                <ToggleField
                  id="mirror-fabric"
                  checked={draft.useMirrorForFabric}
                  onChange={(v) => update("useMirrorForFabric", v)}
                  label={t(
                    "shared.settings.instance-creation.use-mirror-fabric.label",
                  )}
                />
                <ToggleField
                  id="mirror-neoforge"
                  checked={draft.useMirrorForNeoForge}
                  onChange={(v) => update("useMirrorForNeoForge", v)}
                  label={t(
                    "shared.settings.instance-creation.use-mirror-neoforge.label",
                  )}
                />
                <ToggleField
                  id="mirror-quilt"
                  checked={draft.useMirrorForQuilt}
                  onChange={(v) => update("useMirrorForQuilt", v)}
                  label={t(
                    "shared.settings.instance-creation.use-mirror-quilt.label",
                  )}
                />
              </div>
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

          <TabsContent value="about" className="space-y-4">
            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.about.info.title")}
                description={t("shared.settings.about.about.disclaimer")}
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
                  <dd>{APP_VERSION}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a
                    href="https://github.com/MCSLTeam/MCServerLauncher-Future-Web/releases"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("shared.settings.about.check-updates.button")}
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a
                    href="https://github.com/MCSLTeam/MCServerLauncher-Future-Web"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("shared.settings.about.about.github")}
                  </a>
                </Button>
              </div>
            </ConsolePanel>

            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.about.info.license.title")}
              />
              <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {t("shared.settings.about.info.license.content")}
              </p>
            </ConsolePanel>

            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.about.special-thanks.title")}
              />
              <ul className="space-y-2 text-sm">
                {[
                  ["iNKORE", "inkore"],
                  ["BMCLAPI", "bmcl"],
                  ["BakaXL", "bakaxl"],
                  [t("shared.settings.about.special-thanks.qq.title"), "qq"],
                ].map(([name, key]) => (
                  <li key={key}>
                    <span className="font-medium">{name}</span>
                    <span className="text-muted-foreground">
                      {" — "}
                      {t(`shared.settings.about.special-thanks.${key}.desc`)}
                    </span>
                  </li>
                ))}
              </ul>
            </ConsolePanel>

            <ConsolePanel>
              <ConsolePanelHeader
                title={t("shared.settings.about.dependencies.title")}
              />
              <p className="text-sm text-muted-foreground">
                {t("shared.settings.about.about.qq")} ·{" "}
                {t("shared.settings.about.about.email")} ·{" "}
                {t("shared.settings.about.about.afdian")}
              </p>
            </ConsolePanel>
          </TabsContent>
        </Tabs>
      </Reveal>
    </ConsolePage>
  );
}

function ToggleField({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-1">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        className="mt-0.5"
        onCheckedChange={(value) => onChange(value === true)}
      />
      <div className="space-y-1">
        <FieldLabel htmlFor={id} className="font-medium">
          {label}
        </FieldLabel>
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
      </div>
    </div>
  );
}

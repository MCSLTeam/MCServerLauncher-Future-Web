"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/auth-provider";
import { useLocale, useT } from "@/features/i18n/locale-provider";
import { type ThemeMode, useTheme } from "@/features/theme/theme-provider";
import { resolveUnauthedDestination } from "@/lib/auth-routing";
import { isFirstLoad } from "@/lib/first-load";
import type { LocalePreference } from "@/lib/i18n/types";
import { MESSAGE_CATALOG } from "@/lib/i18n/messages";
import { loadSettings, saveSettings } from "@/lib/settings-store";

export default function WelcomeSetupPage() {
  const t = useT();
  const router = useRouter();
  const { ready, token } = useAuth();
  const { preference, locales, setPreference } = useLocale();
  const { mode: theme, setMode } = useTheme();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (token) {
      router.replace("/dashboard/");
      return;
    }
    if (!isFirstLoad()) {
      void resolveUnauthedDestination().then((dest) => {
        router.replace(dest);
      });
      return;
    }
    setChecking(false);
  }, [ready, token, router]);

  function onThemeChange(value: ThemeMode) {
    setMode(value);
  }

  function nextStep() {
    const current = loadSettings();
    saveSettings({ ...current, theme });
    router.push("/welcome/eula/");
  }

  if (checking) {
    return null;
  }

  return (
    <Reveal className="w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h1>{t("shared.welcome.settings")}</h1>
          </CardTitle>
          <CardDescription>{t("shared.welcome.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Field>
            <FieldLabel>
              {t("shared.settings.appearance.theme.label")}
            </FieldLabel>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["system", "shared.settings.appearance.theme.system"],
                  ["light", "shared.settings.appearance.theme.light"],
                  ["dark", "shared.settings.appearance.theme.dark"],
                ] as const
              ).map(([value, key]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={theme === value ? "default" : "outline"}
                  onClick={() => onThemeChange(value)}
                >
                  {t(key)}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("shared.settings.appearance.theme.desc")}
            </p>
          </Field>

          <Field>
            <FieldLabel>{t("shared.settings.general.locale.label")}</FieldLabel>
            <Select
              value={preference}
              onValueChange={(value) =>
                setPreference(value as LocalePreference)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">
                  {t("shared.settings.general.locale.system")}
                </SelectItem>
                {locales.map((code) => {
                  const lang = MESSAGE_CATALOG[code].language as
                    | { name?: string; country?: string }
                    | undefined;
                  const label = lang?.name
                    ? `${lang.name}${lang.country ? ` (${lang.country})` : ""}`
                    : code;
                  return (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("shared.settings.general.locale.desc")}
            </p>
          </Field>

          <div className="flex justify-end">
            <Button type="button" onClick={nextStep}>
              {t("ui.common.next-step")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Reveal>
  );
}

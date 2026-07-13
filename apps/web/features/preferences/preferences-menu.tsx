"use client";

import { motion } from "framer-motion";
import { Languages, Palette } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useT } from "@/features/i18n/locale-provider";
import { type ThemeMode, useTheme } from "@/features/theme/theme-provider";
import type { LocalePreference } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

const THEME_MODES = ["system", "light", "dark"] as const satisfies ThemeMode[];

const LANGUAGE_LABELS: Record<LocalePreference, string> = {
  system: "System",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文（台灣）",
  "zh-HK": "繁體中文（香港）",
  "zh-MEME": "梗体中文",
  "en-US": "English",
  "ja-JP": "日本語",
  "ru-RU": "Русский",
};

export function PreferencesMenu() {
  const t = useT();
  const { preference, locales, setPreference } = useLocale();
  const { mode, setMode } = useTheme();

  const languageOptions: LocalePreference[] = ["system", ...locales];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          type="button"
          aria-label={t("shared.preferences.root")}
          title={t("shared.preferences.root")}
          whileTap={{ scale: 0.96 }}
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-sm" }),
            "gap-0 px-0 sm:h-7 sm:w-auto sm:gap-1.5 sm:px-3 sm:has-data-[icon=inline-start]:pl-2",
          )}
        >
          <Palette
            data-icon="inline-start"
            aria-hidden="true"
            className="size-4"
          />
          <span className="hidden sm:inline">
            {t("shared.preferences.root")}
          </span>
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 py-2">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Languages aria-hidden="true" className="size-4" />
          {t("shared.preferences.language")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={preference}
          className="flex max-h-56 flex-col gap-1 overflow-y-auto"
        >
          {languageOptions.map((item) => (
            <DropdownMenuRadioItem
              key={item}
              value={item}
              className={cn(
                "py-1.5 [&_[data-slot=dropdown-menu-radio-item-indicator]]:hidden",
                item === preference &&
                  "bg-accent font-medium text-accent-foreground",
              )}
              onSelect={() => setPreference(item)}
            >
              <motion.span
                animate={{ x: item === preference ? 2 : 0 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                {item === "system"
                  ? t("shared.settings.general.locale.system")
                  : (LANGUAGE_LABELS[item] ?? item)}
              </motion.span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette aria-hidden="true" className="size-4" />
          {t("shared.preferences.theme.root")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mode}
          className="flex flex-col gap-1"
          onValueChange={(value) => setMode(value as ThemeMode)}
        >
          {THEME_MODES.map((item) => (
            <DropdownMenuRadioItem
              key={item}
              value={item}
              className={cn(
                "py-1.5 [&_[data-slot=dropdown-menu-radio-item-indicator]]:hidden",
                item === mode && "bg-accent font-medium text-accent-foreground",
              )}
            >
              {t(`shared.settings.appearance.theme.${item}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { useLocale } from "@repo/ui/src/utils/stores";
import { defineI18nConfig } from "#i18n";

export default defineI18nConfig(async () => await useLocale().generateConfig());

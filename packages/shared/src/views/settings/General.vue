<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Select from "@repo/ui/src/components/form/entries/Select.vue";
import Switch from "@repo/ui/src/components/form/entries/Switch.vue";
import { type Locale, useLocale } from "@repo/ui/src/utils/stores.ts";
import { computed, inject } from "vue";
import SettingsItem from "../../components/settings/SettingsItem.vue";
import { useSettings } from "../../utils/stores.ts";

const t = useI18n().t;
const requireRestart = inject<() => void>("requireRestart")!;
const settings = useSettings();

const messages = useLocale().getMessages();
const locale = computed({
  get() {
    return useLocale().locale;
  },
  set(locale: Locale) {
    useLocale().setLocale(locale);
    requireRestart();
  },
});
const locales = computed(() => [
  { label: t("shared.settings.general.locale.system"), value: "system" },
  ...Object.keys(messages).map((key) => ({
    label:
      messages[key as Locale]["language"]["name"] +
      " (" +
      messages[key as Locale]["language"]["country"] +
      ")",
    value: key,
  })),
]);
</script>

<template>
  <div class="settings__section">
    <SettingsItem
      :label="t('shared.settings.general.locale.label')"
      :desc="t('shared.settings.general.locale.desc')"
    >
      <Select v-model="locale" :options="locales" />
    </SettingsItem>
    <SettingsItem
      :label="t('shared.settings.general.allow-contextmenu.label')"
      :desc="t('shared.settings.general.allow-contextmenu.desc')"
    >
      <Switch v-model="settings.data.allowContextmenu" />
    </SettingsItem>
  </div>
</template>

<style scoped lang="scss"></style>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { type Theme, useTheme } from "@repo/ui/src/utils/stores.ts";
import { computed, inject } from "vue";
import SettingsItem from "../../components/settings/SettingsItem.vue";
import SelectButton from "@repo/ui/src/components/form/entries/SelectButton.vue";

const t = useI18n().t;
const requireRestart = inject<() => void>("requireRestart")!;

const theme = computed({
  get() {
    return useTheme().theme;
  },
  set(theme: string) {
    useTheme().change(theme as Theme, "viewTransition");
  },
});
const themes = computed(() => [
  {
    label: t("shared.settings.appearance.theme.system"),
    value: "system",
  },
  { label: t("shared.settings.appearance.theme.light"), value: "light" },
  { label: t("shared.settings.appearance.theme.dark"), value: "dark" },
]);
</script>

<template>
  <div class="settings__section">
    <SettingsItem
      label="shared.settings.appearance.theme.label"
      desc="shared.settings.appearance.theme.desc"
    >
      <SelectButton v-model="theme" :options="themes" />
    </SettingsItem>
  </div>
</template>

<style scoped lang="scss"></style>

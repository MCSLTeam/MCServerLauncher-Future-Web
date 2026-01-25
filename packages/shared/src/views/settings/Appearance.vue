<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  type Rendering,
  type Theme,
  useAppearance,
} from "@repo/ui/src/utils/stores.ts";
import { computed, inject } from "vue";
import SettingsItem from "../../components/settings/SettingsItem.vue";
import SelectButton from "@repo/ui/src/components/form/entries/SelectButton.vue";

const t = useI18n().t;
const requireRestart = inject<() => void>("requireRestart")!;

const theme = computed({
  get() {
    return useAppearance().theme;
  },
  set(theme: string) {
    useAppearance().changeTheme(theme as Theme);
  },
});
const themes = computed(() => [
  { label: t("shared.settings.appearance.theme.system"), value: "system" },
  { label: t("shared.settings.appearance.theme.light"), value: "light" },
  { label: t("shared.settings.appearance.theme.dark"), value: "dark" },
]);

const rendering = computed({
  get() {
    return useAppearance().rendering;
  },
  set(rendering: string) {
    useAppearance().setRendering(rendering as Rendering);
  },
});
const renderings = computed(() => [
  {
    label: t("shared.settings.appearance.rendering.advanced.label"),
    value: "advanced",
  },
  {
    label: t("shared.settings.appearance.rendering.basic.label"),
    value: "basic",
  },
  {
    label: t("shared.settings.appearance.rendering.fast.label"),
    value: "fast",
  },
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
    <SettingsItem
      label="shared.settings.appearance.rendering.label"
      :desc="`shared.settings.appearance.rendering.${rendering}.desc`"
    >
      <!-- TODO: 渲染模式 -->
      <SelectButton v-model="rendering" :options="renderings" />
    </SettingsItem>
  </div>
</template>

<style scoped lang="scss"></style>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { inject } from "vue";
import Switch from "@repo/ui/src/components/form/entries/Switch.vue";
import SettingsItem from "../../components/settings/SettingsItem.vue";
import { useSettings } from "../../utils/stores.ts";

const t = useI18n().t;
const requireRestart = inject<() => void>("requireRestart")!;
const settings = useSettings();
</script>

<template>
  <div class="settings__section">
    <SettingsItem
      label="shared.settings.instance-management.use-terminal-input.label"
      desc="shared.settings.instance-management.use-terminal-input.desc"
    >
      <Switch v-model="settings.data.useTerminalInput" />
    </SettingsItem>
  </div>
</template>

<style scoped lang="scss"></style>

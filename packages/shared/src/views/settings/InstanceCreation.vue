<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { inject } from "vue";
import { useSettings } from "../../utils/stores.ts";

const t = useI18n().t;
const requireRestart = inject<() => void>("requireRestart")!;
const settings = useSettings();
</script>

<template>
  <div class="settings__section"></div>
</template>

<style scoped lang="scss"></style>

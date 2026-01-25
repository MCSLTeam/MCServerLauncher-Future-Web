<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { inject } from "vue";

const t = useI18n().t;
const requireRestart = inject<() => void>("requireRestart")!;
</script>

<template>
  <div class="settings__section"></div>
</template>

<style scoped lang="scss"></style>

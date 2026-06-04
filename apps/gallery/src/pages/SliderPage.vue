<script setup lang="ts">
import { ref } from "vue";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Slider from "@repo/ui/src/components/form/entries/Slider.vue";

const value = ref(36);
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="note">Slider should stay slim, precise, and low-noise while still giving clear drag feedback.</p></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><Slider v-model="value" :min="0" :max="100" /></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">min, max, step, disabled, and value binding.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>

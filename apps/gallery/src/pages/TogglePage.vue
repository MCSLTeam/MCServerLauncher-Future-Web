<script setup lang="ts">
import { ref } from "vue";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import Checkbox from "@repo/ui/src/components/form/entries/Checkbox.vue";
import Switch from "@repo/ui/src/components/form/entries/Switch.vue";

const checked = ref(true);
const enabled = ref(false);
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><div class="stack"><Checkbox v-model="checked" /> <Switch v-model="enabled" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="stack"><Checkbox v-model="checked" /> <Switch v-model="enabled" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">Checkbox and Switch should share density, focus contrast, and calm hover feedback.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.stack { display: grid; gap: 14px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>

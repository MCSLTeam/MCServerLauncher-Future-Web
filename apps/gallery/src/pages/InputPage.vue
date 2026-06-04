<script setup lang="ts">
import { ref } from "vue";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import InputText from "@repo/ui/src/components/form/entries/InputText.vue";
import Textarea from "@repo/ui/src/components/form/entries/Textarea.vue";
import InputNumber from "@repo/ui/src/components/form/entries/InputNumber.vue";

const name = ref('Future Paper EU-1');
const note = ref('A calmer, denser settings field should still feel roomy enough to edit.');
const port = ref(25565);
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><div class="stack"><InputText v-model="name" placeholder="Instance name" /><InputNumber v-model="port" /><Textarea v-model="note" placeholder="Notes" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="stack"><InputText v-model="name" clearable /><InputText v-model="name" password /><Textarea v-model="note" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">InputText, Textarea, InputNumber: density, placeholder tone, invalid state, and inner action affordances.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.stack { display: grid; gap: 14px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>

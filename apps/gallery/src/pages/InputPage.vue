<script setup lang="ts">
import { InputNumber, InputText, Panel, Textarea } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const name = ref('Future Paper EU-1');
const note = ref('A calmer, denser settings field should still feel roomy enough to edit.');
const port = ref(25565);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><div class="doc-stack"><InputText v-model="name" placeholder="Instance name" /><InputNumber v-model="port" /><Textarea v-model="note" placeholder="Notes" /></div></Panel>
    </template>
    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="doc-stack"><InputText v-model="name" clearable /><InputText v-model="name" password /><Textarea v-model="note" /></div></Panel>
    </template>
    <template #api>
      <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">InputText, Textarea, InputNumber: density, placeholder tone, invalid state, and inner action affordances.</p></Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.stack { display: grid; gap: 14px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>

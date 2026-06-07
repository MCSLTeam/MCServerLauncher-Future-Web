<script setup lang="ts">
import { Panel, RadioGroup } from "@repo/ui";
import { ref } from "vue";

const value = ref('paper');
const options = [
  { label: 'Paper', value: 'paper' },
  { label: 'Fabric', value: 'fabric' },
  { label: 'NeoForge', value: 'neoforge' },
];
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><RadioGroup v-model="value" :options="options" /></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><RadioGroup v-model="value" :options="options" /></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">RadioGroup should stay compact, readable, and visually aligned with checkbox and switch controls.</p></Panel>
    </GalleryDocPage>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>

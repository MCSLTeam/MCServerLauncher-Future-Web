<script setup lang="ts">
import { Panel, Segmented, Select } from "@repo/ui";
import { ref } from "vue";

const runtime = ref('java17');
const flavor = ref('paper');
const runtimeOptions = [
  { label: 'Java 17', value: 'java17' },
  { label: 'Java 21', value: 'java21' },
];
const flavorOptions = [
  { label: 'Paper', value: 'paper' },
  { label: 'Fabric', value: 'fabric' },
  { label: 'NeoForge', value: 'neoforge' },
];
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><div class="doc-stack"><Select v-model="runtime" :options="runtimeOptions" placeholder="Choose runtime" /><Segmented v-model="flavor" :options="flavorOptions" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="doc-stack"><Select v-model="flavor" :options="flavorOptions" placeholder="Server flavor" /><Segmented v-model="runtime" :options="runtimeOptions" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">Select stays as a popup list; segmented selection replaces the old select-button visual pattern with a more WinUI / shadcn / naive-like control.</p></Panel>
    </GalleryDocPage>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.stack { display: grid; gap: 14px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>

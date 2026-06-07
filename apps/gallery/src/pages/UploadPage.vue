<script setup lang="ts">
import { FileDropper, FileInfo, Panel } from "@repo/ui";
import { ref } from "vue";

const files = ref<File[]>([]);
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Upload surfaces should feel practical and clean, with calm file summaries and clear destructive affordances.</p></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="doc-stack"><FileDropper v-model="files" :config="{ maxCount: 5 }" /><FileInfo v-model="files" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">FileDropper, FileDropperOverlay, FileInfo: state visibility, file metadata summaries, drag affordances, and maxCount / accept constraints.</p></Panel>
    </GalleryDocPage>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.stack { display: grid; gap: 14px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>

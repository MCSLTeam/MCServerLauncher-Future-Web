<script setup lang="ts">
import { ref } from "vue";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import FileDropper from "@repo/ui/src/components/upload/FileDropper.vue";
import FileInfo from "@repo/ui/src/components/upload/FileInfo.vue";

const files = ref<File[]>([]);
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="note">Upload surfaces should feel practical and clean, with calm file summaries and clear destructive affordances.</p></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="stack"><FileDropper v-model="files" :config="{ maxCount: 5 }" /><FileInfo v-model="files" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">FileDropper, FileDropperOverlay, FileInfo: state visibility, file metadata summaries, drag affordances, and maxCount / accept constraints.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.stack { display: grid; gap: 14px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>

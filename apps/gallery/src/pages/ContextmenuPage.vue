<script setup lang="ts">
import { Contextmenu, Panel } from "@repo/ui";
import { ref } from "vue";

const target = ref<HTMLElement | null>(null);
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Context menus should feel light and precise, especially in dense admin and file-management screens.</p></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div ref="target" class="context-target">Right click this area</div><Contextmenu :parent="target as any" :menu="[{ label: 'Rename' }, { label: 'Duplicate' }, { label: 'Delete', disabled: true }]" /></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">Menu structure, parent binding, animations, and integration with file/list rows.</p></Panel>
    </GalleryDocPage>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
.context-target { min-height: 140px; display: flex; align-items: center; justify-content: center; border: 1px dashed var(--mcsl-border-color-base); border-radius: var(--mcsl-border-radius-md); color: var(--mcsl-text-color-secondary); }
</style>

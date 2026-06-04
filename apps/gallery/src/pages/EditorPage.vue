<script setup lang="ts">
import { ref } from "vue";
import Panel from "@repo/ui/src/components/panel/Panel.vue";
import CodeEditor from "@repo/ui/src/components/editor/CodeEditor.vue";

const value = ref(`{
  "name": "Future Paper EU-1",
  "core": "paper-1.21.1-43.jar"
}`);
</script>

<template>
  <div class="page-shell">
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="note">Editor chrome should feel integrated with the rest of the shell, not like a completely separate visual product.</p></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="editor-wrap"><CodeEditor v-model="value" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="note">BaseTextEditor and CodeEditor should expose language selection, preview-friendly footer controls, and a calmer footer hierarchy.</p></Panel>
  </div>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.editor-wrap { min-height: 360px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>

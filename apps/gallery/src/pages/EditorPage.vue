<script setup lang="ts">
import { CodeEditor, Panel } from "@repo/ui";
import { ref } from "vue";

const value = ref(`{
  "name": "Future Paper EU-1",
  "core": "paper-1.21.1-43.jar"
}`);
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Editor chrome should feel integrated with the rest of the shell, not like a completely separate visual product.</p></Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="editor-wrap"><CodeEditor v-model="value" /></div></Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">BaseTextEditor and CodeEditor should expose language selection, preview-friendly footer controls, and a calmer footer hierarchy.</p></Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.editor-wrap { min-height: 360px; }
</style>

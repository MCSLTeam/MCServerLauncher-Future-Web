<script setup lang="ts">
import { CodeEditor, CopyableText, Panel } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const value = ref(`{
  "name": "Future Paper EU-1",
  "runtime": "java-21",
  "core": "paper-1.21.1-43.jar",
  "memory": 4096
}`);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="editor-meta">
          <CopyableText>daemon_instance.json</CopyableText>
          <CopyableText>UTF-8</CopyableText>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="editor-wrap">
          <CodeEditor v-model="value" default-lang="json" />
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.editor-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.editor-wrap {
  min-height: 360px;
}
</style>

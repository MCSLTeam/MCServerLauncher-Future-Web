<script setup lang="ts">
import { FileDropper, FileInfo, Message, Panel } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const files = ref<File[]>([]);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="upload-stack">
          <Message title="Upload policy" color="help">
            Up to five files are accepted in this gallery sample.
          </Message>
          <FileDropper v-model="files" :config="{ maxCount: 5 }" :file-info="false" />
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="upload-stack">
          <FileDropper v-model="files" :config="{ maxCount: 5 }" />
          <FileInfo v-model="files" />
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.upload-stack {
  display: grid;
  gap: 14px;
}
</style>

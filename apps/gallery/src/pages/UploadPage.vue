<script setup lang="ts">
import { FileDropper, FileInfo, Panel } from "@repo/ui";
import { ref } from "vue";

const files = ref<File[]>([]);
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Upload surfaces should feel practical and clean, with calm file summaries and clear destructive affordances.</p></Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="doc-stack"><FileDropper v-model="files" :config="{ maxCount: 5 }" /><FileInfo v-model="files" /></div></Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">FileDropper, FileDropperOverlay, FileInfo: state visibility, file metadata summaries, drag affordances, and maxCount / accept constraints.</p></Panel>
    </template>
  </GalleryDocPage>
</template>

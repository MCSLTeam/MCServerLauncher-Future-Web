<script setup lang="ts">
import { CopyableText, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Copyable text should remain understated until interaction is needed.</p></Panel>
    </template>
    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><CopyableText text="mcsl-future-web" /></Panel>
    </template>
  </GalleryDocPage>
</template>

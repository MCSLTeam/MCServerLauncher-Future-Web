<script setup lang="ts">
import { Divider, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Dividers should quietly separate structure without drawing attention.</p></Panel>
    </template>
    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="doc-stack"><p>Section one</p><Divider spacing="md" /><p>Section two</p></div></Panel>
    </template>
  </GalleryDocPage>
</template>

<script setup lang="ts">
import { Button, Panel, Popover } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Popover should feel like a light contextual surface rather than a secondary modal.</p></Panel>
    </template>
    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><Popover title="Inspector"><template #triggerer="{ toggle }"><Button @click="toggle">Open Popover</Button></template><p class="doc-note">Popover content should remain compact and readable.</p></Popover></Panel>
    </template>
  </GalleryDocPage>
</template>

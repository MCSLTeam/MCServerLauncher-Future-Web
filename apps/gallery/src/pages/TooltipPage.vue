<script setup lang="ts">
import { Button, Panel, Tooltip } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Tooltip should be subtle, fast, and never heavier than the trigger itself.</p></Panel>
    </template>
    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><Tooltip content="Helpful detail for this action."><template #triggerer="{ open, close }"><Button @mouseenter="open" @mouseleave="close">Hover me</Button></template></Tooltip></Panel>
    </template>
  </GalleryDocPage>
</template>

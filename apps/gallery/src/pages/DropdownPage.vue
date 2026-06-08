<script setup lang="ts">
import { Button, DropdownMenu, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Dropdowns should feel attached to their trigger, with restrained borders, shadows, and spacing.</p></Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><DropdownMenu :menu="[{ label: 'Open settings' }, { label: 'Duplicate instance' }, { label: 'Archive', disabled: true }]"><template #triggerer="{ toggle }"><Button @click="toggle">Open Menu</Button></template></DropdownMenu></Panel>
    </template>
  </GalleryDocPage>
</template>

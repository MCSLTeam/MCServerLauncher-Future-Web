<script setup lang="ts">
import { Button, DropdownMenu, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Dropdowns should feel attached to their trigger, with restrained borders, shadows, and spacing.</p></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><DropdownMenu :menu="[{ label: 'Open settings' }, { label: 'Duplicate instance' }, { label: 'Archive', disabled: true }]"><template #triggerer="{ toggle }"><Button @click="toggle">Open Menu</Button></template></DropdownMenu></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">Menu items, disabled states, trigger slots, follow-width behavior, and close-on-click semantics.</p></Panel>
    </GalleryDocPage>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>

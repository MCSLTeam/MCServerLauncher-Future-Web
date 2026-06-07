<script setup lang="ts">
import { Checkbox, Panel, Switch } from "@repo/ui";
import { ref } from "vue";

const checked = ref(true);
const enabled = ref(false);
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><div class="doc-stack"><Checkbox v-model="checked" /> <Switch v-model="enabled" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="doc-stack"><Checkbox v-model="checked" /> <Switch v-model="enabled" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">Checkbox and Switch should share density, focus contrast, and calm hover feedback.</p></Panel>
    </GalleryDocPage>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.stack { display: grid; gap: 14px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>

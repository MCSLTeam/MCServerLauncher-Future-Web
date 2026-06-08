<script setup lang="ts">
import { Panel, RadioGroup } from "@repo/ui";
import { ref } from "vue";

const value = ref('paper');
const options = [
  { label: 'Paper', value: 'paper' },
  { label: 'Fabric', value: 'fabric' },
  { label: 'NeoForge', value: 'neoforge' },
];
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><RadioGroup v-model="value" :options="options" /></Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><RadioGroup v-model="value" :options="options" /></Panel>
    </template>
  </GalleryDocPage>
</template>

<script setup lang="ts">
import { Panel, Segmented, Select } from "@repo/ui";
import { ref } from "vue";

const runtime = ref('java17');
const flavor = ref('paper');
const runtimeOptions = [
  { label: 'Java 17', value: 'java17' },
  { label: 'Java 21', value: 'java21' },
];
const flavorOptions = [
  { label: 'Paper', value: 'paper' },
  { label: 'Fabric', value: 'fabric' },
  { label: 'NeoForge', value: 'neoforge' },
];
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><div class="doc-stack"><Select v-model="runtime" :options="runtimeOptions" placeholder="Choose runtime" /><Segmented v-model="flavor" :options="flavorOptions" /></div></Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="doc-stack"><Select v-model="flavor" :options="flavorOptions" placeholder="Server flavor" /><Segmented v-model="runtime" :options="runtimeOptions" /></div></Panel>
    </template>
  </GalleryDocPage>
</template>

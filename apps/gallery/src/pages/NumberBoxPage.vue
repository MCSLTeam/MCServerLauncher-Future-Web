<script setup lang="ts">
import { InputNumber, Panel } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";
const value = ref(25565);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">NumberBox should feel just as calm and aligned as text input and select.</p></Panel>
    </template>
    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><InputNumber v-model="value" /></Panel>
    </template>
    <template #api>
      <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">value binding, min/max, and increment affordances.</p></Panel>
    </template>
  </GalleryDocPage>
</template>

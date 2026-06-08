<script setup lang="ts">
import { Panel, Slider } from "@repo/ui";
import { ref } from "vue";

const value = ref(36);
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Slider should stay slim, precise, and low-noise while still giving clear drag feedback.</p></Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><Slider v-model="value" :min="0" :max="100" /></Panel>
    </template>
  </GalleryDocPage>
</template>

<script setup lang="ts">
import { Button, Modal, Panel } from "@repo/ui";
import { ref } from "vue";

const visible = ref(false);
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Modal layers should feel elevated but not heavy. Overlay contrast should be supportive, not theatrical.</p></Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><Button @click="visible = true">Open Modal</Button><Modal v-model:visible="visible" header="Modal Preview"><p class="doc-note">A lighter modal surface with calmer overlay and tighter spacing.</p></Modal></Panel>
    </template>
  </GalleryDocPage>
</template>

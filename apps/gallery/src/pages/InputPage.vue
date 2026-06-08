<script setup lang="ts">
import { InputNumber, InputText, Panel, Textarea } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const name = ref('Future Paper EU-1');
const note = ref('A calmer, denser settings field should still feel roomy enough to edit.');
const port = ref(25565);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><div class="doc-stack"><InputText v-model="name" placeholder="Instance name" /><InputNumber v-model="port" /><Textarea v-model="note" placeholder="Notes" /></div></Panel>
    </template>
    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="doc-stack"><InputText v-model="name" clearable /><InputText v-model="name" password /><Textarea v-model="note" /></div></Panel>
    </template>
  </GalleryDocPage>
</template>

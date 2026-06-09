<script setup lang="ts">
import { InputNumber, InputText, Panel, Textarea } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const name = ref("Future Paper EU-1");
const note = ref("The resize handle should stay quiet while still being easy to grab.");
const port = ref(25565);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="input-grid">
          <InputText v-model="name" placeholder="Instance name" />
          <InputNumber v-model="port" />
          <Textarea v-model="note" placeholder="Notes" />
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="input-grid">
          <InputText v-model="name" clearable resizeable />
          <InputText v-model="name" password resizeable />
          <Textarea v-model="note" resizeable />
          <Textarea v-model="note" resize="horizontal" />
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.input-grid {
  display: grid;
  gap: 14px;
  justify-items: stretch;
}
</style>

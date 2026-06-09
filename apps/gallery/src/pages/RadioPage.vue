<script setup lang="ts">
import { Panel, RadioGroup } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const flavor = ref("paper");
const channel = ref("stable");

const flavorOptions = [
  { label: "Paper", value: "paper" },
  { label: "Fabric", value: "fabric" },
  { label: "NeoForge", value: "neoforge" },
];

const channelOptions = [
  { label: "Stable", value: "stable" },
  { label: "Snapshot", value: "snapshot" },
  { label: "Experimental", value: "experimental", disabled: true },
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="radio-stack">
          <RadioGroup v-model="flavor" :options="flavorOptions" size="small" />
          <RadioGroup v-model="flavor" :options="flavorOptions" />
          <RadioGroup v-model="flavor" :options="flavorOptions" size="large" />
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="radio-stack">
          <RadioGroup v-model="flavor" :options="flavorOptions" />
          <RadioGroup v-model="channel" :options="channelOptions" />
          <RadioGroup v-model="channel" :options="channelOptions" disabled />
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.radio-stack {
  display: grid;
  gap: 16px;
}
</style>

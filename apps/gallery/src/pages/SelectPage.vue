<script setup lang="ts">
import { Panel, Segmented, Select } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const runtime = ref("java21");
const flavor = ref("paper");
const region = ref("eu");
const features = ref(["console", "backup"]);

const runtimeOptions = [
  { label: "Java 21", value: "java21", icon: "fas fa-mug-hot" },
  { label: "Java 17", value: "java17", icon: "fas fa-mug-saucer" },
  { label: "Java 8", value: "java8", disabled: true },
];

const flavorOptions = [
  { label: "Paper", value: "paper", icon: "fas fa-layer-group" },
  { label: "Fabric", value: "fabric", icon: "fas fa-puzzle-piece" },
  { label: "NeoForge", value: "neoforge", icon: "fas fa-fire" },
];

const regionOptions = [
  {
    group: "Europe",
    options: [
      { label: "Frankfurt", value: "eu" },
      { label: "London", value: "uk" },
    ],
  },
  {
    group: "Asia",
    options: [
      { label: "Singapore", value: "sg" },
      { label: "Tokyo", value: "jp" },
    ],
  },
];

const featureOptions = [
  { label: "Console", value: "console" },
  { label: "Backup", value: "backup" },
  { label: "Metrics", value: "metrics" },
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="select-grid">
          <Select v-model="runtime" :options="runtimeOptions" prefix="Runtime: " />
          <Select v-model="region" :options="regionOptions" placeholder="Region" />
          <Segmented v-model="flavor" :options="flavorOptions" />
          <Segmented v-model="features" :options="featureOptions" multiple />
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="select-grid">
          <Select v-model="flavor" :options="flavorOptions" placeholder="Server flavor" />
          <Select disabled placeholder="Disabled select" :options="runtimeOptions" />
          <Segmented v-model="flavor" :options="flavorOptions" />
          <Segmented v-model="features" :options="featureOptions" multiple nullable />
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.select-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  align-items: start;
}

@media (max-width: 860px) {
  .select-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { Breadcrumbs, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const baseCrumbs = [
  { label: "MCSL Future", icon: "fas fa-cube" },
  { label: "Instances" },
  { label: "Paper EU-1" },
];

const linkedCrumbs = [
  { label: "Gallery", link: "/components/buttons" },
  { label: "Navigation", link: "/components/navigation" },
  { label: "Breadcrumbs" },
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="crumb-stack">
          <Breadcrumbs :items="baseCrumbs" />
          <Breadcrumbs :items="linkedCrumbs" seperator=">" />
          <Breadcrumbs :items="baseCrumbs" seperator="·" />
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Breadcrumbs :items="linkedCrumbs" />
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.crumb-stack {
  display: grid;
  gap: 14px;
}
</style>

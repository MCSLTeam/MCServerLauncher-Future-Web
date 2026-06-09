<script setup lang="ts">
import { NavTabs, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const tabs = [
  { label: "Details", icon: "fas fa-circle-info" },
  { label: "Metrics", icon: "fas fa-chart-line" },
  { label: "History", icon: "fas fa-clock-rotate-left" },
  { label: "Danger", icon: "fas fa-triangle-exclamation", disabled: true },
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="tabs-stack">
          <NavTabs :tabs="tabs" size="small" />
          <NavTabs :tabs="tabs" />
          <NavTabs :tabs="tabs" size="large" color="help" />
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <NavTabs :tabs="tabs" shadow="hover" />
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.tabs-stack {
  display: grid;
  gap: 14px;
  justify-items: start;
}
</style>

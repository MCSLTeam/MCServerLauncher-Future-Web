<script setup lang="ts">
import { Panel, Sidebar } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const pages = [
  { label: "Overview", description: "Status", icon: "fas fa-gauge", link: "/components/sidebar" },
  { label: "Instances", description: "Fleet", icon: "fas fa-server" },
  { label: "Backups", description: "Jobs", icon: "fas fa-clock-rotate-left" },
  { label: "Settings", description: "Policy", icon: "fas fa-gear", disabled: true },
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="sidebar-grid">
          <Panel size="small">
            <template #header><h4>Expanded</h4></template>
            <Sidebar :pages="pages" />
          </Panel>
          <Panel size="small" class="collapsed-card">
            <template #header><h4>Collapsed</h4></template>
            <Sidebar :pages="pages" collapsed />
          </Panel>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Sidebar :pages="pages" />
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.sidebar-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  gap: 14px;
  align-items: start;
}

.collapsed-card {
  justify-self: start;
  width: 78px;
}

@media (max-width: 760px) {
  .sidebar-grid {
    grid-template-columns: 1fr;
  }
}
</style>

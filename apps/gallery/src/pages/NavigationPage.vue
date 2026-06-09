<script setup lang="ts">
import { Breadcrumbs, NavTabs, Panel, Sidebar } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const crumbs = [
  { label: "MCSL Future", icon: "fas fa-cube" },
  { label: "Gallery" },
  { label: "Navigation" },
];

const pages = [
  { label: "Overview", description: "Status", icon: "fas fa-gauge", link: "/components/navigation" },
  { label: "Instances", description: "Fleet", icon: "fas fa-server" },
  { label: "Settings", description: "Policy", icon: "fas fa-gear" },
];

const tabs = [
  { label: "Details", icon: "fas fa-circle-info" },
  { label: "Metrics", icon: "fas fa-chart-line" },
  { label: "History", icon: "fas fa-clock-rotate-left" },
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="navigation-stack">
          <Breadcrumbs :items="crumbs" />
          <NavTabs :tabs="tabs" />
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="nav-grid">
          <Panel size="small">
            <template #header><h4>Sidebar</h4></template>
            <Sidebar :pages="pages" />
          </Panel>
          <Panel size="small">
            <template #header><h4>Top Navigation</h4></template>
            <div class="navigation-stack">
              <Breadcrumbs :items="crumbs" />
              <NavTabs :tabs="tabs" shadow="hover" />
            </div>
          </Panel>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.navigation-stack {
  display: grid;
  gap: 14px;
  justify-items: start;
}

.nav-grid {
  display: grid;
  grid-template-columns: minmax(220px, 0.7fr) minmax(0, 1.3fr);
  gap: 14px;
}

@media (max-width: 920px) {
  .nav-grid {
    grid-template-columns: 1fr;
  }
}
</style>

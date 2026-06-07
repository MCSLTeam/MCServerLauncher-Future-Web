<script setup lang="ts">
import { Breadcrumbs, Panel, Sidebar } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const crumbs = [{ label: "MCSL Future" }, { label: "Gallery" }, { label: "Navigation" }];
const pages = [{ label: "Overview" }, { label: "Instances" }, { label: "Settings" }];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="nav-grid">
          <Panel size="small">
            <template #header><h4>Breadcrumbs</h4></template>
            <Breadcrumbs :items="crumbs" />
          </Panel>
          <Panel size="small">
            <template #header><h4>Sidebar</h4></template>
            <Sidebar :pages="pages" />
          </Panel>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <p class="doc-note">
          Navigation should feel structured and stable, with clearer active states and less gelatinous background treatment.
        </p>
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <p class="doc-note">pages, collapsed, color, size, breadcrumbs list, active-state patterns.</p>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.nav-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 980px) { .nav-grid { grid-template-columns: 1fr; } }
</style>

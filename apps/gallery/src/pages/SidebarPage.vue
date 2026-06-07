<script setup lang="ts">
import { Panel, Sidebar } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const pages = [{ label: "Overview" }, { label: "Instances" }, { label: "Settings" }];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <p class="doc-note">Sidebar items should feel calm, aligned, and compact with a stable active state.</p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Sidebar :pages="pages" />
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <p class="doc-note">pages, collapsed, color, size and active-state behavior.</p>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

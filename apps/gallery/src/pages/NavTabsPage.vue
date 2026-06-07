<script setup lang="ts">
import { NavTabs, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const tabs = [{ label: "Details" }, { label: "Metrics" }, { label: "History" }];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <p class="doc-note">Tab indicators should feel precise and light, not gummy or oversized.</p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <NavTabs :tabs="tabs" />
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <p class="doc-note">tabs, color, size, shadow and route-aware activation.</p>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

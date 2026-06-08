<script setup lang="ts">
import { Breadcrumbs, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const crumbs = [{ label: "MCSL Future" }, { label: "Gallery" }, { label: "Breadcrumbs" }];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <p class="doc-note">
          Breadcrumbs should recede into the chrome and never compete with the page title.
        </p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Breadcrumbs :items="crumbs" />
      </Panel>
    </template>
  </GalleryDocPage>
</template>

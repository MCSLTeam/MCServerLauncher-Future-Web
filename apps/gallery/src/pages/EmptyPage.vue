<script setup lang="ts">
import { Empty, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <p class="doc-note">Empty states should be sparse, structured, and calm.</p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Empty
          title="No running instances"
          description="Create a new instance or import an existing configuration to continue."
        />
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <p class="doc-note">title, description, icon and custom slot content.</p>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

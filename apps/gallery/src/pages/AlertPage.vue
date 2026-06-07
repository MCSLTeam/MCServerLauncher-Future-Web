<script setup lang="ts">
import { Alert, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <p class="doc-note">
          Alert surfaces should be stronger than InfoBar but still quiet enough for admin dashboards.
        </p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="doc-stack">
          <Alert title="Warning" color="warning">This action will restart the instance.</Alert>
          <Alert title="Error" color="danger">The selected file failed checksum validation.</Alert>
        </div>
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <p class="doc-note">
          title, color and slot-based body content, sharing the same message base with calmer motion.
        </p>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

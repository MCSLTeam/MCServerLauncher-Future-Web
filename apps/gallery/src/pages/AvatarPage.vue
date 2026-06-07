<script setup lang="ts">
import { Avatar, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <p class="doc-note">
          Avatars should feel neutral and compact, with image-first but safe fallback behavior.
        </p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="avatar-row">
          <Avatar text="MF" />
          <Avatar text="WS" :size="56" />
        </div>
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <p class="doc-note">src, text fallback, and size.</p>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.avatar-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>

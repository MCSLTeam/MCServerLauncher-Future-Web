<script setup lang="ts">
import { Panel, Tag } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <p class="doc-note">Tags should sit lightly on the surface, unlike badges which are more attached to another element.</p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="tag-row">
          <Tag color="primary">Primary</Tag>
          <Tag color="success">Healthy</Tag>
          <Tag color="warning">Warning</Tag>
        </div>
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <p class="doc-note">color and slot content.</p>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.tag-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>

<script setup lang="ts">
import { Badge, Button, Panel, Tag } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="tag-row">
          <Tag color="surface">Surface</Tag>
          <Tag color="primary">Primary</Tag>
          <Tag color="success">Healthy</Tag>
          <Tag color="warning">Warning</Tag>
          <Tag color="danger">Danger</Tag>
          <Tag color="help">Help</Tag>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="tag-row">
          <Badge value="8" color="danger">
            <Button icon="fas fa-bell">Notifications</Button>
          </Badge>
          <Tag color="success">Running</Tag>
          <Tag color="primary">Java 21</Tag>
          <Tag color="help">Paper</Tag>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.tag-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
</style>

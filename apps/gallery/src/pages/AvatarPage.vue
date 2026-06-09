<script setup lang="ts">
import { Avatar, Badge, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="avatar-row">
          <Avatar text="MF" :size="32" />
          <Avatar text="WS" />
          <Avatar text="OP" :size="56" />
          <Badge value="3" color="success">
            <Avatar text="AD" />
          </Badge>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="avatar-list">
          <div class="avatar-item"><Avatar text="MF" /><span>MCSL Future</span></div>
          <div class="avatar-item"><Avatar text="EU" /><span>Paper EU-1</span></div>
          <div class="avatar-item"><Avatar text="DV" /><span>Development</span></div>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.avatar-row,
.avatar-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.avatar-list {
  flex-direction: column;
  align-items: stretch;
}

.avatar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--mcsl-text-color-regular);
}
</style>

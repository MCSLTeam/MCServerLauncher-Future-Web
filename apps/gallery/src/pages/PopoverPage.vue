<script setup lang="ts">
import { Button, Message, Panel, Popover, Tag } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="overlay-row">
          <Popover title="Inspector">
            <template #triggerer="{ toggle }">
              <Button @click="toggle">Bottom</Button>
            </template>
            <Message color="help" variant="text">Compact contextual content.</Message>
          </Popover>
          <Popover title="Status" default-pos="right">
            <template #triggerer="{ toggle }">
              <Button @click="toggle">Right</Button>
            </template>
            <Tag color="success">Online</Tag>
          </Popover>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Popover title="Inspector">
          <template #triggerer="{ toggle }">
            <Button icon="fas fa-magnifying-glass-chart" @click="toggle">Open Popover</Button>
          </template>
          <div class="popover-body">
            <Tag color="success">Running</Tag>
            <span>12 players · 41 ms latency</span>
          </div>
        </Popover>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.overlay-row,
.popover-body {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.popover-body {
  color: var(--mcsl-text-color-regular);
}
</style>

<script setup lang="ts">
import { Button, Drawer, Message, Panel, Tag } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const rightVisible = ref(false);
const bottomVisible = ref(false);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="overlay-row">
          <Button type="primary" color="primary" @click="rightVisible = true">Right Drawer</Button>
          <Button @click="bottomVisible = true">Bottom Drawer</Button>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Button type="primary" color="primary" icon="fas fa-sidebar" @click="rightVisible = true">
          Open Drawer
        </Button>
        <Drawer v-model:visible="rightVisible" title="Instance Details">
          <div class="drawer-stack">
            <Message title="Paper EU-1" color="success" variant="outlined">
              Running on Java 21 with 12 active players.
            </Message>
            <div class="tag-row">
              <Tag color="primary">Paper</Tag>
              <Tag color="success">Online</Tag>
              <Tag color="help">4 GB</Tag>
            </div>
          </div>
          <template #footer="{ close }">
            <Button @click="close">Close</Button>
            <Button type="primary" color="primary">Open Console</Button>
          </template>
        </Drawer>
        <Drawer v-model:visible="bottomVisible" title="Task Queue" placement="bottom">
          <Message title="Backup queued" color="help">The next scheduled backup starts after upload.</Message>
        </Drawer>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.overlay-row,
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.drawer-stack {
  display: grid;
  gap: 14px;
}
</style>

<script setup lang="ts">
import { Button, ButtonGroup, DropdownMenu, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const menu = [
  { label: "Open settings", icon: "fas fa-gear" },
  { label: "Duplicate instance", icon: "fas fa-copy" },
  { label: "Archive", icon: "fas fa-box-archive", disabled: true },
];

const groupedMenu = [
  {
    group: "Instance",
    items: [
      { label: "Start", icon: "fas fa-play" },
      { label: "Restart", icon: "fas fa-rotate-right" },
    ],
  },
  {
    group: "Danger",
    items: [{ label: "Delete", icon: "fas fa-trash", color: "danger" }],
  },
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="overlay-row">
          <DropdownMenu :menu="menu">
            <template #triggerer="{ toggle }">
              <Button icon="fas fa-ellipsis" @click="toggle">Default</Button>
            </template>
          </DropdownMenu>
          <DropdownMenu :menu="groupedMenu" default-pos="top">
            <template #triggerer="{ toggle }">
              <Button icon="fas fa-arrow-up" @click="toggle">Top</Button>
            </template>
          </DropdownMenu>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <ButtonGroup>
          <Button type="primary" color="primary">Start</Button>
          <DropdownMenu :menu="groupedMenu">
            <template #triggerer="{ toggle }">
              <Button icon="fas fa-angle-down" squared @click="toggle" />
            </template>
          </DropdownMenu>
        </ButtonGroup>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.overlay-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
</style>

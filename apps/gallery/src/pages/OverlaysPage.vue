<script setup lang="ts">
import { Button, DropdownMenu, Panel, Popover, Tooltip } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const menu = [
  { label: "Open settings", icon: "fas fa-gear" },
  { label: "Duplicate instance", icon: "fas fa-copy" },
  { label: "Archive", icon: "fas fa-box-archive", disabled: true },
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="overlay-demo">
          <DropdownMenu :menu="menu">
            <template #triggerer="{ toggle }">
              <Button @click="toggle">Dropdown</Button>
            </template>
          </DropdownMenu>
          <Tooltip content="Fast inline hint.">
            <template #triggerer="{ open, close }">
              <Button @mouseenter="open" @mouseleave="close">Tooltip</Button>
            </template>
          </Tooltip>
          <Popover title="Inspector">
            <template #triggerer="{ toggle }">
              <Button @click="toggle">Popover</Button>
            </template>
            <p class="overlay-note">Compact contextual surface.</p>
          </Popover>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="overlay-demo">
          <DropdownMenu :menu="menu">
            <template #triggerer="{ toggle }">
              <Button icon="fas fa-ellipsis" @click="toggle">Open Menu</Button>
            </template>
          </DropdownMenu>
          <Popover title="Instance">
            <template #triggerer="{ toggle }">
              <Button icon="fas fa-circle-info" @click="toggle">Inspect</Button>
            </template>
            <p class="overlay-note">Paper EU-1 · Online · 12 players</p>
          </Popover>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.overlay-demo {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.overlay-note {
  margin: 0;
  color: var(--mcsl-text-color-regular);
  line-height: 1.6;
}
</style>

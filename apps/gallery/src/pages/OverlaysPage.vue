<script setup lang="ts">
import { Button, DropdownMenu, Panel, Popover, Tooltip } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Overlay surfaces should feel light and precise, not bulky. Corners, borders, and shadows should stay consistent with panels and buttons.</p></Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
            <template #header><h2>Live Demo</h2></template>
            <div class="overlay-demo">
              <DropdownMenu :menu="[{ label: 'Open settings' }, { label: 'Duplicate instance' }, { label: 'Archive', disabled: true }]">
                <template #triggerer="{ toggle }"><Button @click="toggle">Open Menu</Button></template>
              </DropdownMenu>
              <Tooltip content="This is a lightweight tooltip.">
                <template #triggerer="{ toggle }"><Button @mouseenter="toggle" @mouseleave="toggle">Hover me</Button></template>
              </Tooltip>
              <Popover title="Inspector">
                <template #triggerer="{ toggle }"><Button @click="toggle">Open Popover</Button></template>
                <p class="doc-note">Popover content should remain compact and readable.</p>
              </Popover>
            </div>
          </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.overlay-demo { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
</style>

<script setup lang="ts">
import { Button, Panel, Tooltip } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="overlay-row">
          <Tooltip content="Start the selected instance.">
            <template #triggerer="{ open, close }">
              <Button @mouseenter="open" @mouseleave="close">Top</Button>
            </template>
          </Tooltip>
          <Tooltip content="Opens in a side panel." default-pos="right">
            <template #triggerer="{ open, close }">
              <Button @mouseenter="open" @mouseleave="close">Right</Button>
            </template>
          </Tooltip>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Tooltip content="Helpful detail for this action.">
          <template #triggerer="{ open, close }">
            <Button icon="fas fa-circle-info" @mouseenter="open" @mouseleave="close">
              Hover me
            </Button>
          </template>
        </Tooltip>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.overlay-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>

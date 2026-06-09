<script setup lang="ts">
import { Kbd, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="kbd-row">
          <Kbd size="small">Esc</Kbd>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
          <Kbd>Enter</Kbd>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="shortcut-list">
          <span><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
          <span>Command palette</span>
          <span><Kbd>Esc</Kbd></span>
          <span>Close overlay</span>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.kbd-row,
.shortcut-list span:first-child,
.shortcut-list span:nth-child(3) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.shortcut-list {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px 16px;
  align-items: center;
  color: var(--mcsl-text-color-regular);
}
</style>

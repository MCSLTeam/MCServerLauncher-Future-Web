<script setup lang="ts">
import { Kbd, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <p class="doc-note">
          Kbd marks shortcuts and command hints without pulling attention away from labels.
        </p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="kbd-row">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
          <Kbd size="small">Esc</Kbd>
        </div>
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <p class="doc-note">size and default slot content.</p>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.kbd-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
</style>

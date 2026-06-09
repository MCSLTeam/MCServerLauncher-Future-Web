<script setup lang="ts">
import { Divider, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="divider-stack">
          <Divider spacing="xs" />
          <Divider spacing="sm" variant="dashed">Runtime</Divider>
          <Divider spacing="sm" variant="dotted" text-pos="start">Advanced</Divider>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="divider-demo">
          <p>Instance settings</p>
          <Divider spacing="md">Network</Divider>
          <p>Port, address, and proxy configuration</p>
          <Divider spacing="md" text-pos="end">Danger Zone</Divider>
          <p>Destructive operations stay visually separated.</p>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.divider-stack,
.divider-demo {
  display: grid;
  gap: 6px;
}

p {
  margin: 0;
  color: var(--mcsl-text-color-regular);
}
</style>

<script setup lang="ts">
import { CopyableText, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="copy-stack">
          <CopyableText size="small">mcsl-future-web</CopyableText>
          <CopyableText>paper-1.21.1-43.jar</CopyableText>
          <CopyableText size="large">ws://127.0.0.1:25567/daemon</CopyableText>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <CopyableText>MCServerLauncher-Future-Web</CopyableText>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.copy-stack {
  display: grid;
  gap: 10px;
  justify-items: start;
}
</style>

<script setup lang="ts">
import { InfoBar, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <p class="doc-note">WinUI-style inline information bars with calmer color surfaces.</p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="doc-stack">
          <InfoBar title="Update available" color="help">A newer runtime pack is available.</InfoBar>
          <InfoBar title="Attention" color="warning">One dependency needs manual review.</InfoBar>
        </div>
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <p class="doc-note">title, color, closable, and inherited message-style content slots.</p>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

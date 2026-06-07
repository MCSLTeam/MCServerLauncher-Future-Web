<script setup lang="ts">
import { Message, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Message surfaces should read clearly with restrained blur and tighter close-button alignment.</p></Panel>
    </template>
    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="doc-stack"><Message title="Saved" color="success" shadow>Configuration has been updated successfully.</Message><Message title="Warning" color="warning" shadow>One of the selected files will be skipped because it exceeds the accepted size.</Message></div></Panel>
    </template>
    <template #api>
      <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">color, variant, icon, closeable, title, shadow, in/out animations, and slot-based buttons.</p></Panel>
    </template>
  </GalleryDocPage>
</template>

<script setup lang="ts">
import { Message, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <p class="doc-note">
          Message follows Naive UI alert borderless behavior: soft status background, no visible border by default,
          clear icon/title/content hierarchy, and an optional bordered variant when the surface needs stronger separation.
        </p>
      </Panel>
    </template>
    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="doc-stack">
          <Message title="Saved" color="success" closeable>
            Configuration has been updated successfully.
          </Message>
          <Message title="Warning" color="warning">
            One of the selected files will be skipped because it exceeds the accepted size.
          </Message>
          <Message title="Error" color="danger" variant="outlined">
            The daemon rejected this request because the instance is currently locked.
          </Message>
          <Message color="help" variant="text" icon="fas fa-circle-info">
            Text variant keeps the same icon and spacing model for dense inline guidance.
          </Message>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

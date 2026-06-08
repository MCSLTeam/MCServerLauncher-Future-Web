<script setup lang="ts">
import { Panel, Result } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <p class="doc-note">Result states are larger and more semantic than alerts or info bars.</p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Result
          title="Deployment completed"
          description="The server image has been rebuilt and published."
          status="success"
        />
      </Panel>
    </template>
  </GalleryDocPage>
</template>

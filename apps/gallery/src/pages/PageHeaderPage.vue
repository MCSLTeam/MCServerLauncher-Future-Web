<script setup lang="ts">
import { PageHeader, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">PageHeader should establish hierarchy without feeling oversized or decorative.</p></Panel>
    </template>
    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><PageHeader title="Instances" subtitle="Manage your server fleet with clearer hierarchy and calmer chrome." /></Panel>
    </template>
    <template #api>
      <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">title, subtitle, actions slot.</p></Panel>
    </template>
  </GalleryDocPage>
</template>

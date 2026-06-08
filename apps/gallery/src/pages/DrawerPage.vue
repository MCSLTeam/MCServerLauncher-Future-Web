<script setup lang="ts">
import { Button, Drawer, Message, Panel } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const visible = ref(false);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <p class="doc-note">
          Drawer is the side-panel counterpart to Modal for details, settings, and secondary workflows.
        </p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Button type="primary" color="primary" @click="visible = true">Open Drawer</Button>
        <Drawer v-model:visible="visible" title="Instance Details">
          <div class="doc-stack">
            <Message title="Paper EU-1" color="success" variant="outlined">
              Running on Java 21 with 12 active players.
            </Message>
            <p class="doc-note">
              Use drawers for contextual editing when a full modal would interrupt the main page too much.
            </p>
          </div>
        </Drawer>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

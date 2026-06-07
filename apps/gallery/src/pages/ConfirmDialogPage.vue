<script setup lang="ts">
import { Button, ConfirmDialog, Panel } from "@repo/ui";
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
          ConfirmDialog keeps destructive confirmations consistent without duplicating modal layouts.
        </p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Button color="danger" type="primary" @click="visible = true">Delete Instance</Button>
        <ConfirmDialog
          v-model:visible="visible"
          title="Delete instance?"
          description="This removes the instance record from the launcher. Server files are not deleted automatically."
          confirm-text="Delete"
          cancel-text="Keep"
        />
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <p class="doc-note">visible, title, description, confirmText, cancelText, color, confirm and cancel events.</p>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

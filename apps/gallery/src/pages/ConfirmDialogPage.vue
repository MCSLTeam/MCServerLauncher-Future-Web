<script setup lang="ts">
import { Button, ConfirmDialog, Panel } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const deleteVisible = ref(false);
const restartVisible = ref(false);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="overlay-row">
          <Button color="warning" @click="restartVisible = true">Restart</Button>
          <Button color="danger" type="primary" @click="deleteVisible = true">Delete</Button>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Button color="danger" type="primary" icon="fas fa-trash" @click="deleteVisible = true">
          Delete Instance
        </Button>
        <ConfirmDialog
          v-model:visible="deleteVisible"
          title="Delete instance?"
          description="This removes the instance record from the launcher. Server files are not deleted automatically."
          confirm-text="Delete"
          cancel-text="Keep"
        />
        <ConfirmDialog
          v-model:visible="restartVisible"
          title="Restart instance?"
          description="Players will be disconnected while the process restarts."
          color="warning"
          confirm-text="Restart"
          cancel-text="Cancel"
        />
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.overlay-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>

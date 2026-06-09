<script setup lang="ts">
import { Button, Message, Modal, Panel } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const previewVisible = ref(false);
const formVisible = ref(false);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="overlay-row">
          <Button @click="previewVisible = true">Preview</Button>
          <Button type="primary" color="primary" @click="formVisible = true">Create</Button>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Button icon="fas fa-window-restore" @click="previewVisible = true">Open Modal</Button>
        <Modal v-model:visible="previewVisible" header="Modal Preview" max-width="520px">
          <Message title="Paper EU-1" color="help">
            Modal surfaces stay focused and short.
          </Message>
        </Modal>
        <Modal v-model:visible="formVisible" header="Create Instance" max-width="560px">
          <Message title="Template selected" color="success">
            Paper 1.21.1 with Java 21 runtime.
          </Message>
        </Modal>
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

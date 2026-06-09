<script setup lang="ts">
import { Button, Message, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="message-grid">
          <Message title="Instance ready" color="success" closeable>
            Paper EU-1 is online and accepting console commands.
          </Message>
          <Message title="Version drift" color="warning" closeable>
            Three plugins were built against an older server API.
          </Message>
          <Message title="Daemon rejected request" color="danger" closeable>
            The selected instance is locked by another operation.
          </Message>
          <Message title="Queue updated" color="help" closeable>
            Backup jobs will run after the current upload finishes.
          </Message>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="message-grid">
          <Message title="Borderless surface" color="primary">
            Status messages use a quiet tinted background and keep the icon aligned to the text rhythm.
          </Message>
          <Message title="Outlined surface" color="danger" variant="outlined">
            Use the outlined variant when the message sits on a dense or similarly tinted surface.
          </Message>
          <Message color="surface" icon="fas fa-terminal" variant="soft">
            Console output paused while the daemon reconnects.
            <template #buttons="{ close }">
              <Button size="small" type="text" @click="close">Dismiss</Button>
              <Button size="small" type="primary" color="primary">Reconnect</Button>
            </template>
          </Message>
          <Message color="help" icon="fas fa-circle-info" variant="text">
            Inline messages keep the same spacing model without drawing a container.
          </Message>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.message-grid {
  display: grid;
  gap: 12px;
}
</style>

<script setup lang="ts">
import { Button, Empty, Panel } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="empty-grid">
          <Empty title="No running instances" description="Start or import an instance to continue." />
          <Empty title="No backups" description="Create a backup schedule before production launch." icon="fas fa-clock-rotate-left" />
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Empty
          title="No running instances"
          description="Create a new instance or import an existing configuration."
        >
          <Button type="primary" color="primary" icon="fas fa-plus">Create Instance</Button>
        </Empty>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.empty-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 860px) {
  .empty-grid {
    grid-template-columns: 1fr;
  }
}
</style>

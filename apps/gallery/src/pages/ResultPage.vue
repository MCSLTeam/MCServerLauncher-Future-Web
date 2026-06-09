<script setup lang="ts">
import { Button, Panel, Result } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="result-grid">
          <Result title="Completed" description="Deployment image was published." status="success" />
          <Result title="Needs attention" description="Two plugins need review." status="warning" />
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Result
          title="Deployment completed"
          description="The server image has been rebuilt and published."
          status="success"
        >
          <div class="result-actions">
            <Button type="primary" color="primary">Open Instance</Button>
            <Button>View Logs</Button>
          </div>
        </Result>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}

@media (max-width: 860px) {
  .result-grid {
    grid-template-columns: 1fr;
  }
}
</style>

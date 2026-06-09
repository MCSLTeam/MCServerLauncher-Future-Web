<script setup lang="ts">
import { Empty, Message, MeterGroup, Panel, Result, Skeleton } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const healthyMeter = {
  length: 100,
  values: [
    { label: "CPU", length: 18, type: "success" },
    { label: "RAM", length: 42, type: "primary" },
  ],
};

const attentionMeter = {
  length: 100,
  values: [
    { label: "Latency", length: 64, type: "warning" },
    { label: "Disk", length: 51, type: "help" },
  ],
};
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="status-grid">
          <Panel size="small">
            <template #header><h4>Healthy</h4></template>
            <div class="feedback-card">
              <Message color="success" title="Stable">CPU 18% · Memory 1.2 GB</Message>
              <MeterGroup :meter="healthyMeter" />
            </div>
          </Panel>
          <Panel size="small">
            <template #header><h4>Attention</h4></template>
            <div class="feedback-card">
              <Message color="warning" title="Queue rising">Latency increased.</Message>
              <MeterGroup :meter="attentionMeter" />
            </div>
          </Panel>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="feedback-stack">
          <Result title="Backup completed" description="Snapshot and metadata have been stored." status="success" />
          <Empty title="No running instances" description="Use this state to explain the next meaningful action." />
          <Skeleton :lines="3" height="14px" />
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.feedback-card,
.feedback-stack {
  display: grid;
  gap: 14px;
}

@media (max-width: 980px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>

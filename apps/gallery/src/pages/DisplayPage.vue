<script setup lang="ts">
import {
  Avatar,
  CopyableText,
  Empty,
  Message,
  Panel,
  Result,
  Skeleton,
  Table,
  Tag,
} from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const columns = ["Name", "Status", "Version"];
const rows = [
  ["Paper EU-1", "Running", "1.21.1"],
  ["Fabric Dev", "Stopped", "1.20.4"],
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="display-grid">
          <Panel size="small">
            <template #header><h4>Identity</h4></template>
            <div class="inline-row">
              <Avatar text="MF" />
              <Tag color="primary">Primary Tag</Tag>
              <Tag color="success">Healthy</Tag>
            </div>
          </Panel>
          <Panel size="small">
            <template #header><h4>Text</h4></template>
            <CopyableText>mcsl-future-web</CopyableText>
          </Panel>
          <Panel size="small" class="display-grid__wide">
            <template #header><h4>Empty</h4></template>
            <Empty title="No resources yet" description="Display components should communicate state with calm hierarchy." />
          </Panel>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="display-stack">
          <Message title="Heads up" color="warning">
            This is a lightweight message surface for inline guidance.
          </Message>
          <Result title="Deployment completed" description="Use result states for larger success or failure summaries." status="success" />
          <Table :columns="columns" :rows="rows" />
          <Skeleton :lines="4" height="14px" />
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.display-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.display-grid__wide {
  grid-column: 1 / -1;
}

.display-stack {
  display: grid;
  gap: 16px;
}

.inline-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

@media (max-width: 860px) {
  .display-grid {
    grid-template-columns: 1fr;
  }
}
</style>

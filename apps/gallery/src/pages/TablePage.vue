<script setup lang="ts">
import { Panel, Table } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const columns = ["Name", "Status", "Version", "Players"];
const rows = [
  ["Paper EU-1", "Running", "1.21.1", 12],
  ["Fabric Dev", "Stopped", "1.20.4", 0],
  ["Velocity Edge", "Starting", "3.4.0", 48],
];

const denseRows = [
  ["CPU", "18%", "Normal"],
  ["Memory", "4.1 GB", "Normal"],
  ["Disk", "72%", "Warning"],
  ["Network", "41 ms", "Normal"],
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <Table :columns="columns" :rows="rows" />
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="table-stack">
          <Table :columns="columns" :rows="rows" />
          <Table :columns="['Metric', 'Value', 'State']" :rows="denseRows" />
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.table-stack {
  display: grid;
  gap: 16px;
}
</style>

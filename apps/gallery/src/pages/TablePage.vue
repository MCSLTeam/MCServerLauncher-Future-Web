<script setup lang="ts">
import { Panel, Table } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const columns = ["Name", "Status", "Version", "Players"];
const rows = [
  ["Paper EU-1", "Running", "1.21.1", 12],
  ["Fabric Dev", "Stopped", "1.20.4", 0],
  ["Velocity Edge", "Starting", "3.4.0", 48],
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <p class="doc-note">
          Tables should be readable and structured first, decorative second.
        </p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <Table :columns="columns" :rows="rows" />
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <p class="doc-note">
          The current table API accepts column labels and primitive cell rows while leaving room for richer cell rendering later.
        </p>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

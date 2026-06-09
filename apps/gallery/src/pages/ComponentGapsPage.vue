<script setup lang="ts">
import { Panel, Table, Tag } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const columns = ["Priority", "Naive / shadcn", "MCSL UI action"];
const rows = [
  ["High", "Calendar / DatePicker / TimePicker", "Backlog: scheduling and expiry flows"],
  ["High", "AutoComplete / Combobox", "Backlog: searchable typed selection"],
  ["High", "DataTable", "Backlog: sorting, filtering, selection, richer cells"],
  ["Medium", "Tree / TreeSelect", "Backlog: files, folders, permissions, resource trees"],
  ["Medium", "Accordion / Collapsible", "Existing local components need export/gallery polish"],
  ["Medium", "Steps / Stepper", "Backlog: instance creation and install flows"],
  ["Done", "Drawer / Sheet", "Drawer covers side detail panels"],
  ["Done", "AlertDialog / Popconfirm", "ConfirmDialog covers destructive confirmations"],
  ["Done", "Kbd", "Kbd covers shortcut and command palette docs"],
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Component Gap Scan</h2></template>
        <div class="gap-tags">
          <Tag color="danger">High</Tag>
          <Tag color="warning">Medium</Tag>
          <Tag color="success">Done</Tag>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Prioritized Gaps</h2></template>
        <Table :columns="columns" :rows="rows" />
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.gap-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>

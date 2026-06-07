<script setup lang="ts">
import { Panel, Table, Tag } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const columns = ["Priority", "Naive / shadcn", "MCSL UI action"];
const rows = [
  ["High", "Drawer / Sheet", "Added Drawer for side detail panels"],
  ["High", "AlertDialog / Popconfirm", "Added ConfirmDialog for destructive confirmations"],
  ["Medium", "Kbd", "Added Kbd for shortcut and command palette docs"],
  ["High", "Calendar / DatePicker / TimePicker", "Backlog: scheduling and expiry flows"],
  ["High", "AutoComplete / Combobox", "Backlog: searchable typed selection"],
  ["High", "DataTable", "Backlog: sorting, filtering, selection, richer cells"],
  ["Medium", "Tree / TreeSelect", "Backlog: files, folders, permissions, resource trees"],
  ["Medium", "Accordion / Collapsible", "Existing local components need export/gallery polish"],
  ["Medium", "Steps / Stepper", "Backlog: instance creation and install flows"],
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Component Gap Scan</h2></template>
        <p class="doc-note">
          Compared local mcslui exports against sibling naive-ui and shadcn-vue component registries.
        </p>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Prioritized Gaps</h2></template>
        <Table :columns="columns" :rows="rows" />
      </Panel>
    </template>

    <template #api>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Merge / Alias Decisions</h2></template>
        <div class="gap-tags">
          <Tag color="primary">alert + infobar -> message</Tag>
          <Tag color="help">tabs -> NavTabs alias candidate</Tag>
          <Tag color="success">separator -> Divider</Tag>
          <Tag color="warning">number-field -> InputNumber</Tag>
        </div>
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

<script setup lang="ts">
import { computed, useSlots } from "vue";
import Empty from "./Empty.vue";
import Spinner from "../progress/Spinner.vue";

export type DataTableColumn = {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
};

type Row = Record<string, unknown>;

const props = withDefaults(
  defineProps<{
    columns: DataTableColumn[];
    rows: Row[];
    rowKey?: string | ((row: Row, index: number) => string | number);
    selectable?: boolean;
    loading?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
  }>(),
  {
    columns: () => [],
    rows: () => [],
    rowKey: "id",
    selectable: false,
    loading: false,
    emptyTitle: "No rows",
    emptyDescription: "There is no table data to display.",
  },
);

const slots = useSlots();
const selectedKeys = defineModel<string[]>("selectedKeys", {
  default: () => [],
});
const sortBy = defineModel<string>("sortBy", {
  default: "",
});
const sortOrder = defineModel<"asc" | "desc" | null>("sortOrder", {
  default: null,
});

const gridStyle = computed(() => ({
  "--mcsl-data-table-columns": [
    props.selectable ? "42px" : "",
    ...props.columns.map((column) => column.width ?? "minmax(140px, 1fr)"),
    slots.actions ? "minmax(96px, auto)" : "",
  ]
    .filter(Boolean)
    .join(" "),
}));

const visibleRows = computed(() => {
  const rows = [...props.rows];
  if (!sortBy.value || !sortOrder.value) return rows;

  return rows.sort((a, b) => {
    const left = a[sortBy.value];
    const right = b[sortBy.value];
    const result = String(left ?? "").localeCompare(
      String(right ?? ""),
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      },
    );
    return sortOrder.value === "asc" ? result : -result;
  });
});

const visibleKeys = computed(() =>
  visibleRows.value.map((row, index) => getRowKey(row, index)),
);
const allSelected = computed(
  () =>
    visibleKeys.value.length > 0 &&
    visibleKeys.value.every((key) => selectedKeys.value.includes(key)),
);

function getRowKey(row: Row, index: number) {
  if (typeof props.rowKey === "function")
    return String(props.rowKey(row, index));
  return String(row[props.rowKey] ?? index);
}

function isSelected(row: Row, index: number) {
  return selectedKeys.value.includes(getRowKey(row, index));
}

function toggleRow(row: Row, index: number) {
  const key = getRowKey(row, index);
  selectedKeys.value = selectedKeys.value.includes(key)
    ? selectedKeys.value.filter((item) => item !== key)
    : [...selectedKeys.value, key];
}

function toggleAll() {
  if (allSelected.value) {
    selectedKeys.value = selectedKeys.value.filter(
      (key) => !visibleKeys.value.includes(key),
    );
    return;
  }

  selectedKeys.value = Array.from(
    new Set([...selectedKeys.value, ...visibleKeys.value]),
  );
}

function toggleSort(column: DataTableColumn) {
  if (!column.sortable) return;
  if (sortBy.value !== column.key) {
    sortBy.value = column.key;
    sortOrder.value = "asc";
    return;
  }
  if (sortOrder.value === "asc") {
    sortOrder.value = "desc";
    return;
  }
  sortBy.value = "";
  sortOrder.value = null;
}

function sortIcon(column: DataTableColumn) {
  if (sortBy.value !== column.key) return "fas fa-sort";
  return sortOrder.value === "asc" ? "fas fa-sort-up" : "fas fa-sort-down";
}
</script>

<template>
  <div class="mcsl-data-table" :style="gridStyle" role="table">
    <div class="mcsl-data-table__row mcsl-data-table__row--head" role="row">
      <div
        v-if="selectable"
        class="mcsl-data-table__cell mcsl-data-table__cell--select"
        role="columnheader"
      >
        <button
          type="button"
          class="mcsl-data-table__check"
          :class="{ 'mcsl-data-table__check--checked': allSelected }"
          :aria-pressed="allSelected"
          @click="toggleAll"
        >
          <i class="fas fa-check" />
        </button>
      </div>
      <div
        v-for="column in columns"
        :key="column.key"
        class="mcsl-data-table__cell mcsl-data-table__cell--head"
        :class="`mcsl-data-table__cell--${column.align ?? 'left'}`"
        role="columnheader"
      >
        <button
          v-if="column.sortable"
          type="button"
          class="mcsl-data-table__sort"
          @click="toggleSort(column)"
        >
          <span>{{ column.title }}</span>
          <i :class="sortIcon(column)" />
        </button>
        <span v-else>{{ column.title }}</span>
      </div>
      <div
        v-if="$slots.actions"
        class="mcsl-data-table__cell mcsl-data-table__cell--head"
        role="columnheader"
      >
        Actions
      </div>
    </div>

    <div v-if="loading" class="mcsl-data-table__state">
      <Spinner label="Loading" />
    </div>
    <div v-else-if="visibleRows.length === 0" class="mcsl-data-table__state">
      <slot name="empty">
        <Empty :title="emptyTitle" :description="emptyDescription" />
      </slot>
    </div>
    <div v-else class="mcsl-data-table__body">
      <div
        v-for="(row, rowIndex) in visibleRows"
        :key="getRowKey(row, rowIndex)"
        class="mcsl-data-table__row"
        :class="{ 'mcsl-data-table__row--selected': isSelected(row, rowIndex) }"
        role="row"
      >
        <div
          v-if="selectable"
          class="mcsl-data-table__cell mcsl-data-table__cell--select"
          role="cell"
        >
          <button
            type="button"
            class="mcsl-data-table__check"
            :class="{
              'mcsl-data-table__check--checked': isSelected(row, rowIndex),
            }"
            :aria-pressed="isSelected(row, rowIndex)"
            @click="toggleRow(row, rowIndex)"
          >
            <i class="fas fa-check" />
          </button>
        </div>
        <div
          v-for="column in columns"
          :key="column.key"
          class="mcsl-data-table__cell"
          :class="`mcsl-data-table__cell--${column.align ?? 'left'}`"
          role="cell"
        >
          <slot
            :name="`cell-${column.key}`"
            :row="row"
            :value="row[column.key]"
            :column="column"
            :index="rowIndex"
          >
            {{ row[column.key] }}
          </slot>
        </div>
        <div
          v-if="$slots.actions"
          class="mcsl-data-table__cell mcsl-data-table__cell--actions"
          role="cell"
        >
          <slot name="actions" :row="row" :index="rowIndex" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mcsl-data-table {
  min-width: 0;
  overflow: hidden;
  border: 1px solid
    color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  border-radius: var(--mcsl-border-radius-sm);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 98%, transparent);
}

.mcsl-data-table__row {
  display: grid;
  grid-template-columns: var(--mcsl-data-table-columns);
  min-width: 0;
}

.mcsl-data-table__row:not(:last-child) {
  border-bottom: 1px solid
    color-mix(in srgb, var(--mcsl-border-color-base) 84%, transparent);
}

.mcsl-data-table__row--head {
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 94%, transparent);
}

.mcsl-data-table__body .mcsl-data-table__row {
  transition:
    background-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    box-shadow var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
}

.mcsl-data-table__body .mcsl-data-table__row:hover {
  background: color-mix(
    in srgb,
    var(--mcsl-color-primary) 5%,
    var(--mcsl-bg-color-overlay)
  );
}

.mcsl-data-table__row--selected {
  background: color-mix(
    in srgb,
    var(--mcsl-color-primary) 8%,
    var(--mcsl-bg-color-overlay)
  );
  box-shadow: inset 3px 0 0 var(--mcsl-color-primary);
}

.mcsl-data-table__cell {
  min-width: 0;
  padding: 11px 13px;
  color: var(--mcsl-text-color-regular);
  font-size: var(--mcsl-font-size-sm);
  font-variant-numeric: tabular-nums;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.mcsl-data-table__cell:not(:last-child) {
  border-right: 1px solid
    color-mix(in srgb, var(--mcsl-border-color-base) 62%, transparent);
}

.mcsl-data-table__cell--head {
  color: var(--mcsl-text-color-secondary);
  font-weight: 650;
}

.mcsl-data-table__cell--center {
  text-align: center;
}

.mcsl-data-table__cell--right {
  text-align: right;
}

.mcsl-data-table__cell--select {
  display: grid;
  place-items: center;
  padding: 0;
}

.mcsl-data-table__cell--actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--mcsl-spacing-4xs);
}

.mcsl-data-table__sort {
  display: inline-flex;
  align-items: center;
  justify-content: inherit;
  max-width: 100%;
  gap: var(--mcsl-spacing-4xs);
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.mcsl-data-table__sort i {
  color: var(--mcsl-text-color-secondary);
  font-size: 0.85em;
}

.mcsl-data-table__check {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1px solid var(--mcsl-border-color-base);
  border-radius: var(--mcsl-border-radius-sm);
  background: var(--mcsl-bg-color-overlay);
  color: transparent;
  cursor: pointer;
  transition:
    background-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    border-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
}

.mcsl-data-table__check--checked {
  border-color: var(--mcsl-color-primary);
  background: var(--mcsl-color-primary);
  color: var(--mcsl-text-color-light);
}

.mcsl-data-table__check i {
  font-size: 10px;
}

.mcsl-data-table__state {
  padding: 28px;
}

@media (max-width: 820px) {
  .mcsl-data-table {
    overflow-x: auto;
  }

  .mcsl-data-table__row {
    min-width: max-content;
  }
}
</style>

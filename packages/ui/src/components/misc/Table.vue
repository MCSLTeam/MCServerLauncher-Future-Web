<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    columns: string[];
    rows: (string | number)[][];
  }>(),
  {
    columns: () => [],
    rows: () => [],
  },
);

const gridStyle = computed(() => ({
  "--mcsl-table-columns": props.columns.length || 1,
}));
</script>

<template>
  <div class="mcsl-table" role="table" :style="gridStyle">
    <div class="mcsl-table__row mcsl-table__row--head" role="row">
      <div v-for="(column, index) in columns" :key="index" class="mcsl-table__cell" role="columnheader">
        {{ column }}
      </div>
    </div>
    <div v-for="(row, rowIndex) in rows" :key="rowIndex" class="mcsl-table__row" role="row">
      <div v-for="(cell, cellIndex) in row" :key="cellIndex" class="mcsl-table__cell" role="cell">
        {{ cell }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mcsl-table {
  display: grid;
  min-width: 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  border-radius: var(--mcsl-border-radius-sm);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 98%, transparent);
}

.mcsl-table__row {
  display: grid;
  grid-template-columns: repeat(var(--mcsl-table-columns), minmax(140px, 1fr));
  min-width: 0;
}

.mcsl-table__row:not(:last-child) {
  border-bottom: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 84%, transparent);
}

.mcsl-table__row--head {
  color: var(--mcsl-text-color-secondary);
  font-size: var(--mcsl-font-size-sm);
  font-weight: 600;
  letter-spacing: 0;
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 94%, transparent);
}

.mcsl-table__cell {
  min-width: 0;
  padding: 11px 13px;
  color: var(--mcsl-text-color-regular);
  font-size: var(--mcsl-font-size-sm);
  font-variant-numeric: tabular-nums;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.mcsl-table__row--head .mcsl-table__cell {
  color: var(--mcsl-text-color-secondary);
}

.mcsl-table__cell:not(:last-child) {
  border-right: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 62%, transparent);
}

.mcsl-table__row:not(.mcsl-table__row--head) {
  transition: background-color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
}

.mcsl-table__row:not(.mcsl-table__row--head):hover {
  background: color-mix(in srgb, var(--mcsl-color-primary) 5%, var(--mcsl-bg-color-overlay));
}

@media (max-width: 820px) {
  .mcsl-table {
    overflow-x: auto;
  }

  .mcsl-table__row {
    min-width: max-content;
  }
}
</style>

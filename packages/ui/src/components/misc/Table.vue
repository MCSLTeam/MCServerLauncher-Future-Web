<script setup lang="ts">
withDefaults(
  defineProps<{
    columns: string[];
    rows: (string | number)[][];
  }>(),
  {
    columns: () => [],
    rows: () => [],
  },
);
</script>

<template>
  <div class="mcsl-table-wrap">
    <table class="mcsl-table">
      <thead>
        <tr>
          <th v-for="(column, index) in columns" :key="index">{{ column }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
          <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.mcsl-table-wrap {
  overflow: auto;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  border-radius: var(--mcsl-border-radius-sm);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 98%, transparent);
}

.mcsl-table {
  width: 100%;
  min-width: max-content;
  border-collapse: separate;
  border-spacing: 0;
}

th,
td {
  padding: 11px 13px;
  text-align: left;
  vertical-align: middle;
  border: 0;
  white-space: nowrap;
}

th:not(:last-child),
td:not(:last-child) {
  border-right: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 62%, transparent);
}

thead th {
  color: var(--mcsl-text-color-secondary);
  font-weight: 600;
  font-size: var(--mcsl-font-size-sm);
  letter-spacing: 0;
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 94%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 84%, transparent);
}

thead th:first-child {
  border-top-left-radius: calc(var(--mcsl-border-radius-sm) - 1px);
}

thead th:last-child {
  border-top-right-radius: calc(var(--mcsl-border-radius-sm) - 1px);
}

tbody td {
  color: var(--mcsl-text-color-regular);
  font-size: var(--mcsl-font-size-sm);
  font-variant-numeric: tabular-nums;
}

tbody tr {
  transition:
    background-color 0.12s ease-out,
    color 0.12s ease-out;
}

tbody tr:hover {
  background: color-mix(in srgb, var(--mcsl-color-primary) 5%, var(--mcsl-bg-color-overlay));
}

tbody tr:not(:last-child) td {
  border-bottom: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 84%, transparent);
}

tbody tr:last-child td:first-child {
  border-bottom-left-radius: calc(var(--mcsl-border-radius-sm) - 1px);
}

tbody tr:last-child td:last-child {
  border-bottom-right-radius: calc(var(--mcsl-border-radius-sm) - 1px);
}
</style>

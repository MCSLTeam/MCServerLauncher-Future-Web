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
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 97%, transparent);
}
.mcsl-table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 11px 14px;
  text-align: left;
}
thead th {
  color: var(--mcsl-text-color-secondary);
  font-weight: 600;
  font-size: var(--mcsl-font-size-sm);
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 94%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
}
tbody td {
  color: var(--mcsl-text-color-regular);
}
tbody tr {
  transition: background-color 0.12s ease-out;
}
tbody tr:hover {
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 94%, transparent);
}
tbody tr:not(:last-child) td {
  border-bottom: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 84%, transparent);
}
</style>

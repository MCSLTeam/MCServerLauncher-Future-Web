<script setup lang="ts">
import type { GalleryApiItem } from "./galleryApiTypes";

defineProps<{
  items: GalleryApiItem[];
}>();
</script>

<template>
  <div class="gallery-api-table" role="table" aria-label="Props">
    <div class="gallery-api-row gallery-api-row--head" role="row">
      <div class="gallery-api-cell" role="columnheader">Prop</div>
      <div class="gallery-api-cell" role="columnheader">Type</div>
      <div class="gallery-api-cell" role="columnheader">Default</div>
      <div class="gallery-api-cell" role="columnheader">Description</div>
    </div>
    <div v-for="item in items" :key="item.name" class="gallery-api-row" role="row">
      <div class="gallery-api-cell gallery-api-cell--name" role="cell">
        <code>{{ item.name }}</code>
      </div>
      <div class="gallery-api-cell" role="cell">
        <code>{{ item.type }}</code>
      </div>
      <div class="gallery-api-cell" role="cell">
        <code>{{ item.default ?? "-" }}</code>
      </div>
      <div class="gallery-api-cell" role="cell">{{ item.description }}</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.gallery-api-table {
  display: grid;
  min-width: 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  border-radius: var(--mcsl-border-radius-sm);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 98%, transparent);
}

.gallery-api-row {
  display: grid;
  grid-template-columns: minmax(140px, 0.8fr) minmax(180px, 1fr) minmax(110px, 0.7fr) minmax(240px, 1.8fr);
  min-width: 0;
}

.gallery-api-row:not(:last-child) {
  border-bottom: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 84%, transparent);
}

.gallery-api-row--head {
  color: var(--mcsl-text-color-secondary);
  font-size: var(--mcsl-font-size-sm);
  font-weight: 600;
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 94%, transparent);
}

.gallery-api-cell {
  min-width: 0;
  padding: 11px 13px;
  color: var(--mcsl-text-color-regular);
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.gallery-api-cell:not(:last-child) {
  border-right: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 62%, transparent);
}

.gallery-api-cell--name code {
  color: var(--mcsl-text-color-primary);
  font-weight: 600;
}

code {
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.92em;
}

@media (max-width: 820px) {
  .gallery-api-row,
  .gallery-api-row--head {
    grid-template-columns: 1fr;
  }

  .gallery-api-row--head {
    display: none;
  }

  .gallery-api-cell {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 10px;
    padding: 9px 12px;
  }

  .gallery-api-cell::before {
    color: var(--mcsl-text-color-secondary);
    font-size: var(--mcsl-font-size-sm);
    font-weight: 600;
  }

  .gallery-api-cell:nth-child(1)::before {
    content: "Prop";
  }

  .gallery-api-cell:nth-child(2)::before {
    content: "Type";
  }

  .gallery-api-cell:nth-child(3)::before {
    content: "Default";
  }

  .gallery-api-cell:nth-child(4)::before {
    content: "Description";
  }

  .gallery-api-cell:not(:last-child) {
    border-right: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 62%, transparent);
  }
}
</style>

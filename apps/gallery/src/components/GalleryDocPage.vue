<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Panel } from "@repo/ui";
import GalleryApiTable from "./GalleryApiTable.vue";
import { defaultGalleryApiDocs, galleryApiDocs } from "./galleryApiDocs";

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    apiTitle?: string;
    apiDescription?: string;
  }>(),
  {
    title: "",
    description: "",
    apiTitle: "API / Props",
    apiDescription: "",
  },
);

const route = useRoute();
const apiItems = computed(() => galleryApiDocs[route.path] ?? defaultGalleryApiDocs);
</script>

<template>
  <div class="page-shell">
    <slot name="effects">
      <div class="doc-section__fallback">No effects preview.</div>
    </slot>

    <slot name="demo">
      <div class="doc-section__fallback">No live demo.</div>
    </slot>

    <slot name="api">
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>API / Props</h2></template>
        <GalleryApiTable :items="apiItems" />
      </Panel>
    </slot>
  </div>
</template>

<style scoped lang="scss">
.page-shell {
  display: grid;
  gap: 18px;
}

.doc-section__fallback {
  color: var(--mcsl-text-color-secondary);
}

:deep(.doc-section) {
  overflow: hidden;
}

:deep(.doc-section .mcsl-panel__header h2),
:deep(.doc-section .mcsl-panel__header h3),
:deep(.doc-section .mcsl-panel__header h4) {
  margin: 0;
  font-weight: 600;
}

:deep(.doc-note) {
  color: var(--mcsl-text-color-regular);
  line-height: 1.7;
}

:deep(.doc-stack) {
  display: grid;
  gap: 14px;
}

:deep(.doc-api-table) {
  display: grid;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  border-radius: var(--mcsl-border-radius-sm);
  overflow: hidden;
}

:deep(.doc-api-row) {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
}

:deep(.doc-api-row:not(:last-child)) {
  border-bottom: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
}

:deep(.doc-api-cell) {
  padding: 12px 14px;
}

:deep(.doc-api-cell--head) {
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 96%, transparent);
  color: var(--mcsl-text-color-secondary);
}

:deep(.api-table),
:deep(.api-row),
:deep(.api-cell) {
  display: contents;
}
</style>

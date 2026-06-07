<script setup lang="ts">
import { ItemsPagination, Pagination, Panel } from "@repo/ui";
import { ref } from "vue";

const page = ref(2);
const paged = ref(3);
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Pagination controls should feel compact, numerically clear, and visually secondary to the content itself.</p></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="doc-stack"><Pagination v-model:page="page" :length="12" /><ItemsPagination v-model:page="paged" :item-per-page="20" :total="240" /></div></Panel>
    <Panel class="doc-section" shadow="hover"><template #header><h2>API / Props</h2></template><p class="doc-note">page, length, itemPerPage, total, size, and button density.</p></Panel>
    </GalleryDocPage>
</template>

<style scoped lang="scss">
.page-shell { display: grid; gap: 18px; }
.stack { display: grid; gap: 16px; }
.note { color: var(--mcsl-text-color-regular); line-height: 1.7; }
.doc-section :deep(.mcsl-panel__header h2) { margin: 0; font-weight: 600; }
</style>

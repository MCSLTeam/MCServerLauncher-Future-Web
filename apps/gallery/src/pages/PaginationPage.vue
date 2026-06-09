<script setup lang="ts">
import { ItemsPagination, Pagination, Panel } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const shortPage = ref(2);
const longPage = ref(8);
const itemPage = ref(3);
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="pagination-stack">
          <Pagination v-model:page="shortPage" :length="5" size="small" />
          <Pagination v-model:page="longPage" :length="16" />
          <Pagination v-model:page="longPage" :length="128" size="large" />
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="pagination-stack">
          <Pagination v-model:page="longPage" :length="16" />
          <ItemsPagination v-model:page="itemPage" :item-per-page="20" :total="240" />
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.pagination-stack {
  display: grid;
  gap: 16px;
  justify-items: start;
}
</style>

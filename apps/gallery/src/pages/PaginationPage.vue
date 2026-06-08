<script setup lang="ts">
import { ItemsPagination, Pagination, Panel } from "@repo/ui";
import { ref } from "vue";

const page = ref(2);
const paged = ref(3);
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Style Effects</h2></template><p class="doc-note">Pagination controls should feel compact, numerically clear, and visually secondary to the content itself.</p></Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover"><template #header><h2>Live Demo</h2></template><div class="doc-stack"><Pagination v-model:page="page" :length="12" /><ItemsPagination v-model:page="paged" :item-per-page="20" :total="240" /></div></Panel>
    </template>
  </GalleryDocPage>
</template>

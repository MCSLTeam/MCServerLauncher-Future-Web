<script setup lang="ts">
import { Avatar, Panel, Skeleton } from "@repo/ui";
import GalleryDocPage from "../components/GalleryDocPage.vue";
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="skeleton-stack">
          <Skeleton :lines="3" height="14px" />
          <Skeleton width="64%" height="16px" />
          <Skeleton width="36%" height="28px" :rounded="false" />
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div class="skeleton-card">
          <Avatar text="LD" />
          <div>
            <Skeleton width="44%" height="15px" />
            <Skeleton :lines="3" height="12px" />
          </div>
        </div>
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.skeleton-stack {
  display: grid;
  gap: 12px;
}

.skeleton-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}
</style>

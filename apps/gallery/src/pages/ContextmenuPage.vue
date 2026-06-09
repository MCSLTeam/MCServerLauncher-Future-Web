<script setup lang="ts">
import { Contextmenu, Panel, Tag } from "@repo/ui";
import { ref } from "vue";
import GalleryDocPage from "../components/GalleryDocPage.vue";

const target = ref<HTMLElement | null>(null);
const menu = [
  { label: "Rename", icon: "fas fa-pen" },
  { label: "Duplicate", icon: "fas fa-copy" },
  { label: "Delete", icon: "fas fa-trash", disabled: true },
];
</script>

<template>
  <GalleryDocPage>
    <template #effects>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Style Effects</h2></template>
        <div class="context-target context-target--small">
          <Tag color="help">Right click</Tag>
          <span>Scoped menu target</span>
        </div>
      </Panel>
    </template>

    <template #demo>
      <Panel class="doc-section" shadow="hover">
        <template #header><h2>Live Demo</h2></template>
        <div ref="target" class="context-target">
          <Tag color="primary">Instance</Tag>
          <span>Right click this area</span>
        </div>
        <Contextmenu :parent="target as any" :menu="menu" />
      </Panel>
    </template>
  </GalleryDocPage>
</template>

<style scoped lang="scss">
.context-target {
  min-height: 140px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px dashed color-mix(in srgb, var(--mcsl-border-color-base) 86%, transparent);
  border-radius: var(--mcsl-border-radius-sm);
  color: var(--mcsl-text-color-secondary);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 94%, transparent);
}

.context-target--small {
  min-height: 92px;
}
</style>

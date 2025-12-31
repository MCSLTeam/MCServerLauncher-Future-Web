<script lang="ts" setup>
import CollapsablePanel from "../CollapsablePanel.vue";
import type { Size } from "../../../utils/types.ts";
import { inject } from "vue";

withDefaults(
  defineProps<{
    name: string;
    disabled?: boolean;
    header?: string;
    headerDivider?: boolean;
    size?: Size;
    headerClass?: string;
    headerStyle?: string;
    bodyClass?: string;
    bodyStyle?: string;
    scrollable?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const { activate, deactivate, isActive } = inject("mcsl-accordion") as any;

defineEmits<{
  (e: "collapse"): void;
  (e: "expand"): void;
}>();
</script>

<template>
  <CollapsablePanel
    :body-class="bodyClass"
    :body-style="bodyStyle"
    :collapsed="!isActive(name)"
    :disabled="disabled"
    :header="header"
    :header-class="headerClass"
    :header-style="headerStyle"
    :header-divider="false"
    :scrollable="scrollable"
    class="mcsl-accordion-panel"
    shadow="never"
    @collapse="
      deactivate(name);
      $emit('collapse');
    "
    @expand="
      activate(name);
      $emit('expand');
    "
  >
    <template #header>
      <slot name="header" />
    </template>
    <template #contextmenu>
      <slot name="contextmenu" />
    </template>
    <slot />
  </CollapsablePanel>
</template>

<style lang="scss" scoped>
.mcsl-accordion-panel.mcsl-collapsable-panel.mcsl-panel {
  border-radius: 0;
  border-top: none;
  border-left: none;
  border-right: none;
}
</style>

<style lang="scss"></style>

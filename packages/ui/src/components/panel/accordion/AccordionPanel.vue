<script setup lang="ts">
import CollapsablePanel from "../CollapsablePanel.vue";
import type { Size } from "../../../utils/types.ts";

withDefaults(
  defineProps<{
    name: string;
    header?: string;
    disabled?: boolean;
    size?: Size;
    headerClass?: string;
    headerStyle?: string;
    bodyClass?: string;
    bodyStyle?: string;
  }>(),
  {
    disabled: false,
  },
);

defineEmits<{
  (e: "collapse"): void;
  (e: "expand"): void;
}>();
</script>

<template>
  <CollapsablePanel
    class="mcsl-accordion-panel"
    :collapsed="!($parent as any).isActive(name)"
    @expand="
      ($parent as any).activate(name);
      $emit('expand');
    "
    @collapse="
      ($parent as any).deactivate(name);
      $emit('collapse');
    "
    shadow="never"
    :header="header"
    :headerDivider="false"
    :disabled="disabled"
    :body-class="bodyClass"
    :body-style="bodyStyle"
    :header-class="headerClass"
    :header-style="headerStyle"
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

<style scoped lang="scss">
.mcsl-accordion-panel.mcsl-collapsable-panel.mcsl-panel {
  border-radius: 0;
  border-top: none;
  border-left: none;
  border-right: none;
}
</style>

<style lang="scss"></style>

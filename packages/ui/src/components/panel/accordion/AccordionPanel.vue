<script lang="ts" setup>
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
    :body-class="bodyClass"
    :body-style="bodyStyle"
    :collapsed="!($parent as any).isActive(name)"
    :disabled="disabled"
    :header="header"
    :header-class="headerClass"
    :header-style="headerStyle"
    :headerDivider="false"
    class="mcsl-accordion-panel"
    shadow="never"
    @collapse="
      ($parent as any).deactivate(name);
      $emit('collapse');
    "
    @expand="
      ($parent as any).activate(name);
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

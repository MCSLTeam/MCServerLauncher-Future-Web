<script setup lang="ts">
import DropdownContent from "./DropdownContent.vue";
import Panel from "../panel/Panel.vue";
import type { Size } from "../../utils/utils";

withDefaults(
  defineProps<{
    title?: string;
    defaultPos?: "top" | "bottom" | "left" | "right";
    size?: Size;
  }>(),
  {
    title: "",
    defaultPos: "bottom",
    size: "small",
  },
);
</script>

<template>
  <DropdownContent :default-pos="defaultPos">
    <template #triggerer="slotProps">
      <slot name="triggerer" v-bind="slotProps" />
    </template>
    <Panel :header="title" :size="size" shadow="hover" class="mcsl-popover">
      <slot />
    </Panel>
  </DropdownContent>
</template>

<style scoped lang="scss">
.mcsl-popover {
  min-width: 14rem;
}
</style>

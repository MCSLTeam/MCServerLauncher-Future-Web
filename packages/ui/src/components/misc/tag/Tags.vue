<script setup lang="ts">
import type { Size } from "../../../utils/types.ts";
import { getSize } from "../../../utils/internal.ts";
import { withCtx } from "vue";

const props = defineProps<{
  size?: Size;
}>();

const size: Size = withCtx(() => getSize(props.size))();
</script>

<template>
  <div class="mcsl-tags" :class="[`mcsl-size-${size}`]">
    <slot />
  </div>
</template>

<style scoped lang="scss">
@use "../../../assets/css/utils";
@use "../../SmallerPanelContent" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-tags {
    gap: calc(utils.get-size-var("spacing", $size, $vars) / 2);
  }
}

.mcsl-tags {
  width: fit-content;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
</style>

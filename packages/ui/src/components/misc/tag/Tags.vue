<script lang="ts" setup>
import type { Size } from "../../../utils/types.ts";

withDefaults(
  defineProps<{
    size?: Size;
  }>(),
  {
    size: "middle",
  },
);
</script>

<template>
  <div :class="[`mcsl-size-${size}`]" class="mcsl-tags">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
@use "../../../assets/css/utils";
@use "../../SmallerContent" as *;

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

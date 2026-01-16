<script lang="ts" setup>
import { McLoadingIcon, RippleIcon, SpinnerIcon } from "../../utils/icons";
import { type Color, getColorVar } from "../../utils/css.ts";
import type { Size } from "../../utils/utils.ts";

withDefaults(
  defineProps<{
    label?: string;
    labelPos?: "left" | "right" | "top" | "bottom";
    type?: "mc" | "ripples" | "spinner";
    color?: Color;
    size?: Size;
  }>(),
  {
    size: "middle",
    label: "",
    labelPos: "bottom",
    type: "spinner",
    color: "text-color-regular",
  },
);
</script>

<template>
  <div
    :class="[`mcsl-size-${size}`, `mcsl-spinner__label-${labelPos}`]"
    :style="{
      '--mcsl-spinner__color': getColorVar(color),
    }"
    class="mcsl-spinner"
  >
    <McLoadingIcon v-if="type == 'mc'" />
    <RippleIcon v-else-if="type == 'ripples'" />
    <SpinnerIcon v-else-if="type == 'spinner'" />
    <p>{{ label }}</p>
  </div>
</template>

<style lang="scss" scoped>
@use "sass:map";
@use "../../assets/css/utils";

$vars: (
  "spinner-size": (
    "small": 1rem,
    "middle": 3rem,
    "large": 5rem,
  ),
);

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-spinner {
    $spinner-size: #{map.get(map.get($vars, "spinner-size"), $size)};

    width: $spinner-size;
    height: $spinner-size;
  }
}

.mcsl-spinner {
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;

  &.mcsl-spinner__label.top {
    flex-direction: column-reverse;
  }

  &.mcsl-spinner__label.bottom {
    flex-direction: column;
  }

  &.mcsl-spinner__label.left {
    flex-direction: row-reverse;
  }

  &.mcsl-spinner__label.right {
    flex-direction: row;
  }
}
</style>

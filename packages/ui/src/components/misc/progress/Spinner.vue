<script setup lang="ts">
import { McLoadingIcon, RippleIcon, SpinnerIcon } from "../../../utils/icons";
import { type Color, getColorVar } from "../../../utils/css.ts";

withDefaults(
  defineProps<{
    label?: string;
    labelPos?: "left" | "right" | "top" | "bottom";
    type?: "mc" | "ripples" | "spinner";
    color?: Color;
  }>(),
  {
    label: "",
    labelPos: "bottom",
    type: "spinner",
    color: "text-color-regular",
  },
);
</script>

<template>
  <div
    class="mcsl-spinner"
    :class="[`mcsl-spinner__label-${labelPos}`]"
    :style="{
      '--mcsl-spinner__color': getColorVar(color),
    }"
  >
    <McLoadingIcon v-if="type == 'mc'" />
    <RippleIcon v-else-if="type == 'ripples'" />
    <SpinnerIcon v-else-if="type == 'spinner'" />
    <p>{{ label }}</p>
  </div>
</template>

<style scoped lang="scss">
.mcsl-spinner {
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-content: center;

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

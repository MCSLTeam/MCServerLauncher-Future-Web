<script lang="ts" setup>
import { type Color, getColorVar } from "../../utils/css.ts";
import type { Size } from "../../utils/utils.ts";

withDefaults(
  defineProps<{
    label?: string;
    labelPos?: "left" | "right" | "top" | "bottom";
    color?: Color;
    block?: boolean;
    size?: Size;
  }>(),
  {
    size: "medium",
    label: "",
    labelPos: "bottom",
    color: "text-color-regular",
    block: false,
  },
);
</script>

<template>
  <div
    :class="{
      [`mcsl-size-${size}`]: true,
      [`mcsl-spinner__label-${labelPos}`]: true,
      'mcsl-spinner__block': block,
    }"
    :style="{
      '--mcsl-spinner__color': getColorVar(color),
    }"
    class="mcsl-spinner"
  >
    <svg
      aria-hidden="true"
      class="mcsl-spinner__icon"
      viewBox="0 0 24 24"
    >
      <circle class="mcsl-spinner__track" cx="12" cy="12" r="9" />
      <circle class="mcsl-spinner__indicator" cx="12" cy="12" r="9" />
    </svg>
    <p v-if="label">{{ label }}</p>
  </div>
</template>

<style lang="scss" scoped>
@use "sass:map";
@use "../../assets/css/utils";

$vars: (
  "spinner-size": (
    "small": 1rem,
    "medium": 3rem,
    "large": 5rem,
  ),
);

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-spinner {
    $spinner-size: #{map.get(map.get($vars, "spinner-size"), $size)};

    & > svg {
      width: $spinner-size;
      height: $spinner-size;
    }
  }
}

.mcsl-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--mcsl-spacing-xs);
  color: var(--mcsl-spinner__color);

  &.mcsl-spinner__label-top {
    flex-direction: column-reverse;
  }

  &.mcsl-spinner__label-bottom {
    flex-direction: column;
  }

  &.mcsl-spinner__label-left {
    flex-direction: row-reverse;
  }

  &.mcsl-spinner__label-right {
    flex-direction: row;
  }
}

.mcsl-spinner__icon {
  flex: 0 0 auto;
  color: var(--mcsl-spinner__color);
  animation: mcsl-spinner__rotate 0.9s linear infinite;

  & circle {
    fill: none;
    stroke-width: 2.25;
  }
}

.mcsl-spinner__track {
  stroke: color-mix(in srgb, currentColor 18%, transparent);
}

.mcsl-spinner__indicator {
  stroke: currentColor;
  stroke-linecap: round;
  stroke-dasharray: 42 64;
}

.mcsl-spinner > p {
  margin: 0;
  color: var(--mcsl-text-color-secondary);
  font-size: var(--mcsl-font-size-sm);
  line-height: 1.4;
}

.mcsl-spinner__block {
  width: 100%;
  height: 100%;
  min-height: 6rem;
}

@keyframes mcsl-spinner__rotate {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mcsl-spinner__icon {
    animation-duration: 1.8s;
  }
}
</style>

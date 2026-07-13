<script lang="ts" setup>
import { computed } from "vue";
import { getStatusIcon } from "../../utils/css.ts";
import type { Size } from "../../utils/utils.ts";

export type LoadingStatus = "loading" | "success" | "error" | "warning";

const props = withDefaults(
  defineProps<{
    variant?: "line" | "indeterminate" | "circle";
    progress?: number;
    status?: LoadingStatus;
    formatLabel?: (
      progress: number,
      status: LoadingStatus,
    ) => string | undefined;
    size?: Size;
  }>(),
  {
    size: "medium",
    variant: "line",
    progress: 0,
    status: "loading",
    formatLabel: undefined,
  },
);

const format =
  props.formatLabel ??
  (props.variant == "indeterminate"
    ? () => undefined
    : () => props.progress + "%");

const label = computed(() => format(props.progress, props.status));
const icon = computed(() =>
  getStatusIcon(props.status, props.variant != "circle"),
);
const visualProgress = computed(() =>
  props.status == "success" ? 100 : Math.min(100, Math.max(0, props.progress)),
);
</script>

<template>
  <div
    :class="[
      `mcsl-progress-bar__mode-${variant}`,
      `mcsl-progress-bar__status-${status}`,
      `mcsl-size-${size}`,
    ]"
    :style="{
      '--mcsl-progress-bar__progress': visualProgress + '%',
      '--mcsl-progress-bar__progress-decimal': visualProgress / 100,
    }"
    class="mcsl-progress-bar"
  >
    <div
      v-if="variant == 'line' || variant == 'indeterminate'"
      class="mcsl-progress-bar__line-like"
    >
      <div />
      <span v-if="icon || label">
        <i v-if="icon" :class="icon" />
        <template v-else>{{ label }}</template>
      </span>
    </div>
    <div v-else-if="variant == 'circle'" class="mcsl-progress-bar__circle">
      <svg>
        <circle r="0" />
        <circle r="0" />
      </svg>
      <span v-if="icon || label">
        <i v-if="icon" :class="icon" />
        <template v-else>{{ label }}</template>
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "sass:map";
@use "sass:math";
@use "../../assets/css/utils";

$vars: (
  "stroke-width": (
    "small": 0.25rem,
    "medium": 0.5rem,
    "large": 0.75rem,
  ),
  "circle-size": (
    "small": 3rem,
    "medium": 5rem,
    "large": 8rem,
  ),
);

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-progress-bar {
    --mcsl-progress-bar__stroke-width: #{map.get(
        map.get($vars, "stroke-width"),
        $size
      )};

    --mcsl-progress-bar__size: #{utils.get-size-var(
        "circle-size",
        $size,
        $vars
      )};
  }
}

.mcsl-progress-bar {
  &.mcsl-progress-bar__status-success {
    --mcsl-progress-bar__stroke-color: var(--mcsl-color-success);

    & * {
      color: var(--mcsl-color-success);
    }
  }

  &.mcsl-progress-bar__status-warning {
    --mcsl-progress-bar__stroke-color: var(--mcsl-color-warning);

    & * {
      color: var(--mcsl-color-warning);
    }
  }

  &.mcsl-progress-bar__status-error {
    --mcsl-progress-bar__stroke-color: var(--mcsl-color-danger);

    & * {
      color: var(--mcsl-color-danger);
    }
  }

  &.mcsl-progress-bar__status-loading {
    --mcsl-progress-bar__stroke-color: var(--mcsl-color-primary);
  }
}

$stroke-width: var(--mcsl-progress-bar__stroke-width);
$stroke-color: var(--mcsl-progress-bar__stroke-color);
$progress: var(--mcsl-progress-bar__progress);
$progress-decimal: var(--mcsl-progress-bar__progress-decimal);
$size: var(--mcsl-progress-bar__size);

// line / indeterminate
.mcsl-progress-bar.mcsl-progress-bar__mode-line,
.mcsl-progress-bar.mcsl-progress-bar__mode-indeterminate {
  width: 100%;
}

.mcsl-progress-bar__line-like {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mcsl-spacing-2xs);

  & > div {
    width: 0;
    flex: 1;
    height: $stroke-width;
    background: var(--mcsl-border-color-base);
    border-radius: var(--mcsl-border-radius-full);
    overflow: hidden;
    position: relative;
  }

  & > div::before {
    content: "";
    display: block;
    height: 100%;
    width: 100%;
    border-radius: var(--mcsl-border-radius-full);
    background: $stroke-color;
    transform-origin: left center;
    transition: transform var(--mcsl-motion-duration-slow)
      var(--mcsl-motion-ease-standard);
    will-change: transform;

    .mcsl-progress-bar__mode-line & {
      transform: scaleX($progress-decimal);
    }

    .mcsl-progress-bar__mode-indeterminate & {
      position: absolute;
      inset: 0 auto 0 0;
      width: 42%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in srgb, $stroke-color 60%, transparent) 16%,
        $stroke-color 44%,
        $stroke-color 56%,
        color-mix(in srgb, $stroke-color 60%, transparent) 84%,
        transparent 100%
      );
      transform: translate3d(-130%, 0, 0);
      transform-origin: center;
      transition: none;

      :not(.mcsl-progress-bar__status-loading) & {
        transform: scaleX(1);
        animation: none;
        background: $stroke-color;
      }
    }
  }

  .mcsl-progress-bar__status-loading.mcsl-progress-bar__mode-indeterminate
    &
    > div::before {
    animation: var(--mcsl-motion-duration-loading)
      var(--mcsl-motion-ease-loading) infinite mcsl-progress-bar__indeterminate;
  }
}

@keyframes mcsl-progress-bar__indeterminate {
  0% {
    transform: translate3d(-130%, 0, 0);
  }
  100% {
    transform: translate3d(340%, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mcsl-progress-bar__line-like > div::before {
    animation: none !important;
    transition: none !important;
  }
}

// circle
.mcsl-progress-bar__circle {
  width: $size;
  height: $size;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;

  & > svg {
    position: absolute;
    top: 0;
    left: 0;
    width: $size;
    height: $size;
    transform: rotate(-90deg);

    & > circle {
      cx: calc($size / 2);
      cy: calc($size / 2);
      r: calc($size / 2 - $stroke-width);
      fill: none;
      stroke-width: $stroke-width;

      &:first-child {
        stroke: var(--mcsl-border-color-base);
      }

      &:nth-child(2) {
        $circumference: calc(2 * #{math.$pi} * ($size / 2 - $stroke-width));
        stroke: $stroke-color;
        stroke-linecap: round;
        stroke-dasharray: calc($circumference);
        stroke-dashoffset: calc($circumference * (1 - $progress-decimal));
        transition: stroke-dashoffset var(--mcsl-motion-duration-fast)
          var(--mcsl-motion-ease-standard);
      }
    }
  }

  & > span {
    font-size: var(--mcsl-font-size-lg);

    & > i {
      font-size: var(--mcsl-font-size-xl);
    }
  }
}
</style>

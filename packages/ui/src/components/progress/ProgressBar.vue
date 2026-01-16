<script lang="ts" setup>
import { computed } from "vue";
import { getStatusIcon } from "../../utils/css.ts";
import type { Size } from "../../utils/util.ts";

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
    size: "middle",
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
</script>

<template>
  <div
    :class="[
      `mcsl-progress-bar__mode-${variant}`,
      `mcsl-progress-bar__status-${status}`,
      `mcsl-size-${size}`,
    ]"
    :style="{
      '--mcsl-progress-bar__progress':
        (status == 'success' ? 100 : progress) + '%',
      '--mcsl-progress-bar__progress-decimal':
        status == 'success' ? 1 : progress / 100,
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
    "middle": 0.5rem,
    "large": 0.75rem,
  ),
  "circle-size": (
    "small": 3rem,
    "middle": 5rem,
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
    width: 100%;
    height: $stroke-width;
    background: var(--mcsl-border-color-base);
    border-radius: var(--mcsl-border-radius-full);
    overflow: hidden;
    transition: 0.2s ease-in-out;
  }

  & > div::before {
    content: "";
    display: block;
    height: 100%;
    border-radius: var(--mcsl-border-radius-full);
    background: $stroke-color;
    transition: 0.2s ease-in-out;

    .mcsl-progress-bar__mode-line & {
      width: $progress;
    }

    .mcsl-progress-bar__mode-indeterminate & {
      width: 50%;

      :not(.mcsl-progress-bar__status-loading) & {
        width: 100%;
        animation: 0.2s ease-in-out both slideInLeft;
      }
    }

    .mcsl-progress-bar__status-loading.mcsl-progress-bar__mode-indeterminate & {
      animation: 2s ease-in-out infinite mcsl-progress-bar__indeterminate;
    }
  }
}

@keyframes mcsl-progress-bar__indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
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
        transition: 0.2s ease-in-out;
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

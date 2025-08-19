<script setup lang="ts">
import { computed } from "vue";
import { type Color, getColorVar } from "../../utils/css.ts";

const props = withDefaults(
  defineProps<{
    value?: string | number | undefined;
    color?: Color;
    visible?: boolean;
    showZero?: boolean;
    offsetX?: string | number;
    offsetY?: string | number;
  }>(),
  {
    color: "danger",
    visible: true,
    showZero: false,
    offsetX: "0",
    offsetY: "0",
  },
);

const actualOffsetX = computed(() => {
  if (typeof props.offsetX === "number") return `${props.offsetX}px`;
  return props.offsetX || "0";
});

const actualOffsetY = computed(() => {
  if (typeof props.offsetY === "number") return `${props.offsetY}px`;
  return props.offsetY || "0";
});

const actuallyVisible = computed(
  () => props.visible && (props.value != 0 || props.showZero),
);
</script>

<template>
  <div
    class="mcsl-badge"
    :class="{
      'mcsl-badge__visible': actuallyVisible,
      'mcsl-badge__dot': !value,
    }"
  >
    <slot />
    <div
      class="mcsl-badge__badge"
      :style="{
        backgroundColor: getColorVar(color),
        transform: `translate(${actualOffsetX}, ${actualOffsetY})`,
      }"
    >
      <template v-if="actuallyVisible">
        {{ value }}
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mcsl-badge {
  width: fit-content;
  position: relative;
}

.mcsl-badge__badge {
  $size: 1.25rem;
  $border-width: 2px;
  $padding: var(--mcsl-spacing-4xs);
  --mcsl-badge__border-color: var(--mcsl-bg-color-main);

  .mcsl-panel & {
    --mcsl-badge__border-color: var(--mcsl-bg-color-overlay);
  }

  z-index: 10;
  min-width: calc($size - 2 * $padding);
  height: $size;
  position: absolute;
  top: calc(0rem - $size / 2 - $border-width);
  left: calc(100% - $size / 2 - $border-width);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 $padding;
  color: var(--mcsl-text-color-opposite);
  font-size: var(--mcsl-font-size-sm);
  font-weight: var(--mcsl-font-weight-bolder);
  border-radius: var(--mcsl-border-radius-full);
  border: $border-width solid var(--mcsl-badge__border-color);
  scale: 0;
  transition: 0.2s ease-in-out;

  .mcsl-badge__visible & {
    scale: 1;
  }

  .mcsl-badge__dot & {
    $scale: 0.4;
    scale: $scale;
    border-width: calc($border-width / $scale);
    $offset: calc($border-width / $scale - $border-width);
    top: calc(0rem - $size / 2 - $border-width - $offset);
    left: calc(100% - $size / 2 - $border-width - $offset);
  }
}
</style>

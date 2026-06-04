<script setup lang="ts">
import type { Color } from "../../utils/css";
import { getColorVar } from "../../utils/css";

withDefaults(defineProps<{ color?: Color }>(), { color: "surface" });
</script>

<template>
  <span class="mcsl-tag" :style="{ '--mcsl-tag-color': getColorVar(color) }">
    <slot />
  </span>
</template>

<style scoped lang="scss">
.mcsl-tag {
  display: inline-flex;
  align-items: center;
  min-height: 1.65rem;
  padding: 0 10px;
  border-radius: calc(var(--mcsl-border-radius-full) - 2px);
  border: 1px solid color-mix(in srgb, var(--mcsl-tag-color) 26%, var(--mcsl-border-color-base));
  background: color-mix(in srgb, var(--mcsl-tag-color) 8%, var(--mcsl-bg-color-overlay));
  color: var(--mcsl-text-color-regular);
  font-size: var(--mcsl-font-size-sm);
}
</style>

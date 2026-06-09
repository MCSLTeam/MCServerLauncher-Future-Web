<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: "small" | "medium";
  }>(),
  {
    size: "medium",
  },
);
</script>

<template>
  <kbd class="mcsl-kbd" :class="[`mcsl-kbd--${size}`]">
    <slot />
  </kbd>
</template>

<style scoped lang="scss">
.mcsl-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.8em;
  height: 1.7em;
  padding: 0 0.52em;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 86%, transparent);
  border-radius: var(--mcsl-border-radius-sm);
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 78%, var(--mcsl-bg-color-overlay));
  box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--mcsl-border-color-base) 72%, transparent);
  color: var(--mcsl-text-color-regular);
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  font-size: var(--mcsl-font-size-sm);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.mcsl-kbd--small {
  min-width: 1.65em;
  height: 1.55em;
  padding: 0 0.44em;
  font-size: var(--mcsl-font-size-xs);
}
</style>

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
  min-width: 1.75em;
  height: 1.75em;
  padding: 0 0.48em;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 92%, transparent);
  border-bottom-color: color-mix(in srgb, var(--mcsl-border-color-dark) 72%, transparent);
  border-radius: var(--mcsl-border-radius-sm);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 96%, var(--mcsl-bg-color-dark));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--mcsl-bg-color-overlay) 82%, transparent),
    0 1px 1px color-mix(in srgb, var(--mcsl-bg-color-overlay-opposite) 12%, transparent);
  color: var(--mcsl-text-color-regular);
  font-family: inherit;
  font-size: var(--mcsl-font-size-sm);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.mcsl-kbd--small {
  min-width: 1.55em;
  height: 1.55em;
  padding: 0 0.4em;
  font-size: var(--mcsl-font-size-xs);
}
</style>

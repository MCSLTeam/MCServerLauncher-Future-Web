<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string;
    height?: string;
    rounded?: boolean;
    lines?: number;
  }>(),
  {
    width: "100%",
    height: "1rem",
    rounded: true,
    lines: 1,
  },
);
</script>

<template>
  <div class="mcsl-skeleton-stack">
    <div
      v-for="index in lines"
      :key="index"
      class="mcsl-skeleton"
      :class="{ 'mcsl-skeleton__rounded': rounded }"
      :style="{
        width,
        height,
      }"
    />
  </div>
</template>

<style scoped lang="scss">
.mcsl-skeleton-stack {
  display: grid;
  gap: var(--mcsl-spacing-4xs);
}

.mcsl-skeleton {
  border: 1px solid var(--mcsl-skeleton__edge);
  background: linear-gradient(
    90deg,
    var(--mcsl-skeleton__base) 0%,
    var(--mcsl-skeleton__base) 34%,
    var(--mcsl-skeleton__highlight) 50%,
    var(--mcsl-skeleton__base) 66%,
    var(--mcsl-skeleton__base) 100%
  );
  background-size: 240% 100%;
  box-shadow: inset 0 1px 0 var(--mcsl-skeleton__inner-edge);
  animation: mcsl-skeleton 2.2s ease-in-out infinite;
}

.light .mcsl-skeleton {
  --mcsl-skeleton__base: color-mix(in srgb, var(--mcsl-border-color-base) 72%, var(--mcsl-bg-color-dark));
  --mcsl-skeleton__highlight: color-mix(in srgb, var(--mcsl-bg-color-overlay) 72%, white);
  --mcsl-skeleton__edge: color-mix(in srgb, var(--mcsl-border-color-dark) 46%, transparent);
  --mcsl-skeleton__inner-edge: color-mix(in srgb, white 72%, transparent);
}

.dark .mcsl-skeleton {
  --mcsl-skeleton__base: color-mix(in srgb, var(--mcsl-bg-color-dark) 72%, var(--mcsl-border-color-base));
  --mcsl-skeleton__highlight: color-mix(in srgb, var(--mcsl-bg-color-overlay) 82%, white 10%);
  --mcsl-skeleton__edge: color-mix(in srgb, var(--mcsl-border-color-base) 70%, transparent);
  --mcsl-skeleton__inner-edge: color-mix(in srgb, white 5%, transparent);
}

.mcsl-skeleton__rounded {
  border-radius: var(--mcsl-border-radius-sm);
}

@keyframes mcsl-skeleton {
  0% { background-position: 180% 0; }
  100% { background-position: -180% 0; }
}
</style>

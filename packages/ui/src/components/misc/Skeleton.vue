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
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--mcsl-bg-color-dark) 92%, transparent) 0%,
    color-mix(in srgb, var(--mcsl-bg-color-overlay) 88%, transparent) 50%,
    color-mix(in srgb, var(--mcsl-bg-color-dark) 92%, transparent) 100%
  );
  background-size: 200% 100%;
  animation: mcsl-skeleton 1.2s ease-in-out infinite;
}

.mcsl-skeleton__rounded {
  border-radius: var(--mcsl-border-radius-sm);
}

@keyframes mcsl-skeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>

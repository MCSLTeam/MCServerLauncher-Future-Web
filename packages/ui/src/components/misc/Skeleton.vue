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
  background-color: var(--mcsl-skeleton__color-start);
  animation: mcsl-skeleton-loading
    calc(var(--mcsl-motion-duration-loading) * 1.12)
    var(--mcsl-motion-ease-loading) infinite;
  transition:
    background-color var(--mcsl-motion-duration-base)
      var(--mcsl-motion-ease-standard),
    border-radius var(--mcsl-motion-duration-base)
      var(--mcsl-motion-ease-standard);
}

.light .mcsl-skeleton {
  --mcsl-skeleton__color-start: #eee;
  --mcsl-skeleton__color-end: #ddd;
}

.dark .mcsl-skeleton {
  --mcsl-skeleton__color-start: rgb(255 255 255 / 12%);
  --mcsl-skeleton__color-end: rgb(255 255 255 / 18%);
}

.mcsl-skeleton__rounded {
  border-radius: var(--mcsl-border-radius-sm);
}

@keyframes mcsl-skeleton-loading {
  0% {
    background-color: var(--mcsl-skeleton__color-start);
  }

  40% {
    background-color: var(--mcsl-skeleton__color-end);
  }

  80%,
  100% {
    background-color: var(--mcsl-skeleton__color-start);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mcsl-skeleton {
    animation: none;
  }
}
</style>

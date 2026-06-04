<script setup lang="ts">
withDefaults(
  defineProps<{
    src?: string;
    text?: string;
    size?: number;
  }>(),
  {
    src: "",
    text: "",
    size: 40,
  },
);
</script>

<template>
  <div class="mcsl-avatar" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="src" :src="src" alt="" />
    <span v-else>{{ text.slice(0, 2).toUpperCase() }}</span>
  </div>
</template>

<style scoped lang="scss">
.mcsl-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--mcsl-border-radius-full);
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 96%, transparent);
  color: var(--mcsl-text-color-primary);
  font-weight: 600;
}
img { width: 100%; height: 100%; object-fit: cover; }
</style>

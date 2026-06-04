<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    status?: "info" | "success" | "warning" | "error";
  }>(),
  {
    title: "",
    description: "",
    status: "info",
  },
);
</script>

<template>
  <div class="mcsl-result" :class="`mcsl-result--${status}`">
    <div class="mcsl-result__icon" />
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.mcsl-result {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--mcsl-spacing-2xs);
}
.mcsl-result__icon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--mcsl-border-radius-full);
  background: color-mix(in srgb, var(--mcsl-color-primary) 16%, var(--mcsl-bg-color-overlay));
}
h3 { margin: 0; font-size: var(--mcsl-font-size-2xl); font-weight: 600; }
p { margin: 0; max-width: 30rem; color: var(--mcsl-text-color-regular); line-height: 1.7; }
.mcsl-result--success .mcsl-result__icon { background: color-mix(in srgb, var(--mcsl-color-success) 16%, var(--mcsl-bg-color-overlay)); }
.mcsl-result--warning .mcsl-result__icon { background: color-mix(in srgb, var(--mcsl-color-warning) 16%, var(--mcsl-bg-color-overlay)); }
.mcsl-result--error .mcsl-result__icon { background: color-mix(in srgb, var(--mcsl-color-danger) 16%, var(--mcsl-bg-color-overlay)); }
</style>

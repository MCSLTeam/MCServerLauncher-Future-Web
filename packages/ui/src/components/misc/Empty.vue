<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    icon?: string;
  }>(),
  {
    title: "Nothing here yet",
    description: "There is currently no content to display.",
    icon: "fa fa-box-open",
  },
);
</script>

<template>
  <div class="mcsl-empty">
    <i :class="icon" class="mcsl-empty__icon" />
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.mcsl-empty {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mcsl-spacing-2xs);
  text-align: center;
  color: var(--mcsl-text-color-regular);
}

.mcsl-empty__icon {
  font-size: 1.5rem;
  color: var(--mcsl-text-color-secondary);
}

h3 {
  margin: 0;
  color: var(--mcsl-text-color-primary);
  font-size: var(--mcsl-font-size-2xl);
  font-weight: 600;
}

p {
  margin: 0;
  max-width: 28rem;
  line-height: 1.6;
}
</style>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
  }>(),
  {
    title: "",
    subtitle: "",
  },
);
</script>

<template>
  <header class="mcsl-page-header">
    <div>
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div class="mcsl-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.mcsl-page-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 16px;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 3rem);
  font-weight: 620;
  line-height: 1.04;
}

p {
  margin: 10px 0 0;
  color: var(--mcsl-text-color-secondary);
  line-height: 1.65;
}

.mcsl-page-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 980px) {
  .mcsl-page-header {
    flex-direction: column;
  }
}
</style>

<script setup lang="ts">
withDefaults(
  defineProps<{
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  },
);

const model = defineModel<number>({
  required: false,
  default: 0,
});
</script>

<template>
  <div class="mcsl-slider">
    <input
      v-model="model"
      class="mcsl-slider__input"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
    />
    <span class="mcsl-slider__value">{{ model }}</span>
  </div>
</template>

<style scoped lang="scss">
.mcsl-slider {
  display: flex;
  align-items: center;
  gap: var(--mcsl-spacing-sm);
}

.mcsl-slider__input {
  width: 100%;
  margin: 0;
  accent-color: var(--mcsl-color-primary);
}

.mcsl-slider__value {
  min-width: 2.5rem;
  color: var(--mcsl-text-color-secondary);
  font-size: var(--mcsl-font-size-sm);
  text-align: right;
}
</style>

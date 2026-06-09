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
  width: 100%;
}

.mcsl-slider__input {
  --mcsl-slider__track: color-mix(in srgb, var(--mcsl-border-color-base) 78%, transparent);
  --mcsl-slider__fill: var(--mcsl-color-primary);

  width: 100%;
  height: 18px;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
  outline: 0 solid transparent;
}

.mcsl-slider__input::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: var(--mcsl-border-radius-full);
  background: var(--mcsl-slider__track);
}

.mcsl-slider__input::-moz-range-track {
  height: 6px;
  border-radius: var(--mcsl-border-radius-full);
  background: var(--mcsl-slider__track);
}

.mcsl-slider__input::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  margin-top: -5px;
  appearance: none;
  border: 2px solid var(--mcsl-slider__fill);
  border-radius: var(--mcsl-border-radius-full);
  background: var(--mcsl-bg-color-overlay);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--mcsl-text-color-primary) 14%, transparent);
  transition:
    background-color 0.14s ease-out,
    box-shadow 0.14s ease-out,
    transform 0.14s ease-out;
}

.mcsl-slider__input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border: 2px solid var(--mcsl-slider__fill);
  border-radius: var(--mcsl-border-radius-full);
  background: var(--mcsl-bg-color-overlay);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--mcsl-text-color-primary) 14%, transparent);
  transition:
    background-color 0.14s ease-out,
    box-shadow 0.14s ease-out,
    transform 0.14s ease-out;
}

.mcsl-slider__input:hover::-webkit-slider-thumb,
.mcsl-slider__input:focus-visible::-webkit-slider-thumb {
  background: color-mix(in srgb, var(--mcsl-slider__fill) 10%, var(--mcsl-bg-color-overlay));
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--mcsl-slider__fill) 12%, transparent);
}

.mcsl-slider__input:hover::-moz-range-thumb,
.mcsl-slider__input:focus-visible::-moz-range-thumb {
  background: color-mix(in srgb, var(--mcsl-slider__fill) 10%, var(--mcsl-bg-color-overlay));
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--mcsl-slider__fill) 12%, transparent);
}

.mcsl-slider__input:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.mcsl-slider__value {
  min-width: 2.7rem;
  padding: 2px 7px;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 80%, transparent);
  border-radius: var(--mcsl-border-radius-sm);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 96%, transparent);
  color: var(--mcsl-text-color-secondary);
  font-size: var(--mcsl-font-size-sm);
  text-align: right;
}
</style>

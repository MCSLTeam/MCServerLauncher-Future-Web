<script setup lang="ts">
import type { SelectionItem } from "../../../utils/form";
import type { Size } from "../../../utils/utils";

withDefaults(
  defineProps<{
    options: SelectionItem[];
    size?: Size;
    disabled?: boolean;
  }>(),
  {
    size: "medium",
    disabled: false,
  },
);

const model = defineModel<any>({
  required: false,
  default: undefined,
});
</script>

<template>
  <div class="mcsl-radio-group" :class="[`mcsl-size-${size}`]">
    <label v-for="item in options" :key="item.value" class="mcsl-radio-group__item">
      <input
        v-model="model"
        class="mcsl-radio-group__radio"
        type="radio"
        :value="item.value"
        :disabled="disabled || item.disabled"
      />
      <span>{{ item.label ?? item.value }}</span>
    </label>
  </div>
</template>

<style scoped lang="scss">
@use "../../../assets/css/utils";
@use "../../Content" as *;

$vars: (
  "font-size": (
    "small": var(--mcsl-font-size-sm),
    "medium": var(--mcsl-font-size-md),
    "large": var(--mcsl-font-size-lg),
  ),
);

.mcsl-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mcsl-spacing-xs);
}

.mcsl-radio-group__item {
  display: inline-flex;
  align-items: center;
  gap: var(--mcsl-spacing-2xs);
  min-height: 2rem;
  padding: 0 2px;
  color: var(--mcsl-text-color-regular);
  cursor: pointer;
  user-select: none;
}

.mcsl-radio-group__radio {
  position: relative;
  width: 16px;
  height: 16px;
  margin: 0;
  appearance: none;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 90%, transparent);
  border-radius: var(--mcsl-border-radius-full);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 98%, transparent);
  cursor: pointer;
  outline: 0 solid transparent;
  transition:
    border-color 0.14s ease-out,
    background-color 0.14s ease-out,
    box-shadow 0.14s ease-out;
}

.mcsl-radio-group__radio::before {
  content: "";
  position: absolute;
  inset: 4px;
  border-radius: var(--mcsl-border-radius-full);
  background: var(--mcsl-color-primary);
  opacity: 0;
  transform: scale(0.55);
  transition:
    opacity 0.14s ease-out,
    transform 0.14s ease-out;
}

.mcsl-radio-group__item:hover .mcsl-radio-group__radio {
  border-color: color-mix(in srgb, var(--mcsl-color-primary) 46%, var(--mcsl-border-color-base));
  background: color-mix(in srgb, var(--mcsl-color-primary) 5%, var(--mcsl-bg-color-overlay));
}

.mcsl-radio-group__radio:checked {
  border-color: var(--mcsl-color-primary);
  background: color-mix(in srgb, var(--mcsl-color-primary) 8%, var(--mcsl-bg-color-overlay));
}

.mcsl-radio-group__radio:checked::before {
  opacity: 1;
  transform: scale(1);
}

.mcsl-radio-group__radio:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mcsl-color-help) 30%, transparent);
}

.mcsl-radio-group__radio:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.mcsl-radio-group__item:has(.mcsl-radio-group__radio:disabled) {
  cursor: not-allowed;
  color: var(--mcsl-text-color-secondary);
}

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-radio-group {
    font-size: utils.get-size-var("font-size", $size, $vars);
  }
}
</style>

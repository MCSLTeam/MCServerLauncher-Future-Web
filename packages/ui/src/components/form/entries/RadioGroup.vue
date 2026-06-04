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
  gap: var(--mcsl-spacing-2xs);
}

.mcsl-radio-group__item {
  display: inline-flex;
  align-items: center;
  gap: var(--mcsl-spacing-4xs);
  min-height: 2rem;
  padding: 0 2px;
  color: var(--mcsl-text-color-regular);
}

.mcsl-radio-group__radio {
  margin: 0;
  accent-color: var(--mcsl-color-primary);
}

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-radio-group {
    font-size: utils.get-size-var("font-size", $size, $vars);
  }
}
</style>

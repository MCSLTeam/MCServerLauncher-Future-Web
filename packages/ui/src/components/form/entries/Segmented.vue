<script lang="ts" setup>
import type { SelectionItem } from "../../../utils/form";
import type { ColorType } from "../../../utils/css";
import type { Size } from "../../../utils/utils";

const props = withDefaults(
  defineProps<{
    options: SelectionItem[];
    nullable?: boolean;
    multiple?: boolean;
    disabled?: boolean;
    color?: ColorType;
    invalid?: boolean;
    size?: Size;
  }>(),
  {
    size: "medium",
    color: "primary",
    nullable: false,
    multiple: false,
    disabled: false,
    invalid: false,
  },
);

const model = defineModel<any>({
  required: false,
  default: undefined,
});

function emitAll() {
  // no-op placeholder for external wrappers
}

function selectValue(value: any) {
  if (props.multiple) {
    const current = Array.isArray(model.value) ? [...model.value] : [];
    if (current.includes(value)) {
      if (props.nullable || current.length > 1) {
        model.value = current.filter((item) => item !== value);
        emitAll();
      }
    } else {
      model.value = [...current, value];
      emitAll();
    }
  } else {
    if (props.nullable && value == model.value) {
      model.value = null;
    } else if (model.value != value) {
      model.value = value;
    }
    emitAll();
  }
}

function isChecked(value: any) {
  if (props.multiple) return (model.value as any[])?.includes?.(value) ?? false;
  return model.value == value;
}
</script>

<template>
  <div class="mcsl-segmented" :class="[`mcsl-size-${size}`]" :aria-invalid="invalid">
    <button
      v-for="item in options"
      :key="item.value"
      :disabled="disabled || item.disabled"
      :class="{ 'mcsl-segmented__checked': isChecked(item.value) }"
      @click="selectValue(item.value)"
    >
      <i v-if="item.icon" :class="item.icon" />
      <span>{{ item.label ?? item.value }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use "../../../assets/css/utils";
@use "../../Content" as *;

.mcsl-segmented {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 88%, transparent);
  border-radius: calc(var(--mcsl-border-radius-sm) + 2px);
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 96%, transparent);
}

.mcsl-segmented > button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: calc(var(--mcsl-border-radius-xs) + 1px);
  background: transparent;
  color: var(--mcsl-text-color-regular);
  cursor: pointer;
  transition:
    background-color 0.14s ease-out,
    border-color 0.14s ease-out,
    color 0.14s ease-out;
}

.mcsl-segmented > button:hover:not(:disabled):not(.mcsl-segmented__checked) {
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 92%, transparent);
}

.mcsl-segmented > button.mcsl-segmented__checked {
  background: color-mix(in srgb, var(--mcsl-color-primary) 11%, var(--mcsl-bg-color-overlay));
  border-color: color-mix(in srgb, var(--mcsl-color-primary) 30%, var(--mcsl-border-color-base));
  color: var(--mcsl-text-color-primary);
}

.mcsl-segmented > button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-segmented > button {
    $spacing: utils.get-size-var("spacing", $size, $vars);
    $height: utils.get-size-var("height", $size, $vars);
    min-height: calc($height - 8px);
    padding: 0 calc($spacing * 1.25);
    font-size: var(--mcsl-font-size-md);
  }
}

.mcsl-segmented[aria-invalid="true"] {
  border-color: var(--mcsl-color-danger);
}
</style>

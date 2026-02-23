<script lang="ts" setup>
import { inject, watch } from "vue";
import type { FormFieldData } from "../FormEntry.vue";
import { type ColorType } from "../../../utils/css.ts";
import type { Size } from "../../../utils/utils.ts";
import type { SelectionItem } from "../../../utils/form.ts";

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

const emit = defineEmits<{
  (e: "input", event: Event): void;
  (e: "blur", event: Event): void;
  (e: "focus", event: Event): void;
}>();

const model = defineModel<any>({
  required: false,
  default: undefined,
});

const formField = inject("mcsl-form-field", undefined) as
  | FormFieldData
  | undefined;

if (formField) {
  if (props.multiple && !Array.isArray(formField.field.data.value)) {
    console.error(
      '[MCSL-UI] The type of the value for a <SelectButton> component with `:multiple="true"` is not array.',
    );
    throw new Error(
      'The type of the value for a <SelectButton> component with `:multiple="true"` is not array.',
    );
  }

  model.value = formField.field.data.value;

  watch(formField.field.data, (value) => {
    if (value != model.value) model.value = value;
  });

  watch(model, (value) => {
    if (value != formField.field.data.value) formField.field.data.value = value;
  });
}

function emitAll() {
  emit("input", model.value);
  emit("focus", model.value);
  emit("blur", model.value);
}

function selectValue(value: any) {
  if (props.multiple) {
    if ((model.value as any[]).includes(value)) {
      if (props.nullable || (model.value as any[]).length > 1) {
        (model.value as any[]).splice((model.value as any[]).indexOf(value), 1);
        emitAll();
      }
    } else {
      (model.value as any[]).push(value);
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
  if (props.multiple) return (model.value as any[]).includes(value);
  return model.value == value;
}
</script>

<template>
  <div
    class="mcsl-select-button"
    :class="[`mcsl-size-${size}`]"
    :aria-invalid="invalid"
  >
    <button
      v-for="item in options"
      :key="item.value"
      :disabled="disabled"
      :class="{ 'mcsl-select-button__checked': isChecked(item.value) }"
      @click="selectValue(item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use "../../../assets/css/utils";
@use "../../SmallerContent" as *;

@each $size in utils.$sizes {
  $padding: calc(utils.get-size-var("spacing", $size, $vars) / 1.5);
  $border-radius: utils.get-size-var("border-radius", $size, $vars);
  .mcsl-size-#{$size}.mcsl-select-button {
    padding: $padding;
    gap: $padding;
    border-radius: calc($border-radius + $padding);

    & > button {
      padding: calc($padding);
      border-radius: $border-radius;
    }
  }
}

.mcsl-select-button {
  width: fit-content;
  display: flex;
  border: 1px solid transparent;
  background: var(--mcsl-bg-color-main);
}

.mcsl-select-button > button {
  cursor: pointer;
  border: none;
  background: none;
  outline: 0 solid transparent;
  outline-offset: 2px;
  transition: 0.2s ease-in-out;

  &:focus-visible {
    outline: 3px solid var(--mcsl-color-help);
  }

  &:disabled {
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: var(--mcsl-bg-color-overlay);
  }

  .light & {
    --mcsl-select-button__background: var(--mcsl-bg-color-overlay);
  }

  .dark & {
    --mcsl-select-button__background: var(--mcsl-border-color-light);
  }

  &.mcsl-select-button__checked {
    background: var(--mcsl-select-button__background);
    box-shadow: var(--mcsl-box-shadow-light);
  }

  &.mcsl-select-button__checked:disabled {
    background: var(--mcsl-border-color-base);
  }

  &.mcsl-select-button__checked:hover:not(:disabled) {
    box-shadow: var(--mcsl-box-shadow-base);
  }
}

.mcsl-select-button[aria-invalid="true"] {
  &,
  &:hover,
  &:checked,
  &:disabled {
    border-color: var(--mcsl-color-danger);
  }
}
</style>

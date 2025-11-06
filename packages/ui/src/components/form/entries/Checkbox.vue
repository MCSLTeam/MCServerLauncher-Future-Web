<script lang="ts" setup>
import { inject, watch } from "vue";
import type { FormFieldData } from "../FormEntry.vue";
import { ColorData, type ColorType, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/types.ts";
import { getSize } from "../../../utils/internal.ts";

const props = withDefaults(
  defineProps<{
    icon?: string;
    color?: ColorType;
    invalid?: boolean;
    disabled?: boolean;
    size?: Size;
  }>(),
  {
    icon: "fas fa-check",
    color: "primary",
    invalid: false,
    disabled: false,
  },
);

defineEmits<{
  (e: "input", event: Event): void;
  (e: "blur", event: Event): void;
  (e: "focus", event: Event): void;
}>();

const model = defineModel<boolean>({
  required: false,
  default: false,
});

const size = getSize(props.size);

const formField = inject("mcsl-form-field", undefined) as
  | FormFieldData
  | undefined;

if (formField) {
  if (typeof formField.field.value.value != "boolean") {
    console.error(
      "[MCSL-UI] The type of the value for a <Checkbox> component is not boolean.",
    );
    throw new Error(
      "The type of the value for a <Checkbox> component is not boolean.",
    );
  }

  model.value = formField.field.value.value;
  watch(model, (value) => {
    formField.field.value.value = value;
  });
}
</script>

<template>
  <input
    v-model="model"
    :aria-invalid="
      invalid || formField?.field?.error?.value ? 'true' : undefined
    "
    :id="formField?.id"
    :class="[`mcsl-size-${size}`, ...icon.split(' ')]"
    :disabled="disabled"
    :style="{
      '--mcsl-checkbox__color': getColorVar(color),
      '--mcsl-checkbox__color-dark': new ColorData(color, 'dark').getCss(),
    }"
    class="mcsl-checkbox"
    type="checkbox"
    @blur="
      $emit('blur', $event);
      formField?.onBlur($event);
    "
    @input="
      (e) => {
        $emit('input', e);
        if (formField) {
          formField.field.value.value = model = (
            e.currentTarget as HTMLInputElement
          ).checked;
          formField.onInput(e);
        }
      }
    "
    @focus="
      $emit('focus', $event);
      formField?.onFocus($event);
    "
  />
</template>

<style lang="scss" scoped>
@use "../../../assets/css/utils";
@use "../../SmallerPanelContent" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-checkbox {
    $size-num: calc(utils.get-size-var("spacing", $size, $vars) * 2);
    border-radius: utils.get-size-var("border-radius", $size, $vars);
    width: calc($size-num + 2px);
    height: calc($size-num + 2px);
    font-size: utils.get-size-var("font-size", $size, $vars);

    &::before {
      width: $size-num;
      height: $size-num;
    }
  }
}

.mcsl-checkbox {
  margin: 0;
  appearance: none;
  border: 1px solid var(--mcsl-border-color-base);
  outline: 0 solid transparent;
  outline-offset: 2px;
  transform: translate(0);
  transition: 0.2s ease-in-out;

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--mcsl-text-color-opposite);
    visibility: hidden;
  }

  &:focus-visible {
    outline: 3px solid var(--mcsl-color-help);
  }
}

.mcsl-checkbox:hover {
  border-color: var(--mcsl-border-color-dark);
}

.mcsl-checkbox:checked {
  border-color: var(--mcsl-checkbox__color);
  background: var(--mcsl-checkbox__color);
  box-shadow: var(--mcsl-box-shadow-lighter);

  &::before {
    visibility: visible;
  }
}

.mcsl-checkbox:hover:checked {
  border-color: var(--mcsl-checkbox__color-dark);
  background: var(--mcsl-checkbox__color-dark);
  box-shadow: var(--mcsl-box-shadow-base);
}

.mcsl-checkbox:disabled {
  border-color: var(--mcsl-border-color-dark);
  cursor: not-allowed;
  background: var(--mcsl-border-color-base);
  box-shadow: none;

  &:checked {
    border-color: var(--mcsl-border-color-dark);
    background: var(--mcsl-border-color-dark);
  }
}

.mcsl-checkbox[aria-invalid="true"] {
  &,
  &:hover,
  &:checked,
  &:disabled {
    border-color: var(--mcsl-color-danger);
  }
}
</style>

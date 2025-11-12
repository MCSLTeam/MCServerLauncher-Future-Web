<script lang="ts" setup>
import { inject, watch } from "vue";
import type { FormFieldData } from "../FormEntry.vue";
import { ColorData, type ColorType, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/types.ts";
import { getSize } from "../../../utils/internal.ts";

const props = withDefaults(
  defineProps<{
    color?: ColorType;
    invalid?: boolean;
    disabled?: boolean;
    size?: Size;
    placeholder?: string;
    password?: boolean;
  }>(),
  {
    color: "primary",
    invalid: false,
    disabled: false,
    placeholder: "",
    password: false,
  },
);

defineEmits<{
  (e: "input", event: Event): void;
  (e: "blur", event: Event): void;
  (e: "focus", event: Event): void;
}>();

const model = defineModel<string>({
  required: false,
  default: "",
});

const size = getSize(props.size);

const formField = inject("mcsl-form-field", undefined) as
  | FormFieldData
  | undefined;

if (formField) {
  if (typeof formField.field.data.value != "string") {
    console.error(
      "[MCSL-UI] The type of the value for a <InputText> component is not string.",
    );
    throw new Error(
      "The type of the value for a <InputText> component is not string.",
    );
  }

  model.value = formField.field.data.value;
  watch(model, (value) => {
    formField.field.data.value = value;
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
    :class="[`mcsl-size-${size}`]"
    :disabled="disabled"
    :style="{
      '--mcsl-input-text__color-light': getColorVar(
        new ColorData(color, 'light'),
      ),
      '--mcsl-input-text__color': getColorVar(color),
      '--mcsl-input-text__color-dark': getColorVar(
        new ColorData(color, 'dark'),
      ),
    }"
    :placeholder="placeholder"
    class="mcsl-input mcsl-input-text"
    :type="password ? 'password' : 'text'"
    @blur="
      $emit('blur', $event);
      formField?.onBlur($event);
    "
    @input="
      (e) => {
        $emit('input', e);
        if (formField) {
          formField.field.data.value = model = (
            e.currentTarget as HTMLInputElement
          ).value;
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
@use "sass:map";
@use "../../../assets/css/utils";
@use "../../SmallerPanelContent" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-input-text {
    $spacing: calc(utils.get-size-var("spacing", $size, $vars));
    flex-grow: 1;
    height: calc($spacing * 2 - 2px);
    padding: calc($spacing);
    border-radius: utils.get-size-var("border-radius", $size, $vars);

    &::placeholder {
      color: var(--mcsl-text-color-gray);
      font-size: utils.get-size-var("font-size", $size, $vars);
    }
  }
}

.mcsl-input-text {
  margin: 0;
  border: 1px solid var(--mcsl-border-color-base);
  outline: 0 solid transparent;
  outline-offset: -2px; // 覆盖 border
  transform: translate(0);
  transition: 0.2s ease-in-out;
}

.mcsl-input-text:hover {
  box-shadow: var(--mcsl-box-shadow-light);
  border-color: var(--mcsl-border-color-dark);
}

.mcsl-input-text:focus {
  box-shadow: var(--mcsl-box-shadow-light);
  outline-color: var(--mcsl-input-text__color-light);
  outline-width: 2px;
  outline-offset: -1px;
}

.mcsl-input-text:hover:focus {
  box-shadow: var(--mcsl-box-shadow-base);
  outline-color: var(--mcsl-input-text__color);
}

.mcsl-input-text:disabled {
  cursor: not-allowed;
  border-color: var(--mcsl-border-color-dark);
  background: var(--mcsl-border-color-base);
  box-shadow: none;
}

.mcsl-input-text[aria-invalid="true"] {
  &,
  &:hover,
  &:disabled {
    outline-offset: 1px;
    border-color: var(--mcsl-color-danger);

    &::placeholder {
      color: var(--mcsl-color-danger);
    }
  }
}
</style>

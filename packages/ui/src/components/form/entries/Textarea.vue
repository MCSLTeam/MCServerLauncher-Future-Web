<script lang="ts" setup>
import { inject, watch } from "vue";
import type { FormFieldData } from "../FormEntry.vue";
import { ColorData, type ColorType, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/utils.ts";

withDefaults(
  defineProps<{
    color?: ColorType;
    invalid?: boolean;
    disabled?: boolean;
    size?: Size;
    placeholder?: string;
    resizeable?: boolean;
  }>(),
  {
    size: "medium",
    color: "primary",
    invalid: false,
    disabled: false,
    placeholder: "",
    resizeable: false,
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

  watch(formField.field.data, (value) => {
    if (value != model.value) model.value = value;
  });

  watch(model, (value) => {
    if (value != formField.field.data.value) formField.field.data.value = value;
  });
}
</script>

<template>
  <textarea
    v-model="model"
    :aria-invalid="
      invalid || formField?.field?.error?.value ? 'true' : undefined
    "
    :id="formField?.id"
    :class="{
      [`mcsl-size-${size}`]: true,
      'mcsl-textarea__resizeable': resizeable,
    }"
    :disabled="disabled"
    :style="{
      '--mcsl-textarea__color-light': getColorVar(
        new ColorData(color, 'light'),
      ),
      '--mcsl-textarea__color': getColorVar(color),
      '--mcsl-textarea__color-dark': new ColorData(color, 'dark').getCss(),
    }"
    :placeholder="placeholder"
    class="mcsl-textarea"
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
@use "../../SmallerContent" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-textarea {
    $spacing: calc(utils.get-size-var("spacing", $size, $vars));
    $height: utils.get-size-var("height", $size, $vars);
    flex: 1;
    height: calc(2 * $height);
    min-height: $height;
    padding: $spacing;
    border-radius: utils.get-size-var("border-radius", $size, $vars);

    &::placeholder {
      color: var(--mcsl-text-color-gray);
      font-size: utils.get-size-var("font-size", $size, $vars);
    }
  }
}

.mcsl-textarea {
  margin: 0;
  background: var(--mcsl-bg-color-overlay);
  border: 1px solid var(--mcsl-border-color-base);
  outline: 0 solid transparent;
  outline-offset: -2px; // 覆盖 border
  resize: none;
  transition: 0.2s ease-in-out;
}

.mcsl-textarea__resizeable {
  resize: vertical;
  transition:
    0.2s ease-in-out,
    height 0s;
}

.mcsl-textarea:hover {
  box-shadow: var(--mcsl-box-shadow-light);
  border-color: var(--mcsl-border-color-dark);
}

.mcsl-textarea:focus {
  box-shadow: var(--mcsl-box-shadow-light);
  outline-color: var(--mcsl-textarea__color-light);
  outline-width: 2px;
  outline-offset: -1px;
}

.mcsl-textarea:hover:focus {
  box-shadow: var(--mcsl-box-shadow-base);
  outline-color: var(--mcsl-textarea__color);
}

.mcsl-textarea:disabled {
  cursor: not-allowed;
  border-color: var(--mcsl-border-color-dark);
  background: var(--mcsl-border-color-base);
  box-shadow: none;
}

.mcsl-textarea[aria-invalid="true"] {
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

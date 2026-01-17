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
  }>(),
  {
    size: "middle",
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

const formField = inject("mcsl-form-field", undefined) as
  | FormFieldData
  | undefined;

if (formField) {
  if (typeof formField.field.data.value != "boolean") {
    console.error(
      "[MCSL-UI] The type of the value for a <Switch> component is not boolean.",
    );
    throw new Error(
      "The type of the value for a <Switch> component is not boolean.",
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
      '--mcsl-switch__color': getColorVar(color),
      '--mcsl-switch__color-dark': new ColorData(color, 'dark').getCss(),
    }"
    class="mcsl-switch"
    type="checkbox"
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
@use "sass:map";
@use "../../../assets/css/utils";
@use "../../SmallerContent";

$vars: map.merge(
  SmallerContent.$vars,
  (
    "height": (
      "small": 1rem,
      "middle": 1.25rem,
      "large": 1.5rem,
    ),
  )
);

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-switch {
    $height: calc(utils.get-size-var("height", $size, $vars));
    width: calc($height * 1.75 + 2px); // 加上border宽度
    height: calc($height + 2px);
    font-size: utils.get-size-var("font-size", $size, $vars);

    &::before {
      width: calc($height - var(--mcsl-spacing-2xs));
      height: calc($height - var(--mcsl-spacing-2xs));
    }

    &:checked::before {
      left: calc(var(--mcsl-spacing-2xs) / 2 + $height * 0.75);
    }
  }
}

.mcsl-switch {
  cursor: pointer;
  margin: 0;
  appearance: none;
  border: 1px solid transparent;
  outline: 0 solid transparent;
  outline-offset: 2px;
  border-radius: var(--mcsl-border-radius-full);
  background: var(--mcsl-bg-color-darker);
  transform: translate(0);
  transition: 0.2s ease-in-out;

  &::before {
    content: "";
    position: absolute;
    top: calc(var(--mcsl-spacing-2xs) / 2);
    left: calc(var(--mcsl-spacing-2xs) / 2);
    background: var(--mcsl-bg-color-overlay);
    border-radius: var(--mcsl-border-radius-full);
    box-shadow: var(--mcsl-box-shadow-light);
    transition: 0.2s ease-in-out;
  }

  &:focus-visible {
    outline: 3px solid var(--mcsl-color-help);
  }
}

.mcsl-switch:hover {
  &::before {
    box-shadow: var(--mcsl-box-shadow-base);
  }
}

.mcsl-switch:checked {
  background: var(--mcsl-switch__color);
}

.mcsl-switch:hover:checked {
  background: var(--mcsl-switch__color-dark);
}

.mcsl-switch:disabled {
  cursor: not-allowed;
  background: var(--mcsl-border-color-base);
  box-shadow: none;

  &:checked {
    background: var(--mcsl-border-color-dark);
  }

  &::before {
    background: var(--mcsl-bg-color-dark);
  }
}

.mcsl-switch[aria-invalid="true"] {
  &,
  &:hover,
  &:checked,
  &:disabled {
    border-color: var(--mcsl-color-danger);
  }
}
</style>

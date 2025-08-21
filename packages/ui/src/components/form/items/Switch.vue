<script setup lang="ts">
import { inject, watch, withCtx } from "vue";
import type { FormItemData } from "../FormItem.vue";
import { ColorData, type ColorType, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/types.ts";
import { getSize } from "../../../utils/internal.ts";

const props = withDefaults(
  defineProps<{
    color?: ColorType;
    invalid?: boolean;
    disabled?: boolean;
    size?: Size;
  }>(),
  {
    color: "primary",
    invalid: false,
    disabled: false,
  },
);

defineEmits<{
  (e: "change", event: Event): void;
  (e: "input", event: Event): void;
  (e: "focus", event: Event): void;
  (e: "blur", event: Event): void;
}>();

const model = defineModel<boolean>({
  required: false,
  default: false,
});

const size: Size = withCtx(() => getSize(props.size))();

const formItem = inject("formItem", undefined) as FormItemData | undefined;

if (formItem) {
  if (typeof formItem.field.value.value != "boolean") {
    console.error(
      "[MCSL-UI] The type of the value for a <Checkbox> component is not boolean.",
    );
    throw new Error(
      "The type of the value for a <Checkbox> component is not boolean.",
    );
  }
  model.value = formItem?.field.value.value ?? model.value;
}

watch(model, (value) => {
  if (formItem) {
    formItem.field.value.value = formItem.parser(value);
  }
});
</script>

<template>
  <input
    class="mcsl-switch"
    :class="[`mcsl-size-${size}`]"
    :style="{
      '--mcsl-switch__color': getColorVar(color),
      '--mcsl-switch__color-dark': getColorVar(new ColorData(color, 'dark')),
    }"
    type="checkbox"
    :disabled="disabled"
    :aria-invalid="
      invalid || formItem?.field?.error?.value ? 'true' : undefined
    "
    @change="
      formItem?.validate('change');
      $emit('change', $event);
    "
    @blur="
      formItem?.validate('blur');
      $emit('blur', $event);
    "
    @input="$emit('input', $event)"
    @focus="$emit('focus', $event)"
    v-model="model"
  />
</template>

<style scoped lang="scss">
@use "sass:map";
@use "../../../assets/css/utils";
@use "../../SmallerPanelContent";

$vars: map.merge(
  SmallerPanelContent.$vars,
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
  box-shadow: var(--mcsl-box-shadow-lighter);

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

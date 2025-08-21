<script setup lang="ts">
import { inject, watch, withCtx } from "vue";
import type { FormItemData } from "../FormItem.vue";
import { ColorData, type ColorType, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/types.ts";
import { getSize } from "../../../utils/internal.ts";

const props = withDefaults(
  defineProps<{
    color?: ColorType;
    size?: Size;
  }>(),
  {
    color: "primary",
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
    class="mcsl-checkbox"
    :class="[`mcsl-size-${size}`]"
    :style="{
      '--mcsl-checkbox__color': getColorVar(color),
      '--mcsl-checkbox__color-dark': getColorVar(new ColorData(color, 'dark')),
    }"
    type="checkbox"
    :id="formItem?.id"
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
      "middle": 1.5rem,
      "large": 2rem,
    ),
  )
);

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-checkbox {
    $height: calc(utils.get-size-var("height", $size, $vars));
    width: calc($height * 1.75);
    height: $height;
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

.mcsl-checkbox {
  margin: 0;
  appearance: none;
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

.mcsl-checkbox:hover {
  &::before {
    box-shadow: var(--mcsl-box-shadow-base);
  }
}

.mcsl-checkbox:checked {
  background: var(--mcsl-checkbox__color);
}

.mcsl-checkbox:hover:checked {
  background: var(--mcsl-checkbox__color-dark);
}
</style>

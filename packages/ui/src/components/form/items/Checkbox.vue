<script setup lang="ts">
import { inject, watch, withCtx } from "vue";
import type { FormItemData } from "../FormItem.vue";
import { ColorData, type ColorType, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/types.ts";
import { getSize } from "../../../utils/internal.ts";

const props = withDefaults(
  defineProps<{
    icon?: string;
    color?: ColorType;
    size?: Size;
  }>(),
  {
    icon: "fas fa-check",
    color: "primary",
  },
);

defineEmits<{
  (e: "change", event: Event): void;
  (e: "input", event: Event): void;
  (e: "focus", event: Event): void;
  (e: "blur", event: Event): void;
}>();

const size: Size = withCtx(() => getSize(props.size))();

const model = defineModel<boolean>({
  required: false,
  default: false,
});

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
    :class="[`mcsl-size-${size}`, ...icon.split(' ')]"
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
@use "../../../assets/css/utils";
@use "../../SmallerPanelContent" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-checkbox {
    $spacing: utils.get-size-var("spacing", $size, $vars);
    border-radius: utils.get-size-var("border-radius", $size, $vars);
    padding: $spacing;
    font-size: utils.get-size-var("font-size", $size, $vars);

    &::before {
      width: calc($spacing * 2);
      height: calc($spacing * 2);
    }
  }
}

.mcsl-checkbox {
  margin: 0;
  appearance: none;
  border: 1px solid var(--mcsl-border-color-base);
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
</style>

<script setup lang="ts">
import { computed, inject, watch } from "vue";
import Button from "../../button/Button.vue";
import type { FormFieldData } from "../FormEntry.vue";
import { ColorData, type ColorType, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/utils.ts";

const props = withDefaults(
  defineProps<{
    color?: ColorType;
    invalid?: boolean;
    disabled?: boolean;
    size?: Size;
    placeholder?: string;
    clearable?: boolean;
    min?: string;
    max?: string;
  }>(),
  {
    size: "medium",
    color: "primary",
    invalid: false,
    disabled: false,
    placeholder: "",
    clearable: true,
    min: undefined,
    max: undefined,
  },
);

defineEmits<{
  (e: "input", event: Event): void;
  (e: "blur", event: Event): void;
  (e: "focus", event: Event): void;
}>();

const model = defineModel<string>({
  default: "",
});

const formField = inject("mcsl-form-field", undefined) as
  | FormFieldData
  | undefined;

if (formField) {
  model.value = formField.field.data.value ?? "";

  watch(formField.field.data, (value) => {
    if (value != model.value) model.value = value ?? "";
  });

  watch(model, (value) => {
    if (value != formField.field.data.value) formField.field.data.value = value;
  });
}

const showClearButton = computed(
  () => props.clearable && model.value.length > 0,
);
</script>

<template>
  <div class="mcsl-date-picker" :class="[`mcsl-size-${size}`]">
    <input
      v-model="model"
      :aria-invalid="
        invalid || formField?.field?.error?.value ? 'true' : undefined
      "
      :disabled="disabled"
      :id="formField?.id"
      :max="max"
      :min="min"
      :placeholder="placeholder"
      :style="{
        '--mcsl-date-picker__color-light': getColorVar(
          new ColorData(color, 'light'),
        ),
        '--mcsl-date-picker__color': getColorVar(color),
      }"
      type="date"
      @blur="
        $emit('blur', $event);
        formField?.onBlur($event);
      "
      @focus="
        $emit('focus', $event);
        formField?.onFocus($event);
      "
      @input="
        (event) => {
          $emit('input', event);
          formField?.onInput(event);
        }
      "
    />
    <Button
      v-if="showClearButton"
      class="mcsl-date-picker__clear"
      icon="fa fa-xmark"
      rounded
      size="small"
      type="text"
      @click="model = ''"
    />
  </div>
</template>

<style scoped lang="scss">
@use "../../../assets/css/utils";
@use "../../SmallerContent" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-date-picker {
    $spacing: calc(utils.get-size-var("spacing", $size, $vars));
    $height: utils.get-size-var("height", $size, $vars);

    & > input {
      height: $height;
      padding: $spacing;
      border-radius: utils.get-size-var("border-radius", $size, $vars);
      font-size: utils.get-size-var("font-size", $size, $vars);
    }
  }
}

.mcsl-date-picker {
  position: relative;
  flex: 1;
  min-width: 8rem;
}

.mcsl-date-picker > input {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  border: 1px solid var(--mcsl-border-color-base);
  background: var(--mcsl-bg-color-overlay);
  color: var(--mcsl-text-color-primary);
  outline: 0 solid transparent;
  outline-offset: -2px;
  transition:
    background-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    border-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    outline-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
}

.mcsl-date-picker > input:hover {
  border-color: var(--mcsl-border-color-dark);
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 94%, transparent);
}

.mcsl-date-picker > input:focus {
  outline-color: var(--mcsl-date-picker__color-light);
  outline-width: 2px;
  border-color: color-mix(
    in srgb,
    var(--mcsl-date-picker__color) 48%,
    var(--mcsl-border-color-base)
  );
}

.mcsl-date-picker > input:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.mcsl-date-picker > input[aria-invalid="true"] {
  border-color: var(--mcsl-color-danger);
}

.mcsl-date-picker__clear {
  position: absolute;
  top: 50%;
  right: var(--mcsl-spacing-2xs);
  transform: translateY(-50%);
}
</style>

<script lang="ts" setup>
import { computed, inject, watch } from "vue";
import type { FormFieldData } from "../FormEntry.vue";
import { ColorData, type ColorType, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/utils.ts";

const props = withDefaults(
  defineProps<{
    icon?: string;
    indeterminateIcon?: string;
    color?: ColorType;
    invalid?: boolean;
    disabled?: boolean;
    size?: Size;
    indeterminate?: boolean;
  }>(),
  {
    size: "medium",
    icon: "fas fa-check",
    indeterminateIcon: "fas fa-minus",
    color: "primary",
    invalid: false,
    disabled: false,
    indeterminate: false,
  },
);

defineEmits<{
  (e: "input", event: Event): void;
  (e: "blur", event: Event): void;
  (e: "focus", event: Event): void;
}>();

const model = defineModel<boolean | null>({
  required: false,
  default: false,
});

const formField = inject("mcsl-form-field", undefined) as
  | FormFieldData
  | undefined;

if (formField) {
  if (
    typeof formField.field.data.value != "boolean" &&
    formField.field.data.value !== null
  ) {
    console.error(
      "[MCSL-UI] The type of the value for a <Checkbox> component is not boolean or null.",
    );
    throw new Error(
      "The type of the value for a <Checkbox> component is not boolean or null.",
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

const isMixed = computed(() => props.indeterminate || model.value === null);
const actualIcon = computed(() => (isMixed.value ? props.indeterminateIcon : props.icon));

function nextValue() {
  if (props.disabled) return;
  if (isMixed.value) model.value = true;
  else model.value = !model.value;
}
</script>

<template>
  <label
    :class="[
      `mcsl-size-${size}`,
      {
        'mcsl-checkbox__checked': model === true,
        'mcsl-checkbox__mixed': isMixed,
        'mcsl-checkbox__disabled': disabled,
      },
    ]"
    :style="{
      '--mcsl-checkbox__color': getColorVar(color),
      '--mcsl-checkbox__color-dark': new ColorData(color, 'dark').getCss(),
    }"
    class="mcsl-checkbox"
  >
    <input
      :id="formField?.id"
      :aria-checked="isMixed ? 'mixed' : model ? 'true' : 'false'"
      :aria-invalid="
        invalid || formField?.field?.error?.value ? 'true' : undefined
      "
      :checked="model === true"
      :disabled="disabled"
      type="checkbox"
      @blur="
        $emit('blur', $event);
        formField?.onBlur($event);
      "
      @click.prevent="nextValue"
      @input="
        (e) => {
          $emit('input', e);
          formField?.onInput(e);
        }
      "
      @focus="
        $emit('focus', $event);
        formField?.onFocus($event);
      "
    />
    <span class="mcsl-checkbox__box">
      <i :class="actualIcon.split(' ')" />
    </span>
    <span v-if="$slots.default" class="mcsl-checkbox__label">
      <slot />
    </span>
  </label>
</template>

<style lang="scss" scoped>
@use "../../../assets/css/utils";
@use "../../SmallerContent" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-checkbox {
    $size-num: calc(utils.get-size-var("spacing", $size, $vars) * 2);
    gap: calc(utils.get-size-var("spacing", $size, $vars) * 0.65);
    font-size: utils.get-size-var("font-size", $size, $vars);

    .mcsl-checkbox__box {
      width: calc($size-num + 2px);
      height: calc($size-num + 2px);
      border-radius: utils.get-size-var("border-radius", $size, $vars);
    }
  }
}

.mcsl-checkbox {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin: 0;
  color: var(--mcsl-text-color-regular);
  user-select: none;

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  &:has(input:focus-visible) .mcsl-checkbox__box {
    outline: 3px solid color-mix(in srgb, var(--mcsl-color-help) 42%, transparent);
    outline-offset: 2px;
  }
}

.mcsl-checkbox__box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1px solid var(--mcsl-border-color-base);
  background:
    linear-gradient(
      to bottom,
      color-mix(in srgb, var(--mcsl-bg-color-overlay) 100%, transparent),
      color-mix(in srgb, var(--mcsl-bg-color-dark) 58%, transparent)
    );
  color: var(--mcsl-text-color-opposite);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--mcsl-bg-color-overlay) 72%, transparent);
  transition:
    border-color 0.14s ease-out,
    background-color 0.14s ease-out,
    box-shadow 0.14s ease-out,
    transform 0.14s ease-out;

  i {
    opacity: 0;
    transform: scale(0.72);
    transition:
      opacity 0.12s ease-out,
      transform 0.12s ease-out;
  }
}

.mcsl-checkbox:hover .mcsl-checkbox__box {
  border-color: var(--mcsl-border-color-dark);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--mcsl-bg-color-overlay) 72%, transparent),
    var(--mcsl-box-shadow-light);
}

.mcsl-checkbox__checked,
.mcsl-checkbox__mixed {
  .mcsl-checkbox__box {
    border-color: var(--mcsl-checkbox__color);
    background: linear-gradient(
      to bottom,
      var(--mcsl-checkbox__color),
      var(--mcsl-checkbox__color-dark)
    );
    box-shadow: var(--mcsl-box-shadow-lighter);

    i {
      opacity: 1;
      transform: scale(1);
    }
  }
}

.mcsl-checkbox__label {
  line-height: 1.45;
}

.mcsl-checkbox__disabled {
  cursor: not-allowed;
  color: var(--mcsl-text-color-secondary);

  .mcsl-checkbox__box {
    border-color: var(--mcsl-border-color-dark);
    background: var(--mcsl-border-color-base);
    box-shadow: none;
  }
}

.mcsl-checkbox:has(input[aria-invalid="true"]) {
  .mcsl-checkbox__box,
  &:hover .mcsl-checkbox__box {
    border-color: var(--mcsl-color-danger);
  }
}
</style>

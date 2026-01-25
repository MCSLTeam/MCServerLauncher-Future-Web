<script lang="ts" setup>
import { inject, ref, watch } from "vue";
import type { FormFieldData } from "../FormEntry.vue";
import { ColorData, type ColorType, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/utils.ts";
import Button from "../button/Button.vue";

withDefaults(
  defineProps<{
    color?: ColorType;
    invalid?: boolean;
    disabled?: boolean;
    size?: Size;
    placeholder?: string;
    password?: boolean;
    clearBtn?: boolean;
  }>(),
  {
    size: "medium",
    color: "primary",
    invalid: false,
    disabled: false,
    placeholder: "",
    password: false,
    clearBtn: false,
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

const showPassword = ref(false);

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
  <div class="mcsl-input mcsl-input-text" :class="[`mcsl-size-${size}`]">
    <input
      v-model="model"
      :aria-invalid="
        invalid || formField?.field?.error?.value ? 'true' : undefined
      "
      :id="formField?.id"
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
      :type="password && !showPassword ? 'password' : 'text'"
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
    <div v-if="clearBtn">
      <Button
        type="text"
        rounded
        size="small"
        icon="fa fa-xmark"
        @click="model = ''"
      />
    </div>
    <div v-else-if="password">
      <Button
        type="text"
        rounded
        size="small"
        :icon="showPassword ? 'fa fa-eye-slash' : 'fa fa-eye'"
        @click="showPassword = !showPassword"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "sass:map";
@use "../../../assets/css/utils";
@use "../../SmallerContent" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-input-text {
    $spacing: calc(utils.get-size-var("spacing", $size, $vars));
    $height: utils.get-size-var("height", $size, $vars);

    & > input {
      width: calc(100% - 2 * $spacing - 2px); // 减去border宽度
      height: calc($height - 2 * $spacing - 2px);
      padding: $spacing;
      border-radius: utils.get-size-var("border-radius", $size, $vars);
    }

    & > div {
      width: calc($height + 2px); // 加上border宽度
      height: calc($height + 2px);

      & > button {
        width: calc($height - $spacing);
        height: calc($height - $spacing);
      }
    }
  }
}

.mcsl-input-text {
  flex-grow: 1;
  transform: translate(0);
}

.mcsl-input-text > input {
  margin: 0;
  border: 1px solid var(--mcsl-border-color-base);
  outline: 0 solid transparent;
  outline-offset: -2px; // 覆盖 border
  transition: 0.2s ease-in-out;

  &::placeholder {
    color: var(--mcsl-text-color-gray);
  }
}

.mcsl-input-text > input:hover {
  box-shadow: var(--mcsl-box-shadow-light);
  border-color: var(--mcsl-border-color-dark);
}

.mcsl-input-text > input:focus {
  box-shadow: var(--mcsl-box-shadow-light);
  outline-color: var(--mcsl-input-text__color-light);
  outline-width: 2px;
  outline-offset: -1px;
}

.mcsl-input-text > input:hover:focus {
  box-shadow: var(--mcsl-box-shadow-base);
  outline-color: var(--mcsl-input-text__color);
}

.mcsl-input-text > input:disabled {
  cursor: not-allowed;
  border-color: var(--mcsl-border-color-dark);
  background: var(--mcsl-border-color-base);
  box-shadow: none;
}

.mcsl-input-text > input[aria-invalid="true"] {
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

.mcsl-input-text > div {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

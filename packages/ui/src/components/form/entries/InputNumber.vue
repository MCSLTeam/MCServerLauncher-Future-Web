<script lang="ts" setup>
import { inject, onMounted, onUnmounted, ref, watch } from "vue";
import type { FormFieldData } from "../FormEntry.vue";
import { ColorData, type ColorType, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/utils.ts";
import Button from "../../button/Button.vue";

const props = withDefaults(
  defineProps<{
    color?: ColorType;
    invalid?: boolean;
    disabled?: boolean;
    size?: Size;
    step?: number;
    min?: number;
    max?: number;
  }>(),
  {
    size: "medium",
    color: "primary",
    invalid: false,
    disabled: false,
    step: 1,
  },
);

defineEmits<{
  (e: "input", event: Event): void;
  (e: "blur", event: Event): void;
  (e: "focus", event: Event): void;
}>();

const model = defineModel<number>({
  required: false,
  default: 0,
});

const mouseDown = ref(false);
const addMouseOver = ref(false);
const subMouseOver = ref(false);

const formField = inject("mcsl-form-field", undefined) as
  | FormFieldData
  | undefined;

if (formField) {
  if (typeof formField.field.data.value != "number") {
    console.error(
      "[MCSL-UI] The type of the value for a <InputNumber> component is not number.",
    );
    throw new Error(
      "The type of the value for a <InputNumber> component is not number.",
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

function parseNumber(value: string) {
  const number = Number(value);
  return Number.isNaN(number) ? Math.max(props.min ?? 0, 0) : number;
}

function add() {
  model.value += props.step;
  if (props.max && model.value > props.max) model.value = props.max;
}

function sub() {
  model.value -= props.step;
  if (props.min && model.value < props.min) model.value = props.min;
}

let interval = -1;
let addStatus: "none" | "wait" | "add" = "none";
let subStatus: "none" | "wait" | "sub" = "none";

function handleMouseDown() {
  mouseDown.value = true;
}

function handleMouseUp() {
  mouseDown.value = false;
}

onMounted(() => {
  interval = setInterval(() => {
    if (mouseDown.value && addMouseOver.value) {
      if (addStatus == "none") {
        addStatus = "wait";
        setTimeout(() => {
          if (addStatus == "wait") addStatus = "add";
        }, 500);
      }
      if (addStatus == "add") {
        add();
      }
    } else {
      addStatus = "none";
    }

    if (mouseDown.value && subMouseOver.value) {
      if (subStatus == "none") {
        subStatus = "wait";
        setTimeout(() => {
          if (subStatus == "wait") subStatus = "sub";
        }, 500);
      }
      if (subStatus == "sub") {
        sub();
      }
    } else {
      subStatus = "none";
    }
  }, 50);

  window.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mouseup", handleMouseUp);
});

onUnmounted(() => {
  clearInterval(interval);
  window.removeEventListener("mousedown", handleMouseDown);
  window.removeEventListener("mouseup", handleMouseUp);
});
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
      type="number"
      @blur="
        $emit('blur', $event);
        formField?.onBlur($event);
      "
      @input="
        (e) => {
          $emit('input', e);
          if (formField) {
            formField.field.data.value = model = parseNumber(
              (e.currentTarget as HTMLInputElement).value,
            );
            formField.onInput(e);
          }
        }
      "
      @focus="
        $emit('focus', $event);
        formField?.onFocus($event);
      "
    />
    <div>
      <Button
        type="text"
        rounded
        size="small"
        icon="fa fa-minus"
        @mousedown="sub"
        @mouseenter="subMouseOver = true"
        @mouseleave="subMouseOver = false"
      />
      <Button
        type="text"
        rounded
        size="small"
        icon="fa fa-plus"
        @mousedown="add"
        @mouseenter="addMouseOver = true"
        @mouseleave="addMouseOver = false"
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
      height: $height;

      & > button {
        width: calc($height - $spacing);
        height: calc($height - $spacing);

        & * {
          font-size: var(--mcsl-font-size-sm);
        }
      }
    }
  }
}

.mcsl-input-text {
  flex: 1;
  transform: translate(0);
}

.mcsl-input-text > input {
  appearance: textfield; // mozilla hide arrows
  margin: 0;
  background: var(--mcsl-bg-color-overlay);
  border: 1px solid var(--mcsl-border-color-base);
  outline: 0 solid transparent;
  outline-offset: -2px; // 覆盖 border
  transition: 0.2s ease-in-out;

  &::-webkit-inner-spin-button, // webkit / chromium hide arrows
  &::-webkit-outer-spin-button {
    appearance: none;
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
  width: 4rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

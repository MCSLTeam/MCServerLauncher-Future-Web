<script lang="ts" setup>
import { computed, inject, ref, watch } from "vue";
import type { FormFieldData } from "../FormEntry.vue";
import { ColorData, type ColorType, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/utils.ts";
import Button from "../../button/Button.vue";

type ResizeMode = "none" | "vertical" | "horizontal" | "both";

const props = withDefaults(
  defineProps<{
    color?: ColorType;
    invalid?: boolean;
    disabled?: boolean;
    size?: Size;
    placeholder?: string;
    password?: boolean;
    clearable?: boolean;
    resizeable?: boolean;
    resizable?: boolean;
    resizeX?: boolean;
    resizeY?: boolean;
    resize?: ResizeMode;
  }>(),
  {
    size: "medium",
    color: "primary",
    invalid: false,
    disabled: false,
    placeholder: "",
    password: false,
    clearable: false,
    resizeable: false,
    resizable: false,
    resizeX: false,
    resizeY: false,
    resize: "none",
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
const showClearButton = computed(
  () => props.clearable && model.value.length > 0,
);
const showPasswordButton = computed(() => !props.clearable && props.password);
const resizeMode = computed<ResizeMode>(() => {
  if (props.resize !== "none") return props.resize;

  const x = props.resizeX || props.resizeable || props.resizable;
  const y = props.resizeY;

  if (x && y) return "both";
  if (x) return "horizontal";
  if (y) return "vertical";
  return "none";
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
  <div
    class="mcsl-input mcsl-input-text"
    :class="[
      `mcsl-size-${props.size}`,
      `mcsl-input-text__resize-${resizeMode}`,
    ]"
  >
    <input
      v-model="model"
      :aria-invalid="
        props.invalid || formField?.field?.error?.value ? 'true' : undefined
      "
      :id="formField?.id"
      :disabled="props.disabled"
      :style="{
        '--mcsl-input-text__color-light': getColorVar(
          new ColorData(props.color, 'light'),
        ),
        '--mcsl-input-text__color': getColorVar(props.color),
        '--mcsl-input-text__color-dark': getColorVar(
          new ColorData(props.color, 'dark'),
        ),
      }"
      :placeholder="props.placeholder"
      :type="props.password && !showPassword ? 'password' : 'text'"
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
    <div v-if="showClearButton">
      <Button
        type="text"
        rounded
        size="small"
        icon="fa fa-xmark"
        @click="model = ''"
      />
    </div>
    <div v-else-if="showPasswordButton">
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
      width: 100%;
      height: $height;
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

    &.mcsl-input-text__resize-vertical,
    &.mcsl-input-text__resize-both {
      height: $height;
      min-height: $height;

      & > input {
        height: 100%;
      }

      & > div {
        height: 100%;
      }
    }
  }
}

.mcsl-input-text {
  flex: 1;
  transform: translate(0);
  min-width: 8rem;
}

.mcsl-input-text__resize-horizontal,
.mcsl-input-text__resize-both {
  flex: 0 0 auto;
  width: min(100%, 18rem);
  max-width: 100%;
  min-width: 8rem;
}

.mcsl-input-text__resize-vertical,
.mcsl-input-text__resize-both {
  flex: 0 0 auto;
}

.mcsl-input-text__resize-horizontal,
.mcsl-input-text__resize-vertical,
.mcsl-input-text__resize-both {
  transition: none;
}

.mcsl-input-text__resize-horizontal {
  overflow: auto hidden;
  resize: horizontal;
}

.mcsl-input-text__resize-vertical {
  overflow: hidden auto;
  resize: vertical;
}

.mcsl-input-text__resize-both {
  overflow: auto;
  resize: both;
}

.mcsl-input-text > input {
  box-sizing: border-box;
  margin: 0;
  background: var(--mcsl-bg-color-overlay);
  border: 1px solid var(--mcsl-border-color-base);
  outline: 0 solid transparent;
  outline-offset: -2px; // 覆盖 border
  transition:
    background-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    border-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    outline-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard),
    box-shadow var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);

  &::placeholder {
    color: var(--mcsl-text-color-secondary);
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
  width: 2.25rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<script lang="ts" setup>
import { computed, inject, ref, watch } from "vue";
import type { FormFieldData } from "../FormEntry.vue";
import { ColorData, type ColorType, getColorVar } from "../../../utils/css.ts";
import type { Size } from "../../../utils/util.ts";
import DropdownMenu from "../../overlay/DropdownMenu.vue";
import type { SelectionItem } from "../../../utils/form.ts";

export type SelectionInfo =
  | {
      group: string;
      options: SelectionItem[];
    }[]
  | SelectionItem[];

const props = withDefaults(
  defineProps<{
    options: SelectionInfo;
    color?: ColorType;
    invalid?: boolean;
    disabled?: boolean;
    prefix?: string;
    suffix?: string;
    placeholder?: string;
    size?: Size;
  }>(),
  {
    size: "middle",
    color: "primary",
    invalid: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "input", event: Event): void;
  (e: "blur", event: Event): void;
  (e: "focus", event: Event): void;
}>();

const model = defineModel<any>({
  required: false,
  default: undefined,
});

const dropdownMenuRef = ref();

const formField = inject("mcsl-form-field", undefined) as
  | FormFieldData
  | undefined;

if (formField) {
  model.value = formField.field.data.value;
  watch(model, (value) => {
    formField.field.data.value = value;
  });
}

const allOptions = computed(() => {
  if ((props.options[0] as any).group) {
    return (props.options as any).flatMap(
      (group: { group: string; options: SelectionItem[] }) => group.options,
    );
  }
  return props.options as any;
});

const menu = computed(() => {
  if (props.options.length == 0) return [];
  if ((props.options[0] as any).group) {
    return (props.options as any).map(
      (group: { group: string; options: SelectionItem[] }) => ({
        group: group.group,
        items: group.options.map((item) => ({
          label: item.label ?? item.value,
          icon: item.icon,
          disabled: item.disabled,
          onClick: () => {
            model.value = item.value;
          },
        })),
      }),
    );
  }
  return (props.options as any).map((item: SelectionItem) => ({
    label: item.label ?? item.value,
    icon: item.icon,
    disabled: item.disabled,
    onClick: () => {
      model.value = item.value;
      dropdownMenuRef.value.close();
      const inputEvent = new Event("input");
      emit("input", inputEvent);
      formField?.onInput(inputEvent);
      const blurEvent = new Event("blur");
      emit("blur", blurEvent);
      formField?.onBlur(blurEvent);
      const focusEvent = new Event("focus");
      emit("focus", focusEvent);
      formField?.onFocus(focusEvent);
    },
  }));
});

function findLabel(value: any) {
  return allOptions.value.find((item: any) => item.value == value)?.label;
}
</script>

<template>
  <div class="mcsl-select">
    <DropdownMenu ref="dropdownMenuRef" :menu="menu" :size="size" follow-width>
      <template #header>
        <slot name="header" />
      </template>
      <template #triggerer="{ toggle, opened }">
        <button
          @click="toggle"
          :id="formField?.id"
          class="mcsl-select__btn"
          :class="[`mcsl-size-${size}`]"
          :style="{
            '--mcsl-select__btn-color-light': getColorVar(
              new ColorData(color, 'light'),
            ),
            '--mcsl-select__btn-color': getColorVar(color),
            '--mcsl-select__btn-color-dark': getColorVar(
              new ColorData(color, 'dark'),
            ),
          }"
          :disabled="disabled"
        >
          <span v-if="!model">{{ placeholder }}</span>
          <span v-else>
            <span v-if="model && prefix">{{ prefix }}</span>
            <span v-if="model">{{ findLabel(model) }}</span>
            <span v-if="model && suffix">{{ suffix }}</span>
          </span>
          <i class="fa fa-angle-down" :class="{ 'fa-rotate-180': opened }" />
        </button>
      </template>
    </DropdownMenu>
  </div>
</template>

<style lang="scss" scoped>
@use "sass:map";
@use "../../../assets/css/utils";
@use "../../SmallerContent" as *;

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-select__btn {
    $spacing: calc(utils.get-size-var("spacing", $size, $vars));

    height: utils.get-size-var("height", $size, $vars);
    padding: $spacing;
    border-radius: utils.get-size-var("border-radius", $size, $vars);

    &::placeholder {
      color: var(--mcsl-text-color-gray);
      font-size: utils.get-size-var("font-size", $size, $vars);
    }
  }
}

.mcsl-select {
  flex-grow: 1;
}

.mcsl-select__btn {
  width: 100%;
  margin: 0;
  background: var(--mcsl-bg-color-overlay);
  border: 1px solid var(--mcsl-border-color-base);
  outline: 0 solid transparent;
  outline-offset: -2px; // 覆盖 border
  transition: 0.2s ease-in-out;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--mcsl-spacing-2xs);

  & > i {
    transition: 0.2s ease-in-out;
  }

  & > span > span {
    color: var(--mcsl-text-color-secondary);
  }
}

.mcsl-select__btn:hover {
  box-shadow: var(--mcsl-box-shadow-light);
  border-color: var(--mcsl-border-color-dark);
}

.mcsl-select__btn:focus {
  box-shadow: var(--mcsl-box-shadow-light);
  outline-color: var(--mcsl-select__btn-color-light);
  outline-width: 2px;
  outline-offset: -1px;
}

.mcsl-select__btn:hover:focus {
  box-shadow: var(--mcsl-box-shadow-base);
  outline-color: var(--mcsl-select__btn-color);
}

.mcsl-select__btn:disabled {
  cursor: not-allowed;
  border-color: var(--mcsl-border-color-dark);
  background: var(--mcsl-border-color-base);
  box-shadow: none;
}

.mcsl-select__btn[aria-invalid="true"] {
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

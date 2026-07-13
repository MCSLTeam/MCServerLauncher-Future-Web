<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import DropdownContent from "../../overlay/DropdownContent.vue";
import InputText from "./InputText.vue";
import type { SelectionItem } from "../../../utils/form.ts";
import type { FormFieldData } from "../FormEntry.vue";
import type { ColorType } from "../../../utils/css.ts";
import type { Size } from "../../../utils/utils.ts";

const props = withDefaults(
  defineProps<{
    options: SelectionItem[];
    placeholder?: string;
    color?: ColorType;
    size?: Size;
    disabled?: boolean;
    invalid?: boolean;
    clearable?: boolean;
    filterMethod?: (query: string, option: SelectionItem) => boolean;
  }>(),
  {
    options: () => [],
    placeholder: "",
    color: "primary",
    size: "medium",
    disabled: false,
    invalid: false,
    clearable: true,
    filterMethod: undefined,
  },
);

const emit = defineEmits<{
  (e: "input", event: Event): void;
  (e: "blur", event: Event): void;
  (e: "focus", event: Event): void;
}>();

const model = defineModel<string>({
  default: "",
});

const dropdownRef = ref();
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

const filteredOptions = computed(() => {
  const query = model.value.trim().toLowerCase();
  if (!query) return props.options;
  return props.options.filter((option) => {
    if (props.filterMethod) return props.filterMethod(model.value, option);
    return [option.label, option.value]
      .filter((value) => value != null)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
});

function optionLabel(option: SelectionItem) {
  return String(option.label ?? option.value);
}

function selectOption(option: SelectionItem) {
  if (option.disabled) return;
  model.value = String(option.value);
  dropdownRef.value?.close();
  const event = new Event("input");
  emit("input", event);
  formField?.onInput(event);
}
</script>

<template>
  <DropdownContent ref="dropdownRef" class="mcsl-autocomplete">
    <template #triggerer="{ open }">
      <InputText
        v-model="model"
        :clearable="clearable"
        :color="color"
        :disabled="disabled"
        :invalid="invalid"
        :placeholder="placeholder"
        :size="size"
        @focus="
          (event) => {
            open();
            $emit('focus', event);
            formField?.onFocus(event);
          }
        "
        @blur="
          (event) => {
            $emit('blur', event);
            formField?.onBlur(event);
          }
        "
        @input="
          (event) => {
            open();
            $emit('input', event);
            formField?.onInput(event);
          }
        "
      />
    </template>
    <div
      class="mcsl-autocomplete__panel"
      :style="{
        width: dropdownRef?.triggererPos?.width
          ? `max(${dropdownRef.triggererPos.width}px, 14rem)`
          : '14rem',
      }"
    >
      <button
        v-for="option in filteredOptions"
        :key="String(option.value)"
        type="button"
        class="mcsl-autocomplete__option"
        :disabled="option.disabled"
        @click="selectOption(option)"
      >
        <i v-if="option.icon" :class="option.icon" />
        <span>{{ optionLabel(option) }}</span>
      </button>
      <div v-if="filteredOptions.length === 0" class="mcsl-autocomplete__empty">
        No matches
      </div>
    </div>
  </DropdownContent>
</template>

<style scoped lang="scss">
.mcsl-autocomplete {
  display: block;
  width: 100%;
}

.mcsl-autocomplete__panel {
  box-sizing: border-box;
  max-width: calc(100vw - 2 * var(--mcsl-spacing-md));
  max-height: 18rem;
  overflow: auto;
  padding: var(--mcsl-spacing-4xs);
  border: 1px solid var(--mcsl-border-color-base);
  border-radius: var(--mcsl-border-radius-sm);
  background: var(--mcsl-bg-color-overlay);
  box-shadow: var(--mcsl-box-shadow-base);
}

.mcsl-autocomplete__option {
  display: flex;
  align-items: center;
  width: 100%;
  gap: var(--mcsl-spacing-2xs);
  min-height: 2rem;
  padding: 0 var(--mcsl-spacing-xs);
  border: 0;
  border-radius: var(--mcsl-border-radius-sm);
  background: transparent;
  color: var(--mcsl-text-color-regular);
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--mcsl-motion-duration-fast)
      var(--mcsl-motion-ease-standard),
    color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
}

.mcsl-autocomplete__option:hover:not(:disabled) {
  background: color-mix(
    in srgb,
    var(--mcsl-color-primary) 9%,
    var(--mcsl-bg-color-overlay)
  );
  color: var(--mcsl-text-color-primary);
}

.mcsl-autocomplete__option:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.mcsl-autocomplete__empty {
  padding: var(--mcsl-spacing-sm);
  color: var(--mcsl-text-color-secondary);
  font-size: var(--mcsl-font-size-sm);
  text-align: center;
}
</style>

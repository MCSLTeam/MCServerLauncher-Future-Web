<script lang="ts" setup>
import { inject, watch } from "vue";
import type { FormFieldData } from "../FormEntry.vue";
import type { ColorType } from "../../../utils/css.ts";
import type { Size } from "../../../utils/utils.ts";
import type { SelectionItem } from "../../../utils/form.ts";
import Segmented from "./Segmented.vue";

const props = withDefaults(
  defineProps<{
    options: SelectionItem[];
    nullable?: boolean;
    multiple?: boolean;
    disabled?: boolean;
    color?: ColorType;
    invalid?: boolean;
    size?: Size;
  }>(),
  {
    size: "medium",
    color: "primary",
    nullable: false,
    multiple: false,
    disabled: false,
    invalid: false,
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

const formField = inject("mcsl-form-field", undefined) as
  | FormFieldData
  | undefined;

if (formField) {
  if (props.multiple && !Array.isArray(formField.field.data.value)) {
    console.error(
      '[MCSL-UI] The type of the value for a <SelectButton> component with `:multiple="true"` is not array.',
    );
    throw new Error(
      'The type of the value for a <SelectButton> component with `:multiple="true"` is not array.',
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
  <Segmented
    v-model="model"
    :options="options"
    :nullable="nullable"
    :multiple="multiple"
    :disabled="disabled"
    :color="color"
    :invalid="invalid"
    :size="size"
    @input="$emit('input', $event)"
    @blur="$emit('blur', $event)"
    @focus="$emit('focus', $event)"
  />
</template>

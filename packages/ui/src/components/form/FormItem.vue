<script lang="ts" setup>
import type { Size } from "../../utils/util.ts";
import FormEntry from "./FormEntry.vue";
import { createForm } from "../../utils/form.ts";
import * as yup from "yup";
import { computed, type ComputedRef, provide, watch } from "vue";

const props = defineProps<{
  schema?: yup.Schema;
  validationTrigger?: "input" | "blur";
  width?: number | "fit";
  labelPos?: "left" | "right" | "top";
  entryPos?: "left" | "right" | "center" | "full";
  size?: Size;
}>();

type EventData = {
  value: any;
  reset: () => void;
  validate: () => Promise<boolean>;
  error: ComputedRef<string | null>;
};

defineEmits<{
  (e: "input", data: EventData, event: Event): void;
  (e: "blur", data: EventData, event: Event): void;
  (e: "focus", data: EventData, event: Event): void;
  (e: "validated", data: EventData, event: Event): void;
}>();

const model = defineModel<any>({
  required: true,
});

const form = createForm(
  {
    value: model.value,
  },
  yup.object({
    value: props.schema ?? yup.mixed(),
  }),
  props.validationTrigger,
);

const field = form.__getField__("value");

watch(field.data, (value) => {
  if (value != model.value) model.value = value;
});

watch(model, (value) => {
  if (value != field.data.value) field.data.value = value;
});

const data = computed(() => ({
  value: field.data.value,
  reset: form.reset,
  validate: form.validate,
  error: field.error,
}));

provide("mcsl-form", form);

defineExpose({
  reset: form.reset,
  validate: form.validate,
  error: field.error,
});
</script>

<template>
  <FormEntry
    :label-pos="labelPos"
    :entry-pos="entryPos"
    :size="size"
    name="value"
    @blur="$emit('blur', data, $event)"
    @input="$emit('input', data, $event)"
    @focus="$emit('focus', data, $event)"
    @validated="$emit('validated', data, $event)"
  >
    <slot />
  </FormEntry>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
import { inject, provide, ref, watch, withCtx } from "vue";
import type { FormFieldInstance, FormInstance } from "../../utils/form.ts";
import Message from "../panel/Message.vue";
import type { Size } from "../../utils/types.ts";
import { getSize } from "../../utils/internal.ts";

export type FormFieldData = {
  id: string;
  field: FormFieldInstance;
  parser: (value: any) => any;
  onBlur: (event: Event) => Promise<void>;
  onChange: (event: Event) => Promise<void>;
  onFocus: (event: Event) => Promise<void>;
  onInput: (event: Event) => Promise<void>;
};

const props = withDefaults(
  defineProps<{
    name: string;
    width?: number | "fit";
    labelPos?: "left" | "right" | "top";
    parser?: (value: any) => any;
    size?: Size;
  }>(),
  {
    width: 100,
    labelPos: "top",
    parser: (value: any) => value,
  },
);

const emit = defineEmits<{
  (e: "change", event: Event): void;
  (e: "input", event: Event): void;
  (e: "blur", event: Event): void;
  (e: "focus", event: Event): void;
  (e: "validated", event: Event): void;
}>();

const size = withCtx(() => getSize(props.size))();

const id = Math.random().toString(36).slice(-8);

if (inject("formField", undefined) != undefined) {
  console.warn(
    "[MCSL-UI] A <FormEntry> component is nested inside another <FormEntry> component. This might cause unexpected issues.",
  );
}

const form = inject("form", undefined) as FormInstance<any> | undefined;

if (form == undefined) {
  console.error(
    "[MCSL-UI] A <FormEntry> component is not nested inside a <Form> component.",
  );
  throw new Error(
    "A <FormEntry> component is not nested inside a <Form> component",
  );
}

const field = form.__getField__(props.name);

if (field == undefined) {
  console.error(
    "[MCSL-UI] The name of a <FormEntry> component is not found in the form!",
  );
  throw new Error(
    "The name of a <FormEntry> component is not found in the form",
  );
}

// 错误消息延后0.2秒等Message收缩再消失

const errMsg = ref<string | null>(null);
let timeout = -1;

watch(field.error, (err) => {
  if (err != null) {
    errMsg.value = err;
    return;
  }
  const old = errMsg.value;
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    if (errMsg.value == old) errMsg.value = null;
  }, 200);
});

provide("formField", {
  id,
  field,
  parser: props.parser,
  async onBlur(event: Event) {
    emit("blur", event);
    if (form.validationTrigger == "blur") {
      await field.validate();
      emit("validated", event);
    }
  },
  async onChange(event: Event) {
    emit("change", event);
    if (form.validationTrigger == "change") {
      await field.validate();
      emit("validated", event);
    }
  },
  async onInput(event: Event) {
    emit("input", event);
    if (form.validationTrigger == "input") {
      await field.validate();
      emit("validated", event);
    }
  },
  async onFocus(event: Event) {
    emit("focus", event);
  },
});
</script>

<template>
  <div
    class="form-item"
    :class="[
      `mcsl-size-${size}`,
      `form-item__label-${labelPos}`,
      ...(width == 'fit' ? ['form-item__width-fit'] : []),
    ]"
    :style="{
      width: width != 'fit' ? `${width}%` : undefined,
    }"
  >
    <div>
      <label v-if="field.label" :for="id">{{ field.label }}</label>
      <slot />
    </div>
    <Message variant="text" :visible="field.error.value != null" color="danger">
      {{ errMsg }}
    </Message>
  </div>
</template>

<style scoped lang="scss">
.form-item {
  & > .mcsl-message {
    margin-top: var(--mcsl-spacing-2xs);
  }

  & > div {
    display: flex;
    gap: var(--mcsl-spacing-4xs);
  }
}

.form-item__width-fit {
  flex-grow: 1;
}

.form-item__label-top > div {
  flex-direction: column;
}

.form-item__label-top,
.form-item__label-left {
  & > div > label {
    order: 0;
  }
}

.form-item__label-right > div > label {
  order: 2;
}

.form-item__label-left,
.form-item__label-right {
  & > div {
    align-items: center;
  }
}
</style>

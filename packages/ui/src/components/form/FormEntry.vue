<script lang="ts" setup>
import { inject, provide, ref, watch } from "vue";
import type { FormFieldInstance, FormInstance } from "../../utils/form.ts";
import Message from "../panel/Message.vue";
import type { Size } from "../../utils/types.ts";
import { getSize } from "../../utils/internal.ts";

export type FormFieldData = {
  id: string;
  field: FormFieldInstance;
  onBlur: (event: Event) => Promise<void>;
  onFocus: (event: Event) => Promise<void>;
  onInput: (event: Event) => Promise<void>;
};

const props = withDefaults(
  defineProps<{
    name: string;
    width?: number | "fit";
    labelPos?: "left" | "right" | "top";
    size?: Size;
  }>(),
  {
    width: 100,
    labelPos: "top",
  },
);

const emit = defineEmits<{
  (e: "input", event: Event): void;
  (e: "blur", event: Event): void;
  (e: "focus", event: Event): void;
  (e: "validated", event: Event): void;
}>();

const size = getSize(props.size);

const id = Math.random().toString(36).slice(-8);

if (inject("mcsl-form-field", undefined) != undefined) {
  console.warn(
    "[MCSL-UI] A <FormEntry> component is nested inside another <FormEntry> component. This might cause unexpected issues.",
  );
}

const form = inject("mcsl-form", undefined) as FormInstance<any> | undefined;

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

provide("mcsl-form-field", {
  id,
  field,
  async onBlur(event: Event) {
    emit("blur", event);
    if (form.validationTrigger == "blur") {
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
    :class="[
      `mcsl-size-${size}`,
      `mcsl-form-entry__label-${labelPos}`,
      ...(width == 'fit' ? ['mcsl-form-entry__width-fit'] : []),
    ]"
    :style="{
      width: width != 'fit' ? `${width}%` : undefined,
    }"
    class="mcsl-form-entry"
  >
    <div>
      <label v-if="field.label" :for="id">{{ field.label }}</label>
      <slot />
    </div>
    <Message :visible="field.error.value != null" color="danger" variant="text">
      {{ errMsg }}
    </Message>
  </div>
</template>

<style lang="scss" scoped>
.mcsl-form-entry {
  & > .mcsl-message {
    margin-top: var(--mcsl-spacing-2xs);
  }

  & > div {
    display: flex;
    gap: var(--mcsl-spacing-4xs);
  }
}

.mcsl-form-entry__width-fit {
  flex-grow: 1;
}

.mcsl-form-entry__label-top > div {
  flex-direction: column;
}

.mcsl-form-entry__label-top,
.mcsl-form-entry__label-left {
  & > div > label {
    order: 0;
  }
}

.mcsl-form-entry__label-right > div > label {
  order: 2;
}

.mcsl-form-entry__label-left,
.mcsl-form-entry__label-right {
  & > div {
    align-items: center;
    & > label {
      width: var(--mcsl-form__label-width, auto);
    }
  }
}
</style>

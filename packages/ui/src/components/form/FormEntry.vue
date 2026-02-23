<script lang="ts" setup>
import { inject, provide, ref, watch } from "vue";
import type { FormFieldInstance, FormInstance } from "../../utils/form.ts";
import Message from "../misc/Message.vue";
import type { Size } from "../../utils/utils.ts";
import type { CSSSize } from "../../utils/css.ts";

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
    width?: string;
    showLabel?: boolean;
    labelPos?: "left" | "right" | "top";
    entryPos?: "left" | "right" | "center" | "full";
    gap?: CSSSize;
    size?: Size;
  }>(),
  {
    size: "medium",
    width: "100%",
    showLabel: true,
    labelPos: "left",
    entryPos: "right",
    gap: "xs",
  },
);

const emit = defineEmits<{
  (e: "input", event: Event): void;
  (e: "blur", event: Event): void;
  (e: "focus", event: Event): void;
  (e: "validated", event: Event): void;
}>();

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
  timeout = window.setTimeout(() => {
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
      `mcsl-form-entry__entry-${entryPos}`,
    ]"
    :style="{ width }"
    class="mcsl-form-entry"
  >
    <div :style="{ gap: `var(--mcsl-spacing-${gap})` }">
      <label v-if="showLabel && field.label" :for="id">{{ field.label }}</label>
      <div>
        <slot />
      </div>
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

    & > label {
      text-wrap: nowrap;
    }
  }
}

.mcsl-form-entry__width-fit {
  flex: 1;
}

.mcsl-form-entry__label-top > div {
  flex-direction: column;
}

.mcsl-form-entry > div > div {
  flex: 1;
  display: flex;
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

.mcsl-form-entry__entry-center > div > div {
  justify-content: center;
}

.mcsl-form-entry__entry-full > div > div {
  justify-content: stretch;
}

.mcsl-form-entry__entry-left > div > div {
  justify-content: flex-start;
}

.mcsl-form-entry__entry-right > div > div {
  justify-content: flex-end;
}

.mcsl-form-entry__label-left,
.mcsl-form-entry__label-right {
  & > div {
    align-items: center;
  }
}

.mcsl-form-entry__label-left {
  & > div > label {
    width: var(--mcsl-form__label-width-left, auto);
  }
}

.mcsl-form-entry__label-right {
  & > div > label {
    width: var(--mcsl-form__label-width-right, auto);
  }
}
</style>

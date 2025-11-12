<script lang="ts" setup>
import type { FormInstance } from "../../utils/form.ts";
import { inject, onMounted, onUpdated, provide, ref } from "vue";

const props = defineProps<{
  form: FormInstance<any>;
  title?: string;
  labelWidth?: string;
}>();

const emit = defineEmits<(e: "submit") => void>();

if (inject("mcsl-form", undefined) != undefined) {
  console.warn(
    "[MCSL-UI] A <Form> component is nested inside another <Form> component. This might cause unexpected issues.",
  );
}

provide("mcsl-form", props.form);

async function submit() {
  if (await props.form.validate()) emit("submit");
}

onMounted(() => {
  if (Object.keys(props.form.data.value).length > props.form.__fieldMap__.size)
    console.warn(
      "[MCSL-UI] Form fields aren't completely being read by form components. This might cause unexpected issues.",
    );
});

const formRef = ref<HTMLFormElement>();
const actualLabelWidth = ref("");

function refreshLabelWidth() {
  if (props.labelWidth) {
    actualLabelWidth.value = props.labelWidth;
    return;
  }
  if (!formRef.value) {
    actualLabelWidth.value = "auto";
    return;
  }

  // 自动对齐
  const children = formRef.value!.children;
  let max = 0;
  for (const obj of children) {
    if (
      obj.classList.contains("mcsl-form-entry__label-left") ||
      obj.classList.contains("mcsl-form-entry__label-right")
    ) {
      const width =
        obj.children[0]!.getElementsByTagName("label")[0]!.offsetWidth;
      if (width > max) max = width;
    }
  }
  actualLabelWidth.value = max + "px";
}

onMounted(() => {
  refreshLabelWidth();
});

onUpdated(() => {
  refreshLabelWidth();
});
</script>

<template>
  <form
    ref="formRef"
    class="mcsl-form"
    @submit.prevent="submit"
    :style="{
      '--mcsl-form__label-width': actualLabelWidth,
    }"
  >
    <div class="mcsl-form__title">
      <slot name="title">
        <h2 class="mcsl-form__title-default">{{ title }}</h2>
      </slot>
    </div>
    <slot />
  </form>
</template>

<style lang="scss" scoped>
.mcsl-form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mcsl-spacing-2xs);
}
</style>

<style lang="scss">
.mcsl-form > .mcsl-button[type="submit"] {
  margin-top: var(--mcsl-spacing-2xs);
}

.mcsl-form__title {
  width: 100%;
  margin-bottom: var(--mcsl-spacing-sm);
}

.mcsl-form__title-default {
  width: 100%;
  text-align: center;
  color: var(--mcsl-text-color-secondary);
  font-size: var(--mcsl-font-size-xl);
  font-weight: var(--mcsl-font-weight-base);
}
</style>

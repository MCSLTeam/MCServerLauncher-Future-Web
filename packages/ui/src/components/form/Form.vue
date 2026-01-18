<script lang="ts" setup>
import type { FormInstance } from "../../utils/form.ts";
import { inject, onMounted, onUpdated, provide, reactive, ref } from "vue";

const props = defineProps<{
  form: FormInstance<any>;
  title?: string;
  labelWidthLeft?: string;
  labelWidthRight?: string;
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
const actualLabelWidth = reactive({
  left: "",
  right: "",
});

function refreshLabelWidth() {
  if (props.labelWidthLeft) {
    actualLabelWidth.left = props.labelWidthLeft;
  }
  if (props.labelWidthRight) {
    actualLabelWidth.right = props.labelWidthRight;
  }
  if (!formRef.value) {
    actualLabelWidth.left = "auto";
    actualLabelWidth.right = "auto";
    return;
  }

  // 自动对齐
  const children = formRef.value!.children;
  let leftMax = 0;
  let rightMax = 0;
  for (const obj of children) {
    const width =
      obj.children[0]?.getElementsByTagName("label")?.[0]?.offsetWidth ?? 0;
    if (
      !props.labelWidthLeft &&
      obj.classList.contains("mcsl-form-entry__label-left") &&
      width > leftMax
    )
      leftMax = width;
    else if (
      !props.labelWidthRight &&
      obj.classList.contains("mcsl-form-entry__label-right") &&
      width > rightMax
    )
      rightMax = width;
  }
  actualLabelWidth.left = leftMax + "px";
  actualLabelWidth.right = rightMax + "px";
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
      '--mcsl-form__label-width-left': actualLabelWidth.left,
      '--mcsl-form__label-width-right': actualLabelWidth.right,
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

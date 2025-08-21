<script setup lang="ts">
import type { FormInstance } from "../../utils/form.ts";
import { inject, onMounted, provide } from "vue";

const props = defineProps<{
  form: FormInstance<any>;
}>();

const emit = defineEmits<{
  (e: "submit"): void;
}>();

if (inject("form", undefined) != undefined) {
  console.warn(
    "[MCSL-UI] A <Form> component is nested inside another <Form> component. This might cause unexpected issues.",
  );
}

provide("form", props.form);

async function submit() {
  if (await props.form.validate()) emit("submit");
}

onMounted(() => {
  if (Object.keys(props.form.value.value).length > props.form.__fieldMap__.size)
    console.warn(
      "[MCSL-UI] Form fields aren't completely being read by form components. This might cause unexpected issues.",
    );
});
</script>

<template>
  <form class="mcsl-form" @submit.prevent="submit">
    <slot />
  </form>
</template>

<style scoped lang="scss">
.mcsl-form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mcsl-spacing-2xs);
}
</style>

<script lang="ts" setup>
import { onMounted, watchEffect } from "vue";

const props = withDefaults(
  defineProps<{
    multiple?: boolean;
  }>(),
  {
    multiple: false,
  },
);

const active = defineModel<Array<string>>({
  default: () => [],
});

function activate(name: string) {
  active.value = [...active.value, name];
}

function deactivate(name: string) {
  active.value = active.value.filter((item) => item !== name);
}

function isActive(name: string) {
  return active.value.includes(name);
}

function toggle(name: string) {
  if (isActive(name)) {
    deactivate(name);
  } else {
    activate(name);
  }
}

function refresh() {
  const length = active.value.length;
  if (!props.multiple && length > 1) {
    active.value = [active.value[length - 1]!];
  }
}

onMounted(() => refresh());
watchEffect(() => refresh());

defineExpose({ activate, deactivate, isActive, toggle, active });
</script>

<template>
  <div class="mcsl-accordion">
    <slot />
  </div>
</template>

<style lang="scss" scoped></style>

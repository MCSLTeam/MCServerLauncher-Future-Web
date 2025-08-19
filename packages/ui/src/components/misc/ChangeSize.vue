<script setup lang="ts">
import type { Size } from "../../utils/types.ts";
import { provide } from "vue";
import { getSize } from "../../utils/internal.ts";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  size: Size;
}>();

provide("size", getSize(props.size));
</script>

<template>
  <slot />
</template>

<style scoped lang="scss"></style>

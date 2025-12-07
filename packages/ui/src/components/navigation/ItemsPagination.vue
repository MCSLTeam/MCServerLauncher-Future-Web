<script lang="ts" setup>
import type { Size } from "../../utils/types.ts";
import Pagination from "./Pagination.vue";

const props = withDefaults(
  defineProps<{
    itemPerPage: number;
    total: number;
    size?: Size;
  }>(),
  {
    size: "middle",
  },
);

const emit = defineEmits<(e: "change", newPage: number) => void>();

const page = defineModel<number>("page", {
  default: 1,
  validator(value: number, props: any): boolean {
    return value >= 1 && value <= Math.ceil(props.total / props.itemPerPage);
  },
});
</script>

<template>
  <Pagination
    v-model="page"
    :length="Math.ceil(props.total / props.itemPerPage)"
    :size="size"
    @change="emit('change', page)"
  />
</template>

<style lang="scss" scoped></style>

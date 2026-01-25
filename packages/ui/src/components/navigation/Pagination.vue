<script lang="ts" setup>
import { computed } from "vue";
import type { Size } from "../../utils/utils.ts";
import Button from "../form/button/Button.vue";

const props = withDefaults(
  defineProps<{
    length: number;
    size?: Size;
  }>(),
  {
    size: "medium",
  },
);

const emit = defineEmits<(e: "change", newPage: number) => void>();

const page = defineModel<number>("page", {
  default: 1,
  validator(value: number, props: any): boolean {
    return value >= 1 && value <= props.length;
  },
});

const visiblePages = computed(() => {
  // 6 页以内全部显示
  if (props.length <= 6)
    return Array.from({ length: props.length }, (_, i) => i + 1);

  // 6 页以上
  const pages: (number | "-")[] = [];
  // 第一页
  pages.push(1);
  // 前段省略
  if (page.value > 3) {
    pages.push("-");
  }
  // 中间
  let start = Math.max(2, page.value - 1);
  let end = Math.min(props.length - 1, page.value + 1);
  // 至少显示4页
  if (start == 2) end = 4;
  if (end == props.length - 1) start = props.length - 3;
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  // 后段省略
  if (page.value < props.length - 2) {
    pages.push("-");
  }
  // 最后一页
  pages.push(props.length);

  return pages;
});

function go(p: number) {
  if (p != page.value && p >= 1 && p <= props.length) {
    page.value = p;
    emit("change", p);
  }
}
</script>

<template>
  <nav :class="[`mcsl-size-${size}`]" class="mcsl-pagination">
    <Button
      v-if="page > 1"
      icon="fa fa-angle-left"
      rounded
      type="text"
      @click="go(page - 1)"
    />
    <template v-for="(p, index) in visiblePages" :key="index">
      <i v-if="p == '-'" class="fa fa-ellipsis" />
      <Button
        v-else
        :color="p == page ? 'primary' : 'surface'"
        :squared="p < 1000"
        :type="p == page ? 'primary' : 'text'"
        rounded
        @click="go(p)"
      >
        {{ p }}
      </Button>
    </template>
    <Button
      v-if="page < length"
      icon="fa fa-angle-right"
      rounded
      type="text"
      @click="go(page + 1)"
    />
  </nav>
</template>

<style lang="scss" scoped>
@use "../Content" as *;
@use "../../assets/css/utils";

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-pagination {
    gap: utils.get-size-var("spacing", $size, $vars);
  }
}

.mcsl-pagination {
  display: flex;
  justify-content: center;
  align-items: center;

  & > i {
    color: var(--mcsl-text-color-gray);
  }
}
</style>

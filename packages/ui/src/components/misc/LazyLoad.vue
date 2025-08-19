<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { throttle as throttleFunc } from "../../utils/util.ts";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    mode?:
      | "v-if"
      | "display-none"
      | "visibility-hidden"
      | "opacity-0"
      | "always-show";
    throttle?: number;
  }>(),
  {
    mode: "v-if",
    throttle: 10,
  },
);

export type ScrollInfo = {
  direction: "up" | "down";
  type: "in" | "out";
};

const emit = defineEmits<{
  (e: "update", info: ScrollInfo): void;
}>();

const wrapper = ref();
const visible = ref(false);

let direction: "up" | "down" = "down";
let lastY = 0;

const detectVisible = throttleFunc(() => {
  const rect = wrapper.value.getBoundingClientRect();
  if (!rect) {
    visible.value = false;
    return;
  }
  const { x, y, width, height } = rect;

  if (lastY < y) direction = "up";
  else direction = "down";
  lastY = y;

  visible.value =
    x + width > scrollX &&
    x < scrollX + innerWidth &&
    y + height > scrollY &&
    y < scrollY + innerHeight;
}, props.throttle);

watch(visible, (value) => {
  emit("update", {
    direction,
    type: value ? "in" : "out",
  });
});

const listenedElements: HTMLElement[] = [];

onMounted(() => {
  let el = wrapper.value;
  while (true) {
    el = el?.parentElement ?? undefined;
    if (!el) break;
    el.addEventListener("scroll", detectVisible);
    listenedElements.push(el);
  }
  detectVisible();
});

onUnmounted(() => {
  listenedElements.forEach((el) =>
    el.removeEventListener("scroll", detectVisible),
  );
});
</script>

<template>
  <div
    ref="wrapper"
    :style="{
      display: mode == 'display-none' && !visible ? 'none' : undefined,
      visibility:
        mode == 'visibility-hidden' && !visible ? 'hidden' : undefined,
      opacity: mode == 'opacity-0' && !visible ? 0 : undefined,
    }"
  >
    <slot v-if="mode != 'v-if' || visible" v-bind="$attrs" />
  </div>
</template>

<style scoped lang="scss"></style>

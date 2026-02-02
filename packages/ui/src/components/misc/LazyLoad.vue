<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { throttle as throttleFunc } from "../../utils/utils.ts";

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
    parent?: HTMLElement;
  }>(),
  {
    mode: "v-if",
    throttle: 10,
  },
);

const wrapper = ref();
const visible = ref(false);

let direction = ref<"up" | "down">("down");

const detectVisible = throttleFunc(() => {
  if (!wrapper.value) {
    visible.value = false;
    return;
  }
  const rect = wrapper.value.getBoundingClientRect();
  const pRect = mergeRect(
    document.body.getBoundingClientRect(),
    props.parent?.getBoundingClientRect(),
  );

  visible.value =
    rect.right > pRect.left &&
    rect.left < pRect.right &&
    rect.bottom > pRect.top &&
    rect.top < pRect.bottom;
}, props.throttle);

function mergeRect(rect1: DOMRect, rect2?: DOMRect) {
  if (!rect2) return rect1;
  return {
    left: Math.min(rect1.left, rect2.left),
    top: Math.min(rect1.top, rect2.top),
    right: Math.max(rect1.right, rect2.right),
    bottom: Math.max(rect1.bottom, rect2.bottom),
  };
}

const listenedElements: HTMLElement[] = [];
const elementLastScrollTops: number[] = [];

function onElementScroll(event: Event) {
  const el = event.target as HTMLElement;
  const lastScrollTop = elementLastScrollTops[listenedElements.indexOf(el)]!;
  if (lastScrollTop < el.scrollTop) direction.value = "down";
  else direction.value = "up";
  elementLastScrollTops[listenedElements.indexOf(el)] = el.scrollTop;
  detectVisible();
}

onMounted(() => {
  let el = wrapper.value;
  while (true) {
    el = el?.parentElement ?? undefined;
    if (!el) break;
    el.addEventListener("scroll", onElementScroll);
    listenedElements.push(el);
    elementLastScrollTops.push(el.scrollTop);
  }
  detectVisible();
});

onUnmounted(() => {
  listenedElements.forEach((el) =>
    el?.removeEventListener?.("scroll", onElementScroll),
  );
});

defineExpose({
  visible: computed(() => visible.value),
  direction: computed(() => direction.value),
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

<style lang="scss" scoped></style>

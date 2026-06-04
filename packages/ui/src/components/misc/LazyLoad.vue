<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from "vue";

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

const wrapper = ref<HTMLElement>();
const visible = ref(false);
const direction = ref<"up" | "down">("down");
let observer: IntersectionObserver | null = null;
let lastY = 0;

function fallbackDetectVisible() {
  if (!wrapper.value) {
    visible.value = false;
    return;
  }

  const rect = wrapper.value.getBoundingClientRect();
  visible.value =
    rect.right > 0 &&
    rect.left < window.innerWidth &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight;
}

onMounted(() => {
  if (!wrapper.value) return;

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        direction.value = entry.boundingClientRect.y < lastY ? "down" : "up";
        lastY = entry.boundingClientRect.y;
        visible.value = entry.isIntersecting;
      },
      {
        root: props.parent ?? null,
        threshold: 0,
      },
    );
    observer.observe(wrapper.value);
  } else {
    fallbackDetectVisible();
    window.addEventListener("scroll", fallbackDetectVisible, { passive: true });
    window.addEventListener("resize", fallbackDetectVisible);
  }
});

onUnmounted(() => {
  observer?.disconnect();
  window.removeEventListener("scroll", fallbackDetectVisible);
  window.removeEventListener("resize", fallbackDetectVisible);
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

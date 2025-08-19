<script setup lang="ts">
import {
  computed,
  type ComputedRef,
  nextTick,
  onUnmounted,
  type Ref,
  ref,
} from "vue";
import { animatedVisibilityExists } from "../../utils/internal.ts";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    locator: (
      openX: number,
      openY: number,
      elemX: Ref<number>,
      elemY: Ref<number>,
      elemRect: ComputedRef<DOMRect>,
    ) => void;
    transition?: boolean;
    inAnim?: string;
    outAnim?: string;
    closeOnClickOutside?: boolean;
    position?: "absolute" | "fixed";
  }>(),
  {
    transition: false,
    inAnim: "0.2s ease-in-out both fadeIn",
    outAnim: "0.2s ease-in-out both fadeOut",
    closeOnClickOutside: true,
    position: "absolute",
  },
);

const visible = ref(false);
const { exist, status } = animatedVisibilityExists(visible, 200, {
  afterShow: () => {
    window.addEventListener("click", handleClick);
  },
  beforeHide: () => {
    window.removeEventListener("click", handleClick);
  },
});
const wrapperEl = ref();
const rect = computed(() => {
  return {
    x: left.value,
    y: top.value,
    width: wrapperEl.value?.offsetWidth ?? 0,
    height: wrapperEl.value?.offsetHeight ?? 0,
  } as DOMRect;
});
const top = ref<number>(0);
const left = ref<number>(0);

function canFullyShow(axis: "x" | "y") {
  const elemPos = rect.value[axis];
  const elemLength = rect.value[axis == "x" ? "width" : "height"];
  const windowLength = axis == "x" ? innerWidth : innerHeight;
  return elemPos >= 0 && elemPos + elemLength <= windowLength;
}

async function open(x: number, y: number) {
  exist.value = true; // 渲染元素以定位
  await nextTick();
  locate(x, y);
  visible.value = true;
}

function locate(x: number, y: number) {
  props.locator(x, y, left, top, rect);
  if (props.position == "absolute") {
    left.value += scrollX;
    top.value += scrollY;
  }
}

function close() {
  visible.value = false;
}

function clickedOutside(event: MouseEvent) {
  return (
    event.clientX < rect.value.x ||
    event.clientX > rect.value.x + rect.value.width ||
    event.clientY < rect.value.y ||
    event.clientY > rect.value.y + rect.value.height
  );
}

function handleClick(event: MouseEvent) {
  if (
    visible.value &&
    props.closeOnClickOutside &&
    exist.value &&
    clickedOutside(event)
  ) {
    close();
  }
}

onUnmounted(() => {
  window.removeEventListener("click", handleClick);
});

defineExpose({
  open,
  close,
  locate,
  canFullyShow,
  clickedOutside,
  opened: computed(() => visible.value),
});
</script>

<template>
  <div
    v-if="exist"
    ref="wrapperEl"
    class="mcsl-floating-content"
    :class="{
      'mcsl-floating-content__visible': visible,
      'mcsl-floating-content__transition': status == 'show' && transition,
    }"
    :style="{
      top: `${top}px`,
      left: `${left}px`,
      position: position,
      animation:
        status == 'in' ? inAnim : status == 'out' ? outAnim : undefined,
    }"
  >
    <slot v-bind="$attrs" />
  </div>
</template>

<style scoped lang="scss">
.mcsl-floating-content {
  top: -9999px;
  left: -9999px;
  z-index: 5000;
}

.mcsl-floating-content__transition {
  transition: 0.1s ease-in-out;
}
</style>

<script lang="ts" setup>
import {
  computed,
  nextTick,
  onUnmounted,
  type Ref,
  ref,
  useAttrs,
} from "vue";
import { animatedVisibilityExists } from "../../utils/utils.ts";
import type { PosInfo } from "../../utils/utils.ts";

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
      posInfo: PosInfo,
    ) => void;
    transition?: boolean;
    inAnim?: string;
    outAnim?: string;
    closeOnClickOutside?: boolean;
    position?: "absolute" | "fixed";
  }>(),
  {
    transition: false,
    inAnim:
      "var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-enter) both mcsl-floating-in",
    outAnim:
      "var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-exit) both mcsl-floating-out",
    closeOnClickOutside: true,
    position: "absolute",
  },
);

const emit = defineEmits<(e: "close" | "open" | "locate") => void>();
const attrs = useAttrs();

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
const top = ref<number>(0);
const left = ref<number>(0);
const floatingClass = computed(() => [
  attrs.class,
  {
    'mcsl-floating-content__visible': visible.value,
    'mcsl-floating-content__transition':
      status.value == 'show' && props.transition,
  },
]);
const floatingStyle = computed(() => [
  attrs.style,
  {
    top: `${top.value}px`,
    left: `${left.value}px`,
    position: props.position,
    animation:
      status.value == 'in'
        ? props.inAnim
        : status.value == 'out'
          ? props.outAnim
          : undefined,
  },
]);

function getPosInfo() {
  return {
    x: left.value,
    y: top.value,
    width: wrapperEl.value?.offsetWidth ?? 0,
    height: wrapperEl.value?.offsetHeight ?? 0,
  };
}

function canFullyShow(axis: "x" | "y") {
  const posInfo = getPosInfo();
  const elemPos = posInfo[axis];
  const elemLength = posInfo[axis == "x" ? "width" : "height"];
  const windowLength = axis == "x" ? innerWidth : innerHeight;
  return elemPos >= 0 && elemPos + elemLength <= windowLength;
}

async function open(x: number, y: number) {
  emit("open");
  exist.value = true; // 渲染元素以定位
  await nextTick();
  locate(x, y);
  visible.value = true;
}

function locate(x: number, y: number) {
  emit("locate");
  props.locator(x, y, left, top, getPosInfo());
  if (props.position == "absolute") {
    left.value += scrollX;
    top.value += scrollY;
  }
}

function close() {
  visible.value = false;
  emit("close");
}

function clickedOutside(event: MouseEvent) {
  const rect = wrapperEl.value?.getBoundingClientRect();
  return (
    event.clientX < rect.x ||
    event.clientX > rect.x + rect.width ||
    event.clientY < rect.y ||
    event.clientY > rect.y + rect.height
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
    :class="floatingClass"
    :style="floatingStyle"
    class="mcsl-floating-content"
  >
    <slot v-bind="$attrs" />
  </div>
</template>

<style lang="scss" scoped>
.mcsl-floating-content {
  top: -9999px;
  left: -9999px;
  z-index: 900;
}

.mcsl-floating-content__transition {
  transition: var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
}
</style>

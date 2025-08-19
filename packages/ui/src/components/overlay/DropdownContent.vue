<script setup lang="ts">
import {
  computed,
  type ComputedRef,
  onMounted,
  onUnmounted,
  type Ref,
  ref,
} from "vue";
import { throttle } from "../../utils/util.ts";
import { clamp } from "@vueuse/core";
import FloatingContent from "./FloatingContent.vue";

const props = withDefaults(
  defineProps<{
    followWidth?: boolean;
    defaultPos?: "top" | "bottom";
  }>(),
  {
    followWidth: false,
    defaultPos: "bottom",
  },
);

const wrapperEl = ref();
const triggererEl = ref();
const floatingContentEl = ref();
const opened = computed(() => floatingContentEl.value?.opened.value);
const animType = ref<"top" | "bottom" | "fade">("fade");
const inAnim = computed(() => {
  switch (animType.value) {
    case "top":
      return "stretchInUp";
    case "bottom":
      return "stretchInDown";
    default:
      return "fadeIn";
  }
});

function locateX(
  openX: number,
  elemX: Ref<number>,
  elemRect: ComputedRef<DOMRect>,
) {
  elemX.value = clamp(
    openX - elemRect.value.width / 2,
    0,
    window.innerWidth - elemRect.value.width,
  );
}

function locateY(
  openY: number,
  elemY: Ref<number>,
  elemRect: ComputedRef<DOMRect>,
  triggererRect: DOMRect,
) {
  for (const p of [
    props.defaultPos,
    props.defaultPos == "top" ? "bottom" : "top",
  ]) {
    elemY.value =
      p == "top"
        ? openY - triggererRect.height / 2 - elemRect.value.height
        : openY + triggererRect.height / 2;
    animType.value = p as "top" | "bottom";
    if (floatingContentEl.value.canFullyShow("y")) return;
  }
}

function locator(
  openX: number,
  openY: number,
  elemX: Ref<number>,
  elemY: Ref<number>,
  elemRect: ComputedRef<DOMRect>,
) {
  const triggererRect = triggererEl.value.getBoundingClientRect();
  if (elemRect.value.width > innerWidth) elemX.value = 0;
  else locateX(openX, elemX, elemRect);
  if (elemRect.value.height > innerHeight) elemY.value = 0;
  else locateY(openY, elemY, elemRect, triggererRect);
}

function getOpenPos() {
  const rect = triggererEl.value.getBoundingClientRect();
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  return { x, y };
}

async function open() {
  const { x, y } = getOpenPos();
  animType.value = "fade";
  await floatingContentEl.value.open(x, y);
}

const relocate = throttle(() => {
  const { x, y } = getOpenPos();
  floatingContentEl.value.locate(x, y);
}, 10);

function close() {
  floatingContentEl.value.close();
}

function toggle() {
  if (opened.value) close();
  else open();
}

onMounted(() => {
  window.addEventListener("resize", relocate);
});

onUnmounted(() => {
  window.removeEventListener("resize", relocate);
});

defineExpose({
  open,
  close,
  toggle,
  opened,
  relocate,
});
</script>

<template>
  <div ref="wrapperEl" class="mcsl-dropdown-content">
    <div ref="triggererEl">
      <slot
        name="triggerer"
        :open="open"
        :close="close"
        :toggle="toggle"
        :opened="opened"
        :relocate="relocate"
      />
    </div>
    <FloatingContent
      position="absolute"
      :locator="locator"
      :in-anim="`0.2s ease-in-out both ${inAnim}`"
      :out-anim="`0.2s ease-in-out both reverse ${inAnim}`"
      ref="floatingContentEl"
      class="mcsl-dropdown-content__dropdown"
      :style="{
        '--mcsl-menu__width': followWidth
          ? `${triggererEl.value.getBoundingClientRect().width}px`
          : undefined,
      }"
    >
      <slot name="default" />
    </FloatingContent>
  </div>
</template>

<style lang="scss"></style>

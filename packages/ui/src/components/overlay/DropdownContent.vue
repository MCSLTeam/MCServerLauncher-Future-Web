<script lang="ts" setup>
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
    defaultPos?: "top" | "bottom" | "left" | "right";
  }>(),
  {
    defaultPos: "bottom",
  },
);

const wrapperEl = ref();
const triggererEl = ref();
const floatingContentEl = ref();
const opened = computed(() => floatingContentEl.value?.opened);
const isVertical = computed(
  () => props.defaultPos == "top" || props.defaultPos == "bottom",
);
const animType = ref<"top" | "bottom" | "left" | "right" | "fade">("fade");
const inAnim = computed(() => {
  switch (animType.value) {
    case "top":
      return "stretchInUp";
    case "bottom":
      return "stretchInDown";
    case "left":
      return "stretchInLeft";
    case "right":
      return "stretchInRight";
    default:
      return "fadeIn";
  }
});

function locateXVertical(
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

function locateYVertical(
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

function locateXHorizontal(
  openX: number,
  elemX: Ref<number>,
  elemRect: ComputedRef<DOMRect>,
  triggererRect: DOMRect,
) {
  for (const p of [
    props.defaultPos,
    props.defaultPos == "top" ? "bottom" : "top",
  ]) {
    elemX.value =
      p == "top"
        ? openX - triggererRect.width / 2 - elemRect.value.width
        : openX + triggererRect.width / 2;
    animType.value = p as "top" | "bottom";
    if (floatingContentEl.value.canFullyShow("y")) return;
  }
}

function locateYHorizontal(
  openY: number,
  elemY: Ref<number>,
  elemRect: ComputedRef<DOMRect>,
) {
  elemY.value = clamp(
    openY - elemRect.value.height / 2,
    0,
    window.innerHeight - elemRect.value.height,
  );
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
  else if (isVertical.value) locateXVertical(openX, elemX, elemRect);
  else locateXHorizontal(openX, elemX, elemRect, triggererRect);
  if (elemRect.value.height > innerHeight) elemY.value = 0;
  else if (isVertical.value)
    locateYVertical(openY, elemY, elemRect, triggererRect);
  else locateYHorizontal(openY, elemY, elemRect);
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
        :close="close"
        :open="open"
        :opened="opened"
        :relocate="relocate"
        :toggle="toggle"
        name="triggerer"
      />
    </div>
    <FloatingContent
      ref="floatingContentEl"
      :in-anim="`0.1s ease-in-out both ${inAnim}`"
      :locator="locator"
      :out-anim="`0.1s ease-in-out both reverse ${inAnim}`"
      class="mcsl-dropdown-content__dropdown"
      position="absolute"
    >
      <slot name="default" />
    </FloatingContent>
  </div>
</template>

<style lang="scss"></style>

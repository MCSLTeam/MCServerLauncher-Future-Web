<script lang="ts" setup>
import { computed, onMounted, onUnmounted, type Ref, ref } from "vue";
import { type PosInfo, throttle } from "../../utils/utils.ts";
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

defineEmits<(e: "close" | "open" | "locate") => void>();

const wrapperEl = ref();
const triggererEl = ref();
const floatingContentEl = ref();
const opened = computed(() => floatingContentEl.value?.opened);
const triggererOffsetParent = computed(() => triggererEl.value?.offsetParent);
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

function locateXVertical(openX: number, elemX: Ref<number>, posInfo: PosInfo) {
  elemX.value = clamp(
    openX - posInfo.width / 2,
    0,
    triggererOffsetParent.value.offsetWidth - posInfo.width,
  );
}

function locateYVertical(
  openY: number,
  elemY: Ref<number>,
  posInfo: PosInfo,
  triggererHeight: number,
) {
  for (const p of [
    props.defaultPos,
    props.defaultPos == "top" ? "bottom" : "top",
  ]) {
    elemY.value =
      p == "top"
        ? openY - triggererHeight / 2 - posInfo.height
        : openY + triggererHeight / 2;
    animType.value = p as "top" | "bottom";
    if (floatingContentEl.value.canFullyShow("y")) return;
  }
}

function locateXHorizontal(
  openX: number,
  elemX: Ref<number>,
  posInfo: PosInfo,
  triggererWidth: number,
) {
  for (const p of [
    props.defaultPos,
    props.defaultPos == "left" ? "right" : "left",
  ]) {
    elemX.value =
      p == "left"
        ? openX - triggererWidth / 2 - posInfo.width
        : openX + triggererWidth / 2;
    animType.value = p as "left" | "right";
    if (floatingContentEl.value.canFullyShow("x")) return;
  }
}

function locateYHorizontal(
  openY: number,
  elemY: Ref<number>,
  posInfo: PosInfo,
) {
  elemY.value = clamp(
    openY - posInfo.height / 2,
    0,
    triggererOffsetParent.value.offsetHeight - posInfo.height,
  );
}

function locator(
  openX: number,
  openY: number,
  elemX: Ref<number>,
  elemY: Ref<number>,
  posInfo: PosInfo,
) {
  if (posInfo.width > triggererOffsetParent.value.offsetWidth) elemX.value = 0;
  else if (isVertical.value) locateXVertical(openX, elemX, posInfo);
  else locateXHorizontal(openX, elemX, posInfo, triggererEl.value.offsetWidth);
  if (posInfo.height > triggererOffsetParent.value.offsetHeight)
    elemY.value = 0;
  else if (isVertical.value)
    locateYVertical(openY, elemY, posInfo, triggererEl.value.offsetHeight);
  else locateYHorizontal(openY, elemY, posInfo);
}

function getOpenPos() {
  const x = triggererEl.value.offsetLeft + triggererEl.value.offsetWidth / 2;
  const y = triggererEl.value.offsetTop + triggererEl.value.offsetHeight / 2;
  return { x, y };
}

async function open() {
  const { x, y } = getOpenPos();
  animType.value = "fade";
  await floatingContentEl.value.open(x, y);
}

const relocate = throttle(() => {
  if (!opened.value) return;
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
  triggererPos: computed(
    () => triggererEl.value.getBoundingClientRect() as PosInfo,
  ),
});
</script>

<template>
  <div ref="wrapperEl" class="mcsl-dropdown-content">
    <div ref="triggererEl" class="mcsl-dropdown-content__triggerer">
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
      @close="$emit('close')"
      @open="$emit('open')"
      @locate="$emit('locate')"
    >
      <slot name="default" />
    </FloatingContent>
  </div>
</template>

<style lang="scss">
.mcsl-dropdown-content__triggerer {
  height: 100%;
  width: 100%;
}
</style>

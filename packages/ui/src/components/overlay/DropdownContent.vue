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
const isVertical = computed(
  () => props.defaultPos == "top" || props.defaultPos == "bottom",
);
const animType = ref<"top" | "bottom" | "left" | "right" | "fade">("fade");
const floatingGap = 6;
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
  const triggererWidth = triggererEl.value.getBoundingClientRect().width;
  elemX.value = clamp(
    openX - triggererWidth / 2,
    0,
    innerWidth - posInfo.width,
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
        ? openY - triggererHeight / 2 - posInfo.height - floatingGap
        : openY + triggererHeight / 2 + floatingGap;
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
        ? openX - triggererWidth / 2 - posInfo.width - floatingGap
        : openX + triggererWidth / 2 + floatingGap;
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
    innerHeight - posInfo.height,
  );
}

function locator(
  openX: number,
  openY: number,
  elemX: Ref<number>,
  elemY: Ref<number>,
  posInfo: PosInfo,
) {
  if (posInfo.width > innerWidth) elemX.value = 0;
  else if (isVertical.value) locateXVertical(openX, elemX, posInfo);
  else
    locateXHorizontal(
      openX,
      elemX,
      posInfo,
      triggererEl.value.getBoundingClientRect().width,
    );
  if (posInfo.height > innerHeight)
    elemY.value = 0;
  else if (isVertical.value)
    locateYVertical(
      openY,
      elemY,
      posInfo,
      triggererEl.value.getBoundingClientRect().height,
    );
  else locateYHorizontal(openY, elemY, posInfo);
}

function getOpenPos() {
  const rect = triggererEl.value.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
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
  window.addEventListener("scroll", relocate, true);
});

onUnmounted(() => {
  window.removeEventListener("resize", relocate);
  window.removeEventListener("scroll", relocate, true);
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
    <Teleport to="body">
      <FloatingContent
        ref="floatingContentEl"
        :in-anim="`0.1s ease-in-out both ${inAnim}`"
        :locator="locator"
        :out-anim="`0.1s ease-in-out both reverse ${inAnim}`"
        class="mcsl-dropdown-content__dropdown"
        position="fixed"
        @close="$emit('close')"
        @open="$emit('open')"
        @locate="$emit('locate')"
      >
        <slot name="default" />
      </FloatingContent>
    </Teleport>
  </div>
</template>

<style lang="scss">
.mcsl-dropdown-content__triggerer {
  height: 100%;
  width: 100%;
}
</style>

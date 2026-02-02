<script lang="ts" setup>
import { type ComputedRef, onMounted, onUnmounted, type Ref, ref } from "vue";
import Menu from "../panel/Menu.vue";
import type { PosInfo } from "../../utils/utils.ts";
import FloatingContent from "./FloatingContent.vue";
import { setOpenContextmenu } from "../../utils/internal.ts";

defineOptions({
  inheritAttrs: false,
});

const floatingContentEl = ref();
const props = ref<any>({});

setOpenContextmenu((event, p) => {
  floatingContentEl.value.open(event.clientX, event.clientY);
  props.value = p;
});

function locateX(
  openX: number,
  elemX: Ref<number>,
  elemPos: ComputedRef<PosInfo>,
) {
  for (const pos of ["left", "right"]) {
    elemX.value = pos == "left" ? openX : openX - elemPos.value.width;
    if (floatingContentEl.value.canFullyShow("x")) return;
  }
}

function locateY(
  openY: number,
  elemY: Ref<number>,
  elemPos: ComputedRef<PosInfo>,
) {
  for (const pos of ["top", "bottom"]) {
    elemY.value = pos == "top" ? openY : openY - elemPos.value.height;
    if (floatingContentEl.value.canFullyShow("y")) return;
  }
}

function locator(
  openX: number,
  openY: number,
  elemX: Ref<number>,
  elemY: Ref<number>,
  elemPos: ComputedRef<PosInfo>,
) {
  if (elemPos.value.width > innerWidth) elemX.value = 0;
  else locateX(openX, elemX, elemPos);
  if (elemPos.value.height > innerHeight) elemY.value = 0;
  else locateY(openY, elemY, elemPos);
}

function onGlobalContextMenu(event: MouseEvent) {
  if (
    floatingContentEl.value.opened.value &&
    floatingContentEl.value.clickedOutside(event)
  )
    floatingContentEl.value.close();
}

onMounted(() => {
  document.addEventListener("contextmenu", onGlobalContextMenu);
});

onUnmounted(() => {
  document.removeEventListener("contextmenu", onGlobalContextMenu);
});
</script>

<template>
  <FloatingContent
    class="mcsl-contextmenu-overlay"
    ref="floatingContentEl"
    :locator="locator"
    transition
    :in-anim="props.inAnim"
    :out-anim="props.outAnim"
    :close-on-click-outside="true"
  >
    <Menu
      v-if="props.menu"
      :bodyClass="props.bodyClass"
      :bodyStyle="props.bodyStyle"
      :header="props.header"
      :header-class="props.headerClass"
      :header-divider="props.headerDivider"
      :header-style="props.headerStyle"
      :scrollable="props.scrollable"
      :menu="props.menu"
      :size="props.size"
      border
      shadow
      v-bind="$attrs"
      @click="floatingContentEl.close()"
    >
      <template #header>
        <slot name="header" />
      </template>
    </Menu>
  </FloatingContent>
</template>

<style lang="scss">
.mcsl-contextmenu-overlay {
  z-index: 10000;
}
</style>

<script lang="ts" setup>
import {
  type ComputedRef,
  onMounted,
  onUnmounted,
  type Ref,
  ref,
  watch,
} from "vue";
import Menu, { type MenuInfo } from "../panel/Menu.vue";
import { currContextmenu } from "../../utils/internal.ts";
import type { Size } from "../../utils/utils.ts";
import FloatingContent from "./FloatingContent.vue";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    menu: MenuInfo;
    parent?: HTMLElement | "global" | string;
    inAnim?: string;
    outAnim?: string;
    header?: string;
    headerDivider?: boolean;
    size?: Size;
    headerClass?: string;
    headerStyle?: string;
    bodyClass?: string;
    bodyStyle?: string;
    scrollable?: boolean;
  }>(),
  {
    size: "middle",
    inAnim: "fadeIn",
    outAnim: "fadeOut",
    headerClass: "",
    headerStyle: "",
    bodyClass: "",
    bodyStyle: "",
  },
);

const floatingContentEl = ref();
const wrapperEl = ref();

watch(currContextmenu, (value) => {
  if (value != floatingContentEl.value) floatingContentEl.value.close();
});

function handleContextMenu(event: MouseEvent) {
  if (floatingContentEl.value.clickedOutside(event)) {
    floatingContentEl.value.open(event.clientX, event.clientY);
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}

function locateX(
  openX: number,
  elemX: Ref<number>,
  elemRect: ComputedRef<DOMRect>,
) {
  for (const pos of ["left", "right"]) {
    elemX.value = pos == "left" ? openX : openX - elemRect.value.width;
    if (floatingContentEl.value.canFullyShow("x")) return;
  }
}

function locateY(
  openY: number,
  elemY: Ref<number>,
  elemRect: ComputedRef<DOMRect>,
) {
  for (const pos of ["top", "bottom"]) {
    elemY.value = pos == "top" ? openY : openY - elemRect.value.height;
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
  if (elemRect.value.width > innerWidth) elemX.value = 0;
  else locateX(openX, elemX, elemRect);
  if (elemRect.value.height > innerHeight) elemY.value = 0;
  else locateY(openY, elemY, elemRect);
}

let listenedElement: HTMLElement;

onMounted(() => {
  if (props.parent instanceof HTMLElement) {
    listenedElement = props.parent;
  } else if (props.parent) {
    if (props.parent == "global") {
      listenedElement = document.body;
    } else {
      listenedElement = document.querySelector(props.parent)!;
    }
  } else {
    listenedElement = wrapperEl.value.parentElement;
  }
  listenedElement.addEventListener("contextmenu", handleContextMenu);
});

onUnmounted(() => {
  listenedElement.removeEventListener("contextmenu", handleContextMenu);
});
</script>

<template>
  <div ref="wrapperEl" class="mcsl-contextmenu">
    <FloatingContent ref="floatingContentEl" :locator="locator" transition>
      <Menu
        :bodyClass="bodyClass"
        :bodyStyle="bodyStyle"
        :header="header"
        :header-class="headerClass"
        :header-divider="headerDivider"
        :header-style="headerStyle"
        :scrollable="scrollable"
        :menu="menu"
        :size="size"
        shadow
        v-bind="$attrs"
      >
        <template #header>
          <slot name="header" />
        </template>
      </Menu>
    </FloatingContent>
  </div>
</template>

<style lang="scss">
.mcsl-contextmenu > .mcsl-floating-content {
  z-index: 10000;
}
</style>

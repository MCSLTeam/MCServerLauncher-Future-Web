<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import { type MenuInfo } from "../panel/Menu.vue";
import type { Size } from "../../utils/utils.ts";
import { openContextmenu } from "../../utils/internal.ts";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
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
}>();

const wrapperEl = ref();

let listenedElement: HTMLElement;

function handleContextmenu(event: MouseEvent) {
  openContextmenu(event, props);
  event.preventDefault();
  event.stopImmediatePropagation();
}

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
  listenedElement.addEventListener("contextmenu", handleContextmenu);
});

onUnmounted(() => {
  listenedElement?.removeEventListener?.("contextmenu", handleContextmenu);
});
</script>

<template>
  <div ref="wrapperEl" class="mcsl-contextmenu"></div>
</template>

<style lang="scss"></style>

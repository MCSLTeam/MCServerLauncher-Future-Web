<script lang="ts" setup>
import Menu, { type MenuInfo } from "../panel/Menu.vue";
import type { Size } from "../../utils/utils.ts";
import DropdownContent from "./DropdownContent.vue";
import { ref } from "vue";

defineOptions({
  inheritAttrs: false,
});

withDefaults(
  defineProps<{
    menu: MenuInfo;
    followWidth?: boolean;
    defaultPos?: "top" | "bottom";
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
    size: "medium",
    followWidth: false,
    defaultPos: "bottom",
    headerClass: "",
    headerStyle: "",
    bodyClass: "",
    bodyStyle: "",
  },
);

const dropdownContentRef = ref();

defineExpose({
  open: () => dropdownContentRef.value?.open(),
  close: () => dropdownContentRef.value?.close(),
  toggle: () => dropdownContentRef.value?.toggle(),
  opened: () => dropdownContentRef.value?.opened,
  relocate: () => dropdownContentRef.value?.relocate(),
});
</script>

<template>
  <DropdownContent ref="dropdownContentRef" :default-pos="defaultPos">
    <template #triggerer="{ open, close, toggle, opened, relocate }">
      <slot
        name="triggerer"
        :close="close"
        :open="open"
        :opened="opened"
        :relocate="relocate"
        :toggle="toggle"
      />
    </template>
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
      class="mcsl-dropdown-menu__menu"
      :style="{
        width: followWidth
          ? `calc(${dropdownContentRef.triggererWidth}px - var(--mcsl-spacing-xs))`
          : undefined,
      }"
    >
      <template #header>
        <slot name="header" />
      </template>
    </Menu>
  </DropdownContent>
</template>

<style lang="scss">
.mcsl-dropdown-menu__menu {
  margin-top: 2px;
}

@keyframes mcsl-dropdown-menu__anim-top {
  from {
    scale: 1 0.5;
    opacity: 0;
    transform-origin: bottom;
  }
  to {
    scale: 1;
    opacity: 1;
    transform-origin: bottom;
  }
}

@keyframes mcsl-dropdown-menu__anim-bottom {
  0% {
    scale: 1 0.5;
    opacity: 0;
    transform-origin: top;
  }
  100% {
    scale: 1;
    opacity: 1;
    transform-origin: top;
  }
}
</style>

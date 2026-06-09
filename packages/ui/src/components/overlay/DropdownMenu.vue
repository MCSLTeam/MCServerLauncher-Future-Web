<script lang="ts" setup>
import Menu, { type MenuInfo } from "../panel/Menu.vue";
import type { Size } from "../../utils/utils.ts";
import DropdownContent from "./DropdownContent.vue";
import { computed, ref } from "vue";

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
    closeOnClickMenu?: boolean;
  }>(),
  {
    defaultPos: "bottom",
    closeOnClickMenu: true,
    headerDivider: true,
  },
);

defineEmits<(e: "close" | "open" | "locate") => void>();

const dropdownContentRef = ref();
const maxHeight = computed(() =>
  Math.max(
    dropdownContentRef.value.triggererPos.y,
    window.innerHeight -
      dropdownContentRef.value.triggererPos.y -
      dropdownContentRef.value.triggererPos.height,
  ),
);

defineExpose({
  open: () => dropdownContentRef.value?.open(),
  close: () => dropdownContentRef.value?.close(),
  toggle: () => dropdownContentRef.value?.toggle(),
  opened: () => dropdownContentRef.value?.opened,
  relocate: () => dropdownContentRef.value?.relocate(),
});
</script>

<template>
  <DropdownContent
    ref="dropdownContentRef"
    :default-pos="defaultPos"
    @close="$emit('close')"
    @open="$emit('open')"
    @locate="$emit('locate')"
  >
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
      scrollable
      :menu="menu"
      :size="size"
      shadow
      v-bind="$attrs"
      :class="[
        'mcsl-dropdown-menu__menu',
        {
          'mcsl-dropdown-menu__menu-fit-content': !followWidth,
        },
      ]"
      :style="{
        width: followWidth
          ? `max(calc(${dropdownContentRef.triggererPos.width}px - var(--mcsl-spacing-xs)), 12rem)`
          : undefined,
        maxWidth: followWidth
          ? undefined
          : 'calc(100vw - 2 * var(--mcsl-spacing-md))',
        maxHeight: `calc(${maxHeight}px - var(--mcsl-spacing-lg) - 2 * var(--mcsl-spacing-2xs))`,
      }"
      @click="
        () => {
          if (closeOnClickMenu) dropdownContentRef.close();
        }
      "
    >
      <template #header>
        <slot name="header" />
      </template>
    </Menu>
  </DropdownContent>
</template>

<style lang="scss">
.mcsl-dropdown-menu__menu {
  box-sizing: border-box;
}

.mcsl-dropdown-menu__menu-fit-content {
  min-width: 0 !important;
  width: max-content;

  &.mcsl-panel__scrollable > .mcsl-panel__body-wrapper {
    width: max-content;
    max-width: 100%;
  }

  &.mcsl-panel__scrollable > .mcsl-panel__body-wrapper > .mcsl-panel__body {
    width: max-content;
    max-width: 100%;
  }

  :is(.mcsl-menu__items, .mcsl-menu__group, .mcsl-divider) {
    width: max-content;
    max-width: 100%;
  }

  .mcsl-menu__items > .mcsl-button {
    width: max-content;
    min-width: 100%;
  }
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

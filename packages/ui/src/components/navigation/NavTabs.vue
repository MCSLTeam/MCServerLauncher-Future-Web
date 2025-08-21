<script setup lang="ts">
import { onMounted, ref, watchEffect } from "vue";
import { type RouteLocationRaw, useRouter } from "vue-router";
import { type Color, getColorVar } from "../../utils/css.ts";

type TabInfo = {
  label: string;
  link: RouteLocationRaw | string;
  disabled?: boolean;
  icon?: string;
  subpages?: string[];
};

const props = withDefaults(
  defineProps<{
    tabs: TabInfo[];
    variant?: Color;
  }>(),
  {
    variant: "primary",
  },
);

const activeTab = ref(0);

const tabRefs = ref<{ [key: number]: HTMLElement }>({});
const offsetLeft = ref(0);
const offsetWidth = ref(0);

watchEffect(updateBg);

function updateBg() {
  const tabElement = tabRefs.value[activeTab.value];
  if (!tabElement) return;
  offsetLeft.value = tabElement.offsetLeft;
  offsetWidth.value = tabElement.offsetWidth;
}

function switchTab(index: number) {
  activeTab.value = index;
  const info = props.tabs[index]!;
  useRouter().push(info.link);
}

onMounted(() => {
  updateBg();
});

defineExpose({
  switchTab,
});
</script>

<template>
  <div
    class="mcsl-tab__container"
    :style="{
      '--mcsl-tab__hover-bg': getColorVar(variant),
    }"
  >
    <slot name="contextmenu" />
    <button
      v-for="(info, index) in tabs"
      :key="index"
      :class="{ 'mcsl-tab__btn-active': activeTab === index }"
      ref="tabRefs"
      :disabled="info.disabled == true"
      @click="
        () => {
          switchTab(index);
        }
      "
    >
      <i v-if="info.icon" :class="info.icon" />
      {{ info.label }}
    </button>
    <div
      class="mcsl-tab__hover-bg"
      :style="{
        transform: `translateX(${offsetLeft}px)`,
        width: `${offsetWidth}px`,
      }"
    />
  </div>
</template>

<style scoped lang="scss">
$container-padding: var(--mcsl-spacing-2xs);

.mcsl-tab__container {
  width: fit-content;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--mcsl-spacing-4xs);
  padding: $container-padding;
  background: var(--mcsl-bg-color-overlay);
  border-radius: var(--mcsl-border-radius-full);
  box-shadow: var(--mcsl-box-shadow-base);
}

.mcsl-tab__container > button {
  z-index: 7;
  border: none;
  outline: 0 solid transparent;
  outline-offset: 1px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--mcsl-spacing-4xs);
  padding: var(--mcsl-spacing-2xs) var(--mcsl-spacing-md);
  border-radius: var(--mcsl-border-radius-full);
  background: transparent;
  cursor: pointer;
  transition: 0.2s ease-in-out;

  & > i {
    font-size: var(--mcsl-font-size-sm);
    transition: 0.2s ease-in-out;
  }

  &.mcsl-tab__btn-active,
  &.mcsl-tab__btn-active > i {
    color: var(--mcsl-text-color-opposite);
  }

  &:focus-visible {
    outline: 3px solid var(--mcsl-color-help);
  }

  &:disabled {
    z-index: 5;
    color: var(--mcsl-text-color-gray);
    cursor: not-allowed;
    background: var(--mcsl-bg-color-dark);
  }
}

.mcsl-tab__hover-bg {
  position: absolute;
  top: $container-padding;
  left: 0;
  z-index: 6;
  background: var(--mcsl-tab__hover-bg);
  height: calc(100% - 2 * $container-padding);
  border-radius: var(--mcsl-border-radius-full);
  transition: 0.2s ease-in-out;
}
</style>

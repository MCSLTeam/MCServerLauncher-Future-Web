<script lang="ts" setup>
import { onMounted, ref, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { type Color, getColorVar } from "../../utils/css.ts";
import { navigateTo, type PageNavigationInfo } from "../../utils/utils.ts";

const props = withDefaults(
  defineProps<{
    tabs: PageNavigationInfo[];
    color?: Color;
  }>(),
  {
    color: "primary",
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
  navigateTo(info);
}

watchEffect(() => {
  const path = useRouter().currentRoute.value.path;

  activeTab.value = props.tabs.findIndex(
    (tab) => tab.link === path || tab.isSubpage?.(path),
  );
});

onMounted(() => {
  updateBg();
});

defineExpose({
  switchTab,
});
</script>

<template>
  <div
    :style="{
      '--mcsl-tab__hover-bg': getColorVar(color),
    }"
    class="mcsl-tab__container"
  >
    <slot name="contextmenu" />
    <button
      v-for="(info, index) in tabs"
      :key="index"
      ref="tabRefs"
      :class="{ 'mcsl-tab__btn-active': activeTab === index }"
      :disabled="info.disabled"
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
      :style="{
        transform: `translateX(${offsetLeft}px)`,
        width: `${offsetWidth}px`,
      }"
      class="mcsl-tab__hover-bg"
    />
  </div>
</template>

<style lang="scss" scoped>
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

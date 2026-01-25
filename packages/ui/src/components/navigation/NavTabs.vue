<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { type Color, getColorVar } from "../../utils/css.ts";
import {
  navigateTo,
  type PageNavigationInfo,
  type Size,
} from "../../utils/utils.ts";

const props = withDefaults(
  defineProps<{
    tabs: PageNavigationInfo[];
    color?: Color;
    size?: Size;
    shadow?: "never" | "hover" | "always";
  }>(),
  {
    color: "primary",
    size: "medium",
    shadow: "never",
  },
);

const activeTab = ref(0);
const router = useRouter();

const tabRefs = ref<{ [key: number]: HTMLElement }>({});
const offsetLeft = ref(0);
const offsetWidth = ref(0);
const bgWidth = ref(0);

watchEffect(updateBg);

function updateBg() {
  const tabElement = tabRefs.value[activeTab.value];
  if (!tabElement) return;
  offsetLeft.value = tabElement.offsetLeft;
  offsetWidth.value = tabElement.offsetWidth;
  bgWidth.value = tabElement.parentElement!.scrollWidth;
}

function switchTab(index: number) {
  activeTab.value = index;
  const info = props.tabs[index]!;
  navigateTo(info, router);
}

watchEffect(() => {
  const path = router.currentRoute.value.path;

  activeTab.value = props.tabs.findIndex(
    (tab) => tab.link === path || tab.isSubpage?.(path),
  );
});

let interval = -1;

onMounted(() => {
  // 多刷新几遍（（（
  interval = window.setInterval(updateBg, 50);
  setTimeout(() => {
    clearInterval(interval);
  }, 1000);
});

onUnmounted(() => {
  clearInterval(interval);
});

defineExpose({
  switchTab,
});
</script>

<template>
  <div
    :style="{
      '--mcsl-nav-tabs__bg': getColorVar(color),
    }"
    class="mcsl-nav-tabs"
    :class="[`mcsl-size-${size}`, `mcsl-nav-tabs__shadow-${shadow}`]"
  >
    <slot name="contextmenu" />
    <div class="mcsl-nav-tabs__btns">
      <button
        v-for="(info, index) in tabs"
        :key="index"
        ref="tabRefs"
        :class="{ 'mcsl-nav-tabs__btn-active': activeTab === index }"
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
        class="mcsl-nav-tabs__bg"
        :style="{ '--mcsl-nav-tabs__btns-width': `${bgWidth}px` }"
      >
        <div
          :style="{
            '--mcsl-nav-tabs__bg-left': `${offsetLeft}px`,
            width: `${offsetWidth}px`,
          }"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../Content" as *;
@use "../../assets/css/utils";

@each $size in utils.$sizes {
  .mcsl-size-#{$size}.mcsl-nav-tabs {
    $padding: utils.get-size-var("spacing", $size, $vars);

    & > .mcsl-nav-tabs__btns {
      margin: $padding;
      & > button {
        padding: $padding calc($padding * 2);
      }
    }

    & .mcsl-nav-tabs__bg {
      width: calc(var(--mcsl-nav-tabs__btns-width) + $padding - 2px);
      height: calc(100% - 2 * $padding);
      margin: $padding;

      & > div {
        transform: translateX(calc(var(--mcsl-nav-tabs__bg-left) - $padding));
      }
    }
  }
}

.mcsl-nav-tabs {
  width: fit-content;
  position: relative;
  background: var(--mcsl-bg-color-overlay);
  border-radius: var(--mcsl-border-radius-full);
  border: 1px solid var(--mcsl-border-color-base);
  overflow: auto;
}

.mcsl-nav-tabs__shadow-always,
.mcsl-nav-tabs__shadow-hover:hover {
  box-shadow: var(--mcsl-box-shadow-base);
}

.mcsl-nav-tabs__btns {
  display: flex;
  align-items: center;
  gap: var(--mcsl-spacing-4xs);
}

.mcsl-nav-tabs__btns > button {
  z-index: 1;
  border: none;
  outline: 0 solid transparent;
  outline-offset: 1px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--mcsl-spacing-4xs);
  border-radius: var(--mcsl-border-radius-full);
  background: transparent;
  cursor: pointer;
  transition: 0.2s ease-in-out;

  & > i {
    font-size: var(--mcsl-font-size-sm);
    transition: 0.2s ease-in-out;
  }

  &.mcsl-nav-tabs__btn-active,
  &.mcsl-nav-tabs__btn-active > i {
    color: var(--mcsl-text-color-light);
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

.mcsl-nav-tabs__bg {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;

  & > div {
    background: var(--mcsl-nav-tabs__bg);
    height: 100%;
    border-radius: var(--mcsl-border-radius-full);
    transition: 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  }
}
</style>

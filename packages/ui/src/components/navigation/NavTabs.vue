<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ColorData, type ColorType, getColorVar } from "../../utils/css.ts";
import {
  navigateTo,
  type PageNavigationInfo,
  type Size,
} from "../../utils/utils.ts";

const props = withDefaults(
  defineProps<{
    tabs: PageNavigationInfo[];
    color?: ColorType;
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
let router: ReturnType<typeof useRouter> | undefined;
try {
  router = useRouter();
} catch {
  router = undefined;
}

const tabRefs = ref<{ [key: number]: HTMLElement }>({});
const offsetLeft = ref(0);
const offsetWidth = ref(0);
const bgWidth = ref(0);

function updateBg() {
  const tabElement = tabRefs.value[activeTab.value];
  if (!tabElement) return;
  offsetLeft.value = tabElement.offsetLeft;
  offsetWidth.value = tabElement.offsetWidth;
  bgWidth.value = tabElement.parentElement?.scrollWidth ?? 0;
}

function switchTab(index: number) {
  activeTab.value = index;
  const info = props.tabs[index]!;
  if (router) {
    navigateTo(info, router);
  } else {
    info.onClick?.();
  }
}

watch(activeTab, updateBg, { flush: "post" });
watch(
  () => props.tabs,
  () => updateBg(),
  { deep: true, flush: "post" },
);

if (router) {
  watch(
    () => router!.currentRoute.value.path,
    (path) => {
      const found = props.tabs.findIndex(
        (tab) => tab.link === path || tab.isSubpage?.(path),
      );
      activeTab.value = found >= 0 ? found : 0;
    },
    { immediate: true },
  );
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
    :style="{
      '--mcsl-nav-tabs__color': getColorVar(color),
      '--mcsl-nav-tabs__color-bg': new ColorData(
        color,
        'default',
        0.2,
      ).getCss(),
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
            '--mcsl-nav-tabs__bg-width': `${offsetWidth}px`,
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
    $padding: calc(utils.get-size-var("spacing", $size, $vars) * 0.55);

    & > .mcsl-nav-tabs__btns {
      margin: $padding;
      & > button {
        min-height: calc(utils.get-size-var("height", $size, $vars) * 0.72);
        padding: 0 calc($padding * 1.8);
      }
    }

    & .mcsl-nav-tabs__bg {
      width: calc(var(--mcsl-nav-tabs__btns-width) + $padding - 0.26px);
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
  max-width: 100%;
  position: relative;
  background: color-mix(in srgb, var(--mcsl-bg-color-overlay) 98%, transparent);
  border-radius: var(--mcsl-border-radius-sm);
  border: 1px solid color-mix(in srgb, var(--mcsl-border-color-base) 90%, transparent);
  overflow: auto hidden;
}

.mcsl-nav-tabs__shadow-always,
.mcsl-nav-tabs__shadow-hover:hover {
  box-shadow: var(--mcsl-box-shadow-light);
}

.mcsl-nav-tabs__btns {
  display: flex;
  align-items: center;
  gap: 2px;
}

.mcsl-nav-tabs__btns > button {
  z-index: 1;
  border: 1px solid transparent;
  outline: 0 solid transparent;
  outline-offset: 1px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--mcsl-spacing-4xs);
  border-radius: var(--mcsl-border-radius-sm);
  background: transparent;
  font-size: var(--mcsl-font-size-sm);
  line-height: 1;
  cursor: pointer;
  transition:
    background-color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard),
    border-color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard),
    color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);

  &:not(.mcsl-nav-tabs__btn-active):hover {
    border-color: color-mix(in srgb, var(--mcsl-border-color-base) 92%, transparent);
    background: color-mix(in srgb, var(--mcsl-bg-color-dark) 92%, transparent);
  }

  &:not(.mcsl-nav-tabs__btn-active):active {
    border-color: color-mix(in srgb, var(--mcsl-border-color-dark) 92%, transparent);
    background: color-mix(in srgb, var(--mcsl-bg-color-darker) 92%, transparent);
    transition-duration: var(--mcsl-motion-duration-instant);
  }

  & > i {
    font-size: var(--mcsl-font-size-sm);
    transition: color var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
  }

  &.mcsl-nav-tabs__btn-active {
    &,
    & > i {
      color: var(--mcsl-nav-tabs__color);
    }
  }

  &:focus-visible {
    outline: 3px solid var(--mcsl-color-help);
  }

  &:disabled {
    z-index: 5;
    color: var(--mcsl-text-color-secondary);
    cursor: not-allowed;
    background: var(--mcsl-bg-color-dark);
  }
}

.mcsl-nav-tabs__bg {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  border-radius: var(--mcsl-border-radius-sm);

  & > div {
    background: var(--mcsl-nav-tabs__color-bg);
    width: calc(var(--mcsl-nav-tabs__bg-width) - 2px);
    height: calc(100% - 2px);
    border: 1px solid color-mix(in srgb, var(--mcsl-nav-tabs__color) 22%, var(--mcsl-border-color-base));
    border-radius: var(--mcsl-border-radius-sm);
    transition: transform var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard), width var(--mcsl-motion-duration-fast) var(--mcsl-motion-ease-standard);
  }
}
</style>

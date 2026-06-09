<script setup lang="ts">
import {
  navigateTo,
  type PageNavigationInfo,
  type Size,
} from "../../utils/utils.ts";
import type { Color } from "../../utils/css.ts";
import Button from "../button/Button.vue";
import { useRouter } from "vue-router";
import { computed } from "vue";

let router: ReturnType<typeof useRouter> | undefined;
try {
  router = useRouter();
} catch {
  router = undefined;
}
const path = computed(() => router?.currentRoute.value.path ?? "");

withDefaults(
  defineProps<{
    pages: PageNavigationInfo[];
    collapsed?: boolean;
    color?: Color;
    size?: Size;
  }>(),
  {
    collapsed: false,
    color: "primary",
  },
);

function isActive(info: PageNavigationInfo) {
  return path.value == info.link || info.isSubpage?.(path.value);
}
</script>

<template>
  <div class="sidebar">
    <Button
      v-for="(info, index) in pages"
      :key="index"
      :disabled="info.disabled"
      class="sidebar__btn"
      :class="{
        'sidebar__btn-active': isActive(info) && !info.disabled,
        'sidebar__btn-collapsed': collapsed,
      }"
      :icon="info.icon"
      block
      type="text"
      align="left"
      :color="isActive(info) ? 'primary' : undefined"
      :size="size"
      v-tooltip.right="collapsed ? [info.label, info.description].filter(Boolean).join(' ') : undefined"
      @click="router ? navigateTo(info, router) : info.onClick?.()"
    >
      <span v-if="!collapsed" class="sidebar__label">
        <span class="sidebar__label-main">{{ info.label }}</span>
        <span v-if="info.description" class="sidebar__label-desc">{{ info.description }}</span>
      </span>
    </Button>
  </div>
</template>

<style scoped lang="scss">
@use "../../assets/css/utils";

.sidebar {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar__btn {
  min-height: 2.4rem;
  border-radius: calc(var(--mcsl-border-radius-sm) - 1px) !important;
  border: 1px solid transparent !important;
  transition:
    background-color 0.14s ease-out,
    border-color 0.14s ease-out,
    color 0.14s ease-out !important;
}

.sidebar__btn:hover:not(.sidebar__btn-active):not(:disabled) {
  background: color-mix(in srgb, var(--mcsl-bg-color-dark) 92%, transparent);
  border-color: color-mix(in srgb, var(--mcsl-border-color-base) 92%, transparent);
}

.sidebar__btn-active {
  background: color-mix(in srgb, var(--mcsl-color-primary) 10%, var(--mcsl-bg-color-overlay));
  border: 1px solid color-mix(in srgb, var(--mcsl-color-primary) 26%, var(--mcsl-border-color-base)) !important;
}

.sidebar__btn-collapsed {
  font-size: var(--mcsl-font-size-lg);
}

.sidebar__label {
  display: inline-flex;
  min-width: 0;
  align-items: baseline;
  gap: 7px;
}

.sidebar__label-main,
.sidebar__label-desc {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar__label-main {
  color: var(--mcsl-text-color-primary);
  font-weight: 500;
}

.sidebar__label-desc {
  color: var(--mcsl-text-color-secondary);
  font-size: 0.88em;
  font-weight: 400;
}

</style>

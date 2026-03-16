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

const router = useRouter();
const path = computed(() => router.currentRoute.value.path);

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
      v-tooltip.right="collapsed ? info.label : undefined"
      @click="navigateTo(info, router)"
    >
      <template v-if="!collapsed">{{ info.label }}</template>
    </Button>
  </div>
</template>

<style scoped lang="scss">
@use "../../assets/css/utils";

.sidebar {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar__btn {
  border-radius: var(--mcsl-border-radius-md) !important;
}

.sidebar__btn-active {
  background: utils.transparent(var(--mcsl-color-primary), 10%);
  border: 1px solid var(--mcsl-color-primary-lighter);
}

.sidebar__btn-collapsed {
  font-size: var(--mcsl-font-size-lg);
}
</style>

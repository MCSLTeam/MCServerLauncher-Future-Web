<script setup lang="ts">
import Sidebar from "../components/dashboard/Sidebar.vue";
import Breadcrumbs from "@repo/ui/src/components/navigation/Breadcrumbs.vue";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import { useLocalStorage } from "@vueuse/core";
import { windowButtonsExists, windowButtonTransition } from "../index.ts";
import { usePageData } from "../utils/stores.ts";
import router from "../router.ts";
import { useI18n } from "vue-i18n";
import { computed, ref } from "vue";
import { useScreenWidth } from "@repo/ui/src/utils/stores.ts";
import { animatedVisibilityExists } from "@repo/ui/src/utils/internal.ts";

const { t } = useI18n();
const sidebarCollapsedStorage = useLocalStorage("sidebarCollapsed", false);
const screenWidth = useScreenWidth();
const sidebarCollapsed = computed(
  () => sidebarCollapsedStorage.value || screenWidth.isXsOrSm,
);
const sidebarExpanded = ref(false);
const { exist: sidebarBg } = animatedVisibilityExists(sidebarExpanded, 300);
</script>

<template>
  <div
    class="dashboard"
    :class="{
      'dashboard__with-window-btn': windowButtonsExists,
      'dashboard__sidebar-collapsed': sidebarCollapsed,
    }"
  >
    <Sidebar
      :collapsed="sidebarCollapsed"
      :expanded="sidebarExpanded"
      :has-bg="sidebarBg"
    />
    <div
      :class="{
        'dashboard__sidebar-blocker-visible': sidebarExpanded,
      }"
      class="dashboard__sidebar-blocker"
      @click="() => (sidebarExpanded = false)"
    />
    <div class="dashboard__main">
      <div
        data-tauri-drag-region
        class="dashboard__nav"
        :style="{
          transition: `${windowButtonTransition}`,
        }"
      >
        <div>
          <Button
            v-if="screenWidth.isXsOrSm"
            type="text"
            icon="fa fa-bars"
            rounded
            size="small"
            v-tooltip="t('shared.navbar.expand-sidebar')"
            @click="sidebarExpanded = !sidebarExpanded"
          />
          <Button
            v-else
            type="text"
            :icon="`fa fa-angles-${sidebarCollapsed ? 'right' : 'left'}`"
            class="dashboard__collapse-btn"
            :class="{ 'dashboard__collapse-btn-collapsed': sidebarCollapsed }"
            rounded
            size="small"
            v-tooltip="t('shared.navbar.collapse-sidebar')"
            @click="sidebarCollapsedStorage = !sidebarCollapsedStorage"
          />
          <Button
            type="text"
            icon="fa fa-angle-left"
            rounded
            size="small"
            v-tooltip="t('shared.navbar.back')"
            @click="router.back"
          />
          <Button
            type="text"
            icon="fa fa-angle-right"
            rounded
            size="small"
            v-tooltip="t('shared.navbar.forward')"
            @click="router.forward"
          />
          <Breadcrumbs :items="usePageData().data.breadcrumbs" />
        </div>
        <div>
          <Button
            type="text"
            icon="fa fa-bell"
            rounded
            size="small"
            v-tooltip="t('shared.navbar.notifications')"
          />
          <Button
            type="text"
            icon="fa fa-brush"
            rounded
            size="small"
            v-tooltip="t('shared.navbar.customize')"
          />
          <Button
            type="text"
            icon="fa fa-user"
            rounded
            size="small"
            v-tooltip="t('shared.navbar.user-center')"
          />
        </div>
      </div>
      <div class="dashboard__content">
        <RouterView v-slot="{ Component }">
          <transition mode="out-in" name="fade" :duration="250">
            <component :is="Component" />
          </transition>
        </RouterView>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@repo/ui/src/assets/css/utils";
@use "@repo/ui/src/components/SmallerContent";

.dashboard {
  width: 100%;
  height: 100%;
  background: var(--mcsl-bg-color-overlay);
  overflow: hidden;
}

.dashboard__main {
  position: absolute;
  top: 0;
  right: 0;
  width: calc(100% - 16rem - var(--mcsl-spacing-lg));
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: 0.3s ease-in-out;

  .dashboard__sidebar-collapsed > & {
    width: calc(
      100% - utils.get-size-var("height", "large", SmallerContent.$vars) - var(
          --mcsl-spacing-lg
        )
    );
  }

  @media (max-width: 425px) {
    width: 100% !important;
  }
}

.dashboard__nav {
  padding: var(--mcsl-spacing-xl) var(--mcsl-spacing-md) 0
    var(--mcsl-spacing-md);
  height: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  & > div {
    display: flex;
    align-items: center;
    gap: var(--mcsl-spacing-2xs);
  }

  $btn-width: calc(
    var(--mcsl-font-size-md) * 1.5 + var(--mcsl-spacing-4xs) * 2
  );

  .dashboard__with-window-btn.dashboard__sidebar-collapsed & {
    // 右移
    transform: translateX($btn-width);
    width: calc(100% - 2 * var(--mcsl-spacing-md) - $btn-width);
  }

  @media (max-width: 425px) {
    // 右移
    $offset: calc(3 * $btn-width);
    transform: translateX($offset) !important;
    width: calc(100% - 2 * var(--mcsl-spacing-md) - $offset) !important;
  }

  @media (max-width: 768px) {
    .dashboard__with-window-btn & > div:first-child {
      gap: 0;
      & > nav {
        margin-left: var(--mcsl-spacing-md);
      }
    }
  }
}

.dashboard__content {
  margin: var(--mcsl-spacing-md);
  background: var(--mcsl-bg-color-main);
  border: 1px solid var(--mcsl-border-color-base);
  border-radius: var(--mcsl-border-radius-2xl);
  flex-grow: 1;
  padding: var(--mcsl-spacing-md);
  overflow: auto;
  height: calc(
    100% - var(--mcsl-spacing-xl) - 1rem - 4 * var(--mcsl-spacing-md)
  );
}

.dashboard__sidebar-blocker {
  z-index: 5;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transition: 0.3s ease-in-out;
}

.dashboard__sidebar-blocker-visible {
  pointer-events: all;
  background: utils.transparent(var(--mcsl-color-surface-darker), 50%);
}
</style>

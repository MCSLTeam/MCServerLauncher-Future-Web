<script setup lang="ts">
import Sidebar from "../components/dashboard/Sidebar.vue";
import Breadcrumbs from "@repo/ui/src/components/navigation/Breadcrumbs.vue";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import { useLocalStorage } from "@vueuse/core";
import { windowButtonsExists, windowButtonTransition } from "../index.ts";
import { usePageData } from "../utils/stores.ts";

const sidebarCollapsed = useLocalStorage("sidebarCollapsed", false);
</script>

<template>
  <div
    class="dashboard"
    :class="{ 'dashboard__with-window-btn': windowButtonsExists }"
  >
    <Sidebar :collapsed="sidebarCollapsed" />
    <div class="dashboard__main">
      <div
        class="dashboard__nav"
        :style="{
          transition: `${windowButtonTransition}`,
        }"
      >
        <div>
          <Button
            type="text"
            icon="fa fa-angles-left"
            rounded
            size="small"
            shadow="never"
            v-tooltip="'折叠侧边栏'"
          />
          <Button
            type="text"
            icon="fa fa-angle-left"
            rounded
            size="small"
            shadow="never"
            v-tooltip="'上一页'"
          />
          <Button
            type="text"
            icon="fa fa-angle-right"
            rounded
            size="small"
            shadow="never"
            v-tooltip="'下一页'"
          />
          <Breadcrumbs :items="usePageData().data.breadcrumbs" />
        </div>
        <div>
          <Button
            type="text"
            icon="fa fa-bell"
            rounded
            size="small"
            shadow="never"
            v-tooltip="'通知'"
          />
          <Button
            type="text"
            icon="fa fa-brush"
            rounded
            size="small"
            shadow="never"
            v-tooltip="'自定义界面'"
          />
          <Button
            type="text"
            icon="fa fa-user"
            rounded
            size="small"
            shadow="never"
            v-tooltip="'用户中心'"
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
.dashboard {
  width: 100%;
  height: 100%;
  display: flex;
  background: var(--mcsl-bg-color-overlay);
  overflow: hidden;
}

.dashboard__main {
  height: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.dashboard__nav {
  margin: var(--mcsl-spacing-xl) var(--mcsl-spacing-md);
  margin-bottom: 0;
  height: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  & > div {
    display: flex;
    align-items: center;
    gap: var(--mcsl-spacing-2xs);
  }
}

.dashboard__content {
  margin: var(--mcsl-spacing-md);
  background: var(--mcsl-bg-color-main);
  border: 1px solid var(--mcsl-border-color-base);
  border-radius: var(--mcsl-border-radius-2xl);
  flex-grow: 1;
  padding: var(--mcsl-spacing-md);
}

.dashboard__with-window-btn {
  .dashboard__nav {
    $btn-width: calc(
      var(--mcsl-font-size-md) * 1.5 + var(--mcsl-spacing-4xs) * 2
    );
    $left: calc(3 * $btn-width + var(--mcsl-spacing-md));
    transform: translateX(calc(-1 * $left));
    width: calc(100% - 2 * var(--mcsl-spacing-md) + $left);

    & > div:first-child {
      gap: 0;
      & > nav {
        margin-left: var(--mcsl-spacing-md);
      }
    }
  }
}
</style>

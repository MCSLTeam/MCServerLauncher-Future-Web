<script setup lang="ts">
import NotificationTemplate from "@repo/ui/src/components/overlay/notification/NotificationTemplate.vue";
import NotificationOverlay from "@repo/ui/src/components/overlay/notification/NotificationOverlay.vue";
import DashboardLayout from "./layouts/DashboardLayout.vue";
import SetupLayout from "./layouts/SetupLayout.vue";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import { computed } from "vue";
import { usePageData } from "./utils/stores.ts";
import LoadingOverlay from "./components/overlay/LoadingOverlay.vue";
import { useI18n } from "vue-i18n";

const layout = computed(() => {
  switch (usePageData().data.layout) {
    case "dashboard":
      return DashboardLayout;
    case "setup":
      return SetupLayout;
  }
  return undefined;
});

const t = useI18n().t;
</script>

<template>
  <component v-if="layout" :is="layout" />
  <RouterView v-else v-slot="{ Component }">
    <transition name="fade" mode="in-out" :duration="250">
      <component :is="Component" />
    </transition>
  </RouterView>
  <LoadingOverlay />
  <NotificationTemplate id="default">
    <template v-slot="notif">
      <p>{{ notif.settings.data.message }}</p>
    </template>
  </NotificationTemplate>
  <NotificationTemplate id="do-not-show-again">
    <template v-slot="notif">
      <div>
        <p>{{ notif.settings.data.message }}</p>
        <Button
          class="app__notif-btn"
          type="primary"
          :color="notif.settings.data.color"
          @click="
            () => {
              notif.settings.data.onClick();
              notif.close();
            }
          "
          size="small"
        >
          {{ t("ui.common.do-not-show-again") }}
        </Button>
      </div>
    </template>
  </NotificationTemplate>
  <NotificationOverlay />
</template>

<style scoped>
.app__notif-btn {
  margin: var(--mcsl-spacing-4xs) var(--mcsl-spacing-2xs) 0 auto;
}
</style>

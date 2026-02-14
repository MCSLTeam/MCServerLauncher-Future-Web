<script setup lang="ts">
import NotificationTemplate from "@repo/ui/src/components/overlay/notification/NotificationTemplate.vue";
import NotificationOverlay from "@repo/ui/src/components/overlay/notification/NotificationOverlay.vue";
import DashboardLayout from "./layouts/DashboardLayout.vue";
import SetupLayout from "./layouts/SetupLayout.vue";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import ContextmenuOverlay from "@repo/ui/src/components/overlay/ContextmenuOverlay.vue";
import { computed } from "vue";
import { usePageData } from "./utils/stores.ts";
import LoadingOverlay from "./components/overlay/LoadingOverlay.vue";
import { useI18n } from "vue-i18n";
import SelectInstallationTypeModal from "./components/createInstance/SelectInstallationTypeModal.vue";

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
  <RouterView v-else />
  <SelectInstallationTypeModal />
  <LoadingOverlay />
  <NotificationTemplate
    id="default"
    :props="
      (notif) => ({
        ...notif.settings.data,
        inAnim: '0.2s cubic-bezier(0.18, 0.89, 0.32, 1.13) both fadeInRight',
      })
    "
  >
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
  <ContextmenuOverlay />
</template>

<style scoped>
.app__notif-btn {
  margin: var(--mcsl-spacing-4xs) var(--mcsl-spacing-2xs) 0 auto;
}
</style>

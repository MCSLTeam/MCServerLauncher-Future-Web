<script setup lang="ts">
import NotificationTemplate from "@repo/ui/src/components/overlay/notification/NotificationTemplate.vue";
import NotificationOverlay from "@repo/ui/src/components/overlay/notification/NotificationOverlay.vue";
import DashboardLayout from "./layouts/DashboardLayout.vue";
import SetupLayout from "./layouts/SetupLayout.vue";
import { computed } from "vue";
import { usePageData } from "./utils/stores.ts";
import LoadingOverlay from "./components/LoadingOverlay.vue";

const layout = computed(() => {
  switch (usePageData().data.layout) {
    case "dashboard":
      return DashboardLayout;
    case "setup":
      return SetupLayout;
  }
  return undefined;
});
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
    <template v-slot="data">
      <p>{{ (data as any).message }}</p>
    </template>
  </NotificationTemplate>
  <NotificationOverlay />
</template>

<style scoped></style>

<script setup lang="ts">
import { useNavigation, usePageData } from "../../utils/stores.ts";
import { useI18n } from "vue-i18n";
import NavTabs from "@repo/ui/src/components/navigation/NavTabs.vue";
import { MCSLNotif } from "@repo/ui/src/utils/notifications.ts";
import { provide } from "vue";

const t = useI18n().t;

usePageData().set({
  layout: "dashboard",
  breadcrumbs: [
    {
      label: t("shared.settings.title"),
      path: "/settings",
    },
  ],
});

function requireRestart() {
  new MCSLNotif({
    data: {
      color: "warning",
      title: t("ui.notification.title.warning"),
      message: t("shared.settings.require-reload"),
    },
  }).open();
}

provide("requireRestart", requireRestart);
</script>

<template>
  <div class="settings">
    <NavTabs :tabs="useNavigation().get('settings').value" />
    <div class="settings__content">
      <RouterView v-slot="{ Component }">
        <transition mode="out-in" name="fade" :duration="250">
          <component :is="Component" />
        </transition>
      </RouterView>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-md);
}

.settings__content {
  height: 0;
  flex-grow: 1;
  overflow: hidden auto;
}
</style>

<style>
.settings__content > .settings__section {
  display: flex;
  flex-direction: column;
  gap: var(--mcsl-spacing-2xs);
}
</style>

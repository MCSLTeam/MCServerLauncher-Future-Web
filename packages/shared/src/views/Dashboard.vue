<script setup lang="ts">
import { usePageData } from "../utils/stores.ts";
import { useI18n } from "vue-i18n";
import { getExecutableType } from "../utils/node/types/instanceInstallationType.ts";
import { MCSLNotif } from "@repo/ui/src/utils/notifications.ts";

usePageData().set({
  layout: "dashboard",
  breadcrumbs: [
    {
      label: useI18n().t("shared.dashboard.title"),
      path: "/dashboard",
    },
  ],
});

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const content = await file.arrayBuffer();
    const executableType = await getExecutableType(file.type, content);
    new MCSLNotif({
      data: {
        title: "核心检测结果",
        message: executableType,
      },
    }).open();
  }
}
</script>

<template>
  <input
    type="file"
    @change="handleFileChange"
    placeholder="选择核心文件以检测"
  />
</template>

<style scoped lang="scss"></style>

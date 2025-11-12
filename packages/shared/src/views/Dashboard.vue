<script setup lang="ts">
import DashboardLayout from "../layouts/DashboardLayout.vue";
import { usePageData } from "../utils/stores.ts";
import { useI18n } from "vue-i18n";

usePageData().set({
  breadcrumbs: [
    {
      label: useI18n().t("shared.dashboard.title"),
      path: "/",
    },
  ],
});
</script>

<template>
  <DashboardLayout> </DashboardLayout>
</template>

<style scoped lang="scss"></style>

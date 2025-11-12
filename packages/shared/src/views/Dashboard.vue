<script setup lang="ts">
import DashboardLayout from "../layouts/DashboardLayout.vue";
import { usePageData } from "../utils/stores.ts";
import { useI18n } from "vue-i18n";
import Button from "@repo/ui/src/components/form/button/Button.vue";
import axios from "axios";

usePageData().set({
  breadcrumbs: [
    {
      label: useI18n().t("shared.dashboard.title"),
      path: "/",
    },
  ],
});

async function fetchApi() {
  console.log(await axios.get("/api/"));
}
</script>

<template>
  <DashboardLayout>
    <Button @click="fetchApi"> 发送请求 </Button>
  </DashboardLayout>
</template>

<style scoped lang="scss"></style>

<script setup lang="ts">
import { usePageData } from "../utils/stores.ts";
import { useI18n } from "vue-i18n";

usePageData().set({
  layout: "dashboard",
  breadcrumbs: [
    {
      label: useI18n().t("shared.nodes.title"),
      path: "/nodes",
    },
  ],
});
</script>

<template></template>

<style scoped lang="scss"></style>

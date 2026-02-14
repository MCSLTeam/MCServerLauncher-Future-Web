<script setup lang="ts">
import { usePageData } from "../../utils/stores.ts";
import { useI18n } from "vue-i18n";

const t = useI18n().t;
usePageData().set({
  breadcrumbs: [
    {
      label: t("shared.create-instance.title"),
    },
    {
      label: t("shared.create-instance.type.script.title"),
      path: "/create-instance/script",
    },
  ],
  layout: "dashboard",
});
</script>

<template></template>

<style scoped lang="scss"></style>

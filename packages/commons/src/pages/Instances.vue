<script lang="ts" setup>
import Page from "../components/page/Page.vue";
import { useI18n } from "vue-i18n";
</script>

<template>
  <Page>
    <template #breadcrumb>
      <ElBreadcrumbItem>
        {{ useI18n().t("sidebar.instances") }}
      </ElBreadcrumbItem>
    </template>
  </Page>
</template>

<style scoped></style>

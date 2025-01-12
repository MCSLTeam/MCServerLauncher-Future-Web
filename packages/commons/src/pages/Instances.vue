<script lang="ts" setup>
import Page from "../components/page/Page.vue";
</script>

<template>
  <Page>
    <template #breadcrumb>
      <ElBreadcrumbItem>
        {{ $t("sidebar.instances") }}
      </ElBreadcrumbItem>
    </template>
  </Page>
</template>

<style scoped></style>

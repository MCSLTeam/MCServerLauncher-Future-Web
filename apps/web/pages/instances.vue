<script lang="ts" setup>
import Instances from "@repo/commons/src/pages/Instances.vue";

useHead({
  title: useI18n().t('sidebar.instances'),
});
</script>

<template>
  <Instances/>
</template>

<style scoped></style>

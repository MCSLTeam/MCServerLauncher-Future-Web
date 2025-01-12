<script lang="ts" setup>
import Home from "@repo/commons/src/pages/Home.vue";

useHead({
  title: useI18n().t('sidebar.home'),
});
</script>

<template>
  <Home/>
</template>

<style scoped>

</style>
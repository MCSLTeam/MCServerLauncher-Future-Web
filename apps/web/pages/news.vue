<script lang="ts" setup>
import News from "@repo/commons/src/pages/News.vue";

useHead({
  title: useI18n().t('sidebar.news'),
});
</script>

<template>
  <News/>
</template>

<style scoped>

</style>
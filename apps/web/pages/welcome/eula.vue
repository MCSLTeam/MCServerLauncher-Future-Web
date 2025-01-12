<script setup lang="ts">
import Eula from "@repo/commons/src/pages/welcome/Eula.vue";

definePageMeta({
  layout: 'empty',
});

useHead({
  title: useI18n().t('eula.title'),
});
</script>

<template>
  <Eula/>
</template>

<style scoped>

</style>

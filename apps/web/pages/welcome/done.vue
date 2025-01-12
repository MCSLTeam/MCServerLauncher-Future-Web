<script setup lang="ts">
import Done from "@repo/commons/src/pages/welcome/Done.vue";

definePageMeta({
	layout: 'empty',
});

useHead({
	title: useI18n().t('welcome.done.title'),
});
</script>

<template>
	<Done/>
</template>

<style scoped>
</style>

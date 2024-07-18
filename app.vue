<script setup lang="ts">
import 'animate.css';
import '~/assets/css/style.css';
import '~/assets/css/fontawesome.min.css';
import 'element-plus/theme-chalk/dark/css-vars.css';

useDarkMode().loadTheme();

useHead({
	titleTemplate: (titleChunk) => {
		return titleChunk
			? `${titleChunk} | MCSL Future Web`
			: 'MCSL Future Web';
	},
});
</script>

<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>

<style scoped></style>

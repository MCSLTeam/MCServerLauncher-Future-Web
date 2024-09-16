<script setup lang="ts">
import 'animate.css';
import '~/assets/css/style.css';
import '~/assets/css/fontawesome.min.css';
import 'element-plus/theme-chalk/dark/css-vars.css';

useHead({
	titleTemplate: (titleChunk) => {
		return titleChunk
			? `${titleChunk} | ` + 'MCSL Future Web'
			: 'MCSL Future Web';
	},
	link: [
		{
			// 图标
			rel: 'icon',
			type: 'image/png',
			href: isAprilFoolsDay() // 判断愚人节，使用愚人节图标
				? '/assets/img/favicon-aprilfools.png'
				: '/assets/img/favicon.png',
		},
	],
});

// 加载
loadApp();
</script>

<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>

<style scoped></style>

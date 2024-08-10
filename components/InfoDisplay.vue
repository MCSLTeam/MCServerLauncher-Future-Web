<!-- 信息展示，类似ElementPlus的Statistics但是可以放文本 -->
<script setup lang="ts">
defineProps({
	title: {
		type: String,
		required: true,
	},
	value: {
		type: String,
		required: true,
	},
});
</script>

<template>
	<div class="info-display">
		<h2>{{ title }}</h2>
		<p>{{ value }}</p>
	</div>
</template>

<style scoped>
@media (max-width: 768px) {
	.info-display {
		text-align: center;
	}
}

.info-display h2 {
	font-size: var(--el-font-size-large);
	color: var(--el-text-color-primary);
	font-weight: var(--el-font-weight-primary);
	margin: 0;
	width: 100%;
}

.info-display p {
	color: var(--el-text-color-regular);
	font-size: var(--el-font-size-medium);
	margin: 0;
	width: 100%;
}
</style>

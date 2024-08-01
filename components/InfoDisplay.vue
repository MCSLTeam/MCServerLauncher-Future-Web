<script setup lang="ts">
import type {PropType} from 'vue';

defineProps({
	title: {
		type: String,
		required: true,
	},
	value: {
		type: Object as PropType<string | number>,
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

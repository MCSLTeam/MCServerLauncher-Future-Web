<script setup lang="ts">
defineProps({
	light: {
		type: String,
		required: false,
		default: '9',
	},
});
</script>

<template>
	<div class="bg__container">
		<div
			class="bg__circle bg__circle1"
			:style="[
				'background: var(--el-color-success-light-' + light + ')',
			]" />
		<div
			class="bg__circle bg__circle2"
			:style="[
				'background: var(--el-color-primary-light-' + light + ')',
			]" />
	</div>
</template>

<style scoped>
.bg__container {
	width: 100vw;
	height: 100vh;
	position: fixed;
	top: 0;
	left: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}

.bg__circle {
	filter: blur(1145px);
	position: fixed;
	border-radius: 114514px;
	height: 600px;
}

.bg__circle1 {
	top: -120px;
	left: -80px;
	width: 550px;
	@media (min-width: 1024px) {
		width: 680px;
	}
}

.bg__circle2 {
	bottom: -50px;
	right: -80px;
	width: 800px;
	@media (min-width: 1024px) {
		width: 900px;
	}
}
</style>

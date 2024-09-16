<!-- 默认布局 -->
<script setup lang="ts"></script>

<template>
	<div class="default-layout__max-screen">
		<LoadingOverlay />
		<div class="default-layout__max-screen">
			<ElContainer
				v-show="canHideOverlay"
				class="default-layout__max-screen">
				<!-- 侧边栏 -->
				<Sidebar class="default-layout__sidebar" />
				<slot />
			</ElContainer>
		</div>
	</div>
</template>

<style scoped>
.default-layout__max-screen {
	width: 100%;
	height: 100%;
}

.default-layout__sidebar {
	animation: 0.5s ease-in-out fadeInLeft;
}
</style>

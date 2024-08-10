<!-- 页面组件（侧边栏右侧） -->
<script setup lang="ts">
import Header from '~/components/page/Header.vue';
import Footer from '~/components/page/Footer.vue';
</script>

<template>
	<ElContainer direction="vertical">
		<!-- 导航栏 -->
		<Header>
			<template #breadcrumb>
				<slot name="breadcrumb" />
			</template>
			<template #start>
				<slot name="nav-start" />
			</template>
			<template #end>
				<slot name="nav-end" />
			</template>
		</Header>
		<!-- 页面内容 -->
		<ElMain class="page__main">
			<ElScrollbar>
				<slot name="default" />
				<Footer />
			</ElScrollbar>
		</ElMain>
	</ElContainer>
</template>

<style scoped>
.page__main {
	padding: 0;
}
</style>

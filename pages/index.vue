<script lang="ts" setup>
const i18n = useI18n();

useHead({
	title: i18n.t('sidebar.home'),
});
</script>

<template>
	<ElContainer>
		<Header>
			<template #breadcrumb>
				<el-breadcrumb-item>{{
					$t('sidebar.home')
				}}</el-breadcrumb-item>
			</template>
		</Header>
		<el-main class="index__main">
			<el-scrollbar />
		</el-main>
	</ElContainer>
</template>

<style scoped>
.index__main {
	padding: 0;
}
</style>

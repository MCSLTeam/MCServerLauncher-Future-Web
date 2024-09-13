<script lang="ts" setup>
useHead({
	title: useI18n().t('sidebar.instances'),
});
</script>

<template>
	<Page>
		<template #breadcrumb>
			<ElBreadcrumbItem>
				{{ $t('sidebar.instances') }}
			</ElBreadcrumbItem>
		</template>
	</Page>
</template>

<style scoped></style>

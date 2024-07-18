<script lang="ts" setup></script>

<template>
	<ElContainer>
		<el-header class="instances__header">
			<el-breadcrumb class="instances__breadcrumb" separator="/">
				<el-breadcrumb-item>{{
					$t('sidebar.instances')
				}}</el-breadcrumb-item>
			</el-breadcrumb>
		</el-header>
		<el-main class="instances__main">
			<el-scrollbar />
		</el-main>
	</ElContainer>
</template>

<style scoped>
.instances__header {
	width: calc(100% - 40px);
	height: 60px;
	margin: 10px;
	border-radius: 10px;
	padding: 20px;
	border: 1px solid var(--el-border-color);
	box-shadow: var(--el-box-shadow);
	animation: 0.5s ease-in-out fadeIn;
	display: flex;
	justify-content: start;
	align-items: center;
}

.instances__main {
	padding: 0 25px 25px 0;
}

.instances__breadcrumb .el-breadcrumb__item {
	font-size: var(--el-font-size-medium);
}
</style>

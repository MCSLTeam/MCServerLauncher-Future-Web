<!-- 导航栏 -->
<script setup lang="ts">
const showSidebar = ref(false);
</script>

<template>
	<ElHeader class="header__container el-card">
		<!-- 面包屑 -->
		<div>
			<ElBreadcrumb separator="/">
				<slot name="breadcrumb" />
			</ElBreadcrumb>
			<slot name="start" />
		</div>
		<!-- 手机端侧边栏抽屉 -->
		<div>
			<ElDrawer
				v-if="useScreenWidth().value == 'sm'"
				v-model="showSidebar"
				class="header__sidebar-drawer"
				size="80%"
				direction="ltr">
				<template #header>
					<SidebarLogo />
				</template>
				<Sidebar :is-in-drawer="true" />
			</ElDrawer>
			<slot name="end" />
			<!-- 打开侧边栏按钮 -->
			<ElButton
				v-if="useScreenWidth().value == 'sm'"
				class="header__menu-button"
				@click="showSidebar = true">
				<i class="fa fa-bars" />
			</ElButton>
		</div>
	</ElHeader>
</template>

<style scoped>
.header__container {
	width: calc(100% - 10px);
	height: 60px;
	margin: 10px 10px 0 0;
	border-radius: 15px;
	padding: 10px 20px;
	border: 1px solid var(--el-card-border-color);
	box-shadow: var(--el-box-shadow);
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.header__menu-button {
	border: none;
	width: 35px;
	height: 35px;
	border-radius: 7px;
}
</style>

<style>
.header__sidebar-drawer .el-drawer__header {
	margin-bottom: 0;
}

.header__sidebar-drawer .el-drawer__body {
	padding-top: 0;
}
</style>

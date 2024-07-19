<script setup lang="ts"></script>

<template>
	<div class="sidebar__logo-container">
		<ElImage src="/assets/img/MCSLFuture.png" alt="" />
		<p>
			{{ $t('app.name.abbr') }}
			<span>{{ $t('app.name.suffix') }}</span>
		</p>
	</div>
</template>

<style scoped>
.sidebar__logo-container {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 10px;
	flex-shrink: 0;
}

.sidebar__collapsed .sidebar__logo-container p {
	display: none;
}

.sidebar__logo-container .el-image {
	width: 48px;
	height: 48px;
}

.sidebar__collapsed .sidebar__logo-container .el-image {
	width: 40px;
	height: 40px;
}

.sidebar__logo-container p {
	font-size: var(--el-font-size-extra-large);
	margin: 0 7px;
	color: var(--el-text-color-primary);
}

.sidebar__logo-container p span {
	font-weight: bold;
	color: transparent;
	background: linear-gradient(
		135deg,
		var(--el-color-primary),
		var(--el-color-primary-dark-2)
	);
	background-clip: text;
}
</style>

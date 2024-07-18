<script setup lang="ts"></script>

<template>
	<div class="auth__container">
		<div class="auth__logo">
			<img src="/assets/img/MCSLFuture.png" alt="logo" >
			<h1>
				{{ $t('app.name.abbr') }}
				<span>{{ $t('app.name.suffix') }}</span>
			</h1>
		</div>
		<ElCard class="auth__card">
			<slot />
		</ElCard>
	</div>
</template>

<style scoped>
.auth__card {
	margin: 1rem;
	border-radius: 1rem;
	padding: 1rem 1rem 0 1rem;
	width: calc(90% - 2rem);
	max-width: 30rem;
}

.auth__container {
	width: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
}

.auth__logo {
	height: 7rem;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	margin: 1rem;
}

.auth__logo img {
	height: 7rem;
	@media (max-width: 768px) {
		height: 5rem;
	}
}

.auth__logo h1 {
	font-weight: var(--el-font-weight-primary);
	color: var(--el-text-color-primary);
	font-size: 2.5rem;
}

.auth__logo h1 span {
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
